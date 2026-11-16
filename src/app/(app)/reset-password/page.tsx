import type { Metadata } from 'next'

import { ResetPasswordForm } from '@/components/forms/ResetPasswordForm'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string | string[] }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams

  return (
    <div className="container">
      <ResetPasswordForm token={typeof token === 'string' ? token : undefined} />
    </div>
  )
}

export const metadata: Metadata = {
  description: 'Choose a new password for your Stereo Luxury account.',
  openGraph: mergeOpenGraph({
    title: 'Reset Password',
    url: '/reset-password',
  }),
  title: 'Reset Password',
}
