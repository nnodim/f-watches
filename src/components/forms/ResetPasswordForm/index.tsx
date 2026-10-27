'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Message } from '@/components/Message'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React, { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'

type FormData = {
  password: string
  passwordConfirm: string
}

type ResetPasswordFormProps = {
  token?: string
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ token }) => {
  const [error, setError] = useState('')
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<FormData>()

  const onSubmit = useCallback(
    async ({ password, passwordConfirm }: FormData) => {
      setError('')
      if (!token) {
        setError(
          'This password reset link is invalid or has expired. Request a new link to continue.',
        )
        return
      }
      if (password !== passwordConfirm) {
        setError('The passwords do not match.')
        return
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/reset-password`,
          {
            body: JSON.stringify({ password, token }),
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
          },
        )
        if (!response.ok) {
          setError(
            'This password reset link is invalid or has expired. Request a new link to continue.',
          )
          return
        }

        window.location.replace('/account')
      } catch {
        setError('We could not reset your password. Please try again.')
      }
    },
    [token],
  )

  return (
    <div className="max-w-xl py-12">
      <h1 className="mb-4 text-[1.8rem]">Reset password</h1>
      <p className="mb-8">Choose a new password for your Fwatches account.</p>
      <form className="" onSubmit={handleSubmit(onSubmit)}>
        <Message className="mb-8" error={error} />
        <div className="flex flex-col gap-8">
          <FormItem>
            <Label htmlFor="password">New password</Label>
            <Input
              autoComplete="new-password"
              id="password"
              type="password"
              {...register('password', {
                required: 'Please enter a new password.',
              })}
            />
            {errors.password && <FormError message={errors.password.message} />}
          </FormItem>
          <FormItem>
            <Label htmlFor="passwordConfirm">Confirm new password</Label>
            <Input
              autoComplete="new-password"
              id="passwordConfirm"
              type="password"
              {...register('passwordConfirm', {
                required: 'Please confirm your new password.',
              })}
            />
            {errors.passwordConfirm && <FormError message={errors.passwordConfirm.message} />}
          </FormItem>
        </div>
        <Button className="mt-8 rounded-none" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Updating password…' : 'Update password'}
        </Button>
      </form>
    </div>
  )
}
