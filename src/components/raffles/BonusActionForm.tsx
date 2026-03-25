'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

type BonusAction = {
  actionType: string
  bonusEntryCount: number
  id: string
  status: string
}

const actionOptions = [
  { bonusEntryCount: 1, label: 'Follow our page', value: 'follow' },
  { bonusEntryCount: 2, label: 'Repost campaign ad', value: 'repost' },
  { bonusEntryCount: 1, label: 'Tag our page', value: 'tag-page' },
  { bonusEntryCount: 1, label: 'Tag friends', value: 'tag-friends' },
]

export function BonusActionForm(props: {
  existingActions: BonusAction[]
  purchaseID?: string
  raffleID: string
}) {
  const { existingActions, purchaseID } = props
  const { user } = useAuth()
  const router = useRouter()
  const [customerEmail, setCustomerEmail] = useState(user?.email || '')
  const [actionType, setActionType] = useState(actionOptions[0]?.value || 'follow')
  const [socialHandle, setSocialHandle] = useState('')
  const [proofScreenshot, setProofScreenshot] = useState<File | null>(null)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submittedTypes = new Set(existingActions.map((action) => action.actionType))
  const availableActionOptions = actionOptions.filter((option) => !submittedTypes.has(option.value))

  const submitAction = async () => {
    if (!purchaseID) {
      toast.error('Missing purchase reference for bonus activity submission.')
      return
    }

    if (!user?.email && !customerEmail.trim()) {
      toast.error('Enter the email used for your ticket purchase.')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append(
        '_payload',
        JSON.stringify({
          actionType,
          customerEmail: user?.email || customerEmail.trim(),
          notes,
          purchaseID,
          socialHandle,
        }),
      )

      if (proofScreenshot) {
        formData.append('file', proofScreenshot)
      }

      const response = await fetch('/api/raffles/bonus-actions/submit', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.message || 'Unable to submit bonus action.')
      }

      toast.success('Bonus action submitted for review.')
      setSocialHandle('')
      setProofScreenshot(null)
      setNotes('')
      const nextAvailable = availableActionOptions.find((option) => option.value !== actionType)
      if (nextAvailable) setActionType(nextAvailable.value)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to submit bonus action.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {actionOptions.map((option) => {
          const submitted = existingActions.find((item) => item.actionType === option.value)
          return (
            <div
              className="flex items-center justify-between rounded-2xl border px-4 py-3"
              key={option.value}
            >
              <div>
                <p className="font-medium">{option.label}</p>
                <p className="text-sm text-muted-foreground">+{option.bonusEntryCount} bonus entries</p>
              </div>
              <span className="text-sm capitalize text-muted-foreground">
                {submitted ? submitted.status : 'not submitted'}
              </span>
            </div>
          )
        })}
      </div>

      {availableActionOptions.length > 0 ? (
        <div className="space-y-4 rounded-3xl border p-6">
          {!user?.email && (
            <div className="space-y-2">
              <Label htmlFor="bonus-email">Purchase email</Label>
              <Input
                id="bonus-email"
                onChange={(event) => setCustomerEmail(event.target.value)}
                placeholder="you@example.com"
                type="email"
                value={customerEmail}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="bonus-action-type">Activity</Label>
            <select
              className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm"
              id="bonus-action-type"
              onChange={(event) => setActionType(event.target.value)}
              value={actionType}
            >
              {availableActionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bonus-handle">Social handle</Label>
            <Input
              id="bonus-handle"
              onChange={(event) => setSocialHandle(event.target.value)}
              placeholder="@yourhandle"
              value={socialHandle}
            />
          </div>

          {actionType !== 'follow' && (
            <div className="space-y-2">
              <Label htmlFor="bonus-proof-screenshot">Screenshot proof</Label>
              <Input
                id="bonus-proof-screenshot"
                accept="image/*"
                onChange={(event) => setProofScreenshot(event.target.files?.[0] || null)}
                type="file"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="bonus-notes">Notes</Label>
            <Input
              id="bonus-notes"
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional details for review"
              value={notes}
            />
          </div>

          <Button className="w-full" disabled={isSubmitting} onClick={submitAction}>
            {isSubmitting ? 'Submitting...' : 'Submit Bonus Activity'}
          </Button>
        </div>
      ) : (
        <div className="rounded-3xl border p-6 text-sm text-muted-foreground">
          You have already submitted all available bonus activities for this purchase.
        </div>
      )}
    </div>
  )
}
