'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Reveal } from '@/components/motion/Reveal'
import type { NewsletterBlock as Props } from '@/payload-types'
import React, { useState } from 'react'

export const NewsletterBlock: React.FC<Props> = ({
  heading,
  description,
  buttonLabel,
  endpoint,
}) => {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const email = data.get('email')
    const company = data.get('company') // honeypot, must stay empty
    setState('loading')
    try {
      const res = await fetch(endpoint || '/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, company }),
      })
      setState(res.ok ? 'done' : 'error')
    } catch {
      setState('error')
    }
  }

  return (
    <section className="bg-primary text-primary-foreground">
      <div className="container flex flex-col items-start justify-between gap-8 py-16 md:flex-row md:items-center">
        <Reveal className="max-w-md">
          <h2 className="text-3xl font-light tracking-tight md:text-4xl">{heading}</h2>
          {description && <p className="mt-3 text-primary-foreground/75">{description}</p>}
        </Reveal>

        <Reveal className="w-full md:max-w-lg">
          {state === 'done' ? (
            <p role="status" className="text-lg">
              Thank you, you&apos;re on the list.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              {/* Honeypot: hidden from people and screen readers, bots fill it in */}
              <input
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
              />
              <Input
                id="newsletter-email"
                name="email"
                type="email"
                required
                placeholder="Email address"
                className="h-12 rounded-none border-primary-foreground/40 bg-transparent text-primary-foreground placeholder:text-primary-foreground/60"
              />
              <Button
                type="submit"
                disabled={state === 'loading'}
                className="h-12 rounded-none bg-primary-foreground px-8 uppercase tracking-[0.18em] text-primary hover:bg-primary-foreground/90"
              >
                {state === 'loading' ? 'Sending…' : buttonLabel || 'Subscribe'}
              </Button>
            </form>
          )}
          {state === 'error' && (
            <p role="alert" className="mt-3 text-sm">
              Something went wrong. Please try again.
            </p>
          )}
        </Reveal>
      </div>
    </section>
  )
}
