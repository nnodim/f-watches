import { Mail } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'

import Link from 'next/link'

type CheckEmailPageProps = {
  searchParams: Promise<{
    email?: string
  }>
}

export default async function CheckEmailPage({ searchParams }: CheckEmailPageProps) {
  const { email } = await searchParams

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full bg-background p-8 shadow-sm md:p-12">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Mail className="h-6 w-6" />
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tight">Check your email</h1>
              <p className="text-muted-foreground">
                We sent a verification link to{' '}
                <span className="font-medium text-foreground">{email || 'your email address'}</span>
                . Open the message and verify your account before trying to log in.
              </p>
              <p className="text-muted-foreground">
                If you do not see the email, check your spam folder. Once verified, you can continue
                to the login page.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Go to login
              </Link>
              <Link
                href="/create-account"
                className="inline-flex h-11 items-center justify-center rounded-md border px-6 text-sm font-medium transition-colors hover:bg-accent"
              >
                Use a different email
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image
          src="/images/signup-bg.jpg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover "
          width={500}
          height={1000}
        />
      </div>
    </div>
  )
}

export const metadata: Metadata = {
  description: 'Check your inbox to verify your account before logging in.',
  title: 'Check Your Email',
}
