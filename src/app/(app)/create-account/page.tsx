import type { Metadata } from 'next'

import { RenderParams } from '@/components/RenderParams'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'

import { CreateAccountForm } from '@/components/forms/CreateAccountForm'
import { redirect } from 'next/navigation'
import Image from 'next/image'

export default async function CreateAccount() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  if (user) {
    redirect(`/account?warning=${encodeURIComponent('You are already logged in.')}`)
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <div className="flex flex-col gap-2 mb-6">
              <h1 className="text-2xl font-bold">Create your account</h1>
              <p className="text-sm text-balance">Enter your details to create an account.</p>
            </div>
            <RenderParams />
            <CreateAccountForm />
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
  description: 'Create an account or log in to your existing account.',
  openGraph: mergeOpenGraph({
    title: 'Account',
    url: '/account',
  }),
  title: 'Account',
}
