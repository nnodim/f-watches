'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import { socialCampaignConfig } from '@/lib/instagram'

type BonusAction = {
  actionType: string
  id: string
  socialHandle?: null | string
  status: string
}

const actionOptions = [
  {
    bonusEntryCount: 1,
    description: 'Follow our Instagram page',
    value: 'follow',
    href: socialCampaignConfig.instagramProfileURL,
  },
  {
    bonusEntryCount: 1,
    description: 'Repost the official campaign ad',
    value: 'repost',
    href: socialCampaignConfig.instagramCampaignURL,
  },
  {
    bonusEntryCount: 1,
    description: 'Tag 3 friends under the campaign post',
    value: 'tag-friends',
    href: socialCampaignConfig.instagramCampaignURL,
  },
]

export function BonusActionForm(props: { existingActions: BonusAction[]; purchaseID?: string }) {
  const { existingActions, purchaseID } = props
  const { user } = useAuth()
  const router = useRouter()
  const [customerEmail, setCustomerEmail] = useState(user?.email || '')
  const [socialHandle, setSocialHandle] = useState(
    existingActions.find((action) => action.socialHandle)?.socialHandle || '',
  )
  const [isSaving, setIsSaving] = useState(false)

  const actionStatusMap = useMemo(
    () => new Map(existingActions.map((action) => [action.actionType, action.status])),
    [existingActions],
  )

  const checkedActions = useMemo(
    () =>
      actionOptions
        .filter((option) => {
          const status = actionStatusMap.get(option.value)
          return status === 'pending' || status === 'approved'
        })
        .map((option) => option.value),
    [actionStatusMap],
  )

  const syncActions = async (selectedActions: string[]) => {
    if (!purchaseID) {
      toast.error('Missing purchase reference for bonus activity submission.')
      return
    }

    if (!user?.email && !customerEmail.trim()) {
      toast.error('Enter the email used for your ticket purchase.')
      return
    }

    if (!socialHandle.trim()) {
      toast.error('Enter your Instagram handle first.')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/raffles/bonus-actions/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerEmail: user?.email || customerEmail.trim(),
          purchaseID,
          selectedActions,
          socialHandle: socialHandle.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.message || 'Unable to update bonus activities.')
      }

      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update bonus activities.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
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
        <Label htmlFor="bonus-handle">Instagram handle</Label>
        <Input
          id="bonus-handle"
          onChange={(event) => setSocialHandle(event.target.value)}
          placeholder="@yourhandle"
          value={socialHandle}
        />
      </div>

      <div className="space-y-3">
        {actionOptions.map((option) => {
          const status = actionStatusMap.get(option.value) || 'not submitted'
          const isChecked = status === 'pending' || status === 'approved'
          const isLocked = status === 'approved'

          return (
            <div
              className="flex items-center justify-between gap-2 md:gap-4 rounded-2xl border p-2 lg:p-4"
              key={option.value}
            >
              <div className="flex items-start gap-2">
                <Checkbox
                  checked={isChecked}
                  className="mt-1"
                  disabled={isSaving || isLocked}
                  onCheckedChange={(checked) => {
                    const nextActions = checked
                      ? Array.from(new Set([...checkedActions, option.value]))
                      : checkedActions.filter((value) => value !== option.value)
                    void syncActions(nextActions)
                  }}
                />
                <div className="space-y-1">
                  <p className="font-medium text-sm md:text-base">{option.description}</p>
                  <Button
                    asChild
                    variant="outline"
                    className="px-2 md:px-4 font-normal text-xs md:text-sm"
                  >
                    <a href={option.href} rel="noreferrer" target="_blank">
                      Open Instagram
                    </a>
                  </Button>
                  <p className="text-[10px] md:text-sm text-muted-foreground">
                    +{option.bonusEntryCount} bonus entries
                  </p>
                </div>
              </div>
              <span className="text-xs capitalize text-muted-foreground">{status}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
