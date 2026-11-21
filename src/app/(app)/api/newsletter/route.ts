import configPromise from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// Light per-IP throttle: 5 attempts per 10 minutes.
// In-memory, so on serverless hosting each instance counts separately. It stops
// casual abuse; for hard limits use your host's WAF / rate limiting.
const WINDOW_MS = 10 * 60 * 1000
const MAX_HITS = 5
const hits = new Map<string, number[]>()

function isLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)

  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (!times.some((t) => now - t < WINDOW_MS)) hits.delete(key)
    }
  }
  return recent.length > MAX_HITS
}

const json = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status })

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (isLimited(ip)) {
    return json({ ok: false, error: 'Too many attempts. Please try again later.' }, 429)
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return json({ ok: false, error: 'Invalid request.' }, 400)
  }

  // Honeypot: real visitors never see or fill this field, bots do.
  // Pretend it worked so the bot learns nothing.
  if (typeof body.company === 'string' && body.company.length > 0) {
    return json({ ok: true })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return json({ ok: false, error: 'Please enter a valid email address.' }, 400)
  }

  const source =
    typeof body.source === 'string' && body.source.trim()
      ? body.source.trim().slice(0, 100)
      : 'website'

  try {
    const payload = await getPayload({ config: configPromise })

    const existing = await payload.find({
      collection: 'subscribers',
      where: { email: { equals: email } },
      limit: 1,
      depth: 0,
      pagination: false,
      overrideAccess: true,
    })

    // Already on the list (or opted out): answer "ok" either way so the form
    // can't be used to find out who is subscribed, and never undo an opt-out.
    if (existing.docs.length > 0) return json({ ok: true })

    await payload.create({
      collection: 'subscribers',
      data: { email, status: 'subscribed', source },
      overrideAccess: true,
    })

    return json({ ok: true })
  } catch (err) {
    // Two simultaneous sign-ups can race past the check above and trip the unique index.
    if (/unique|duplicate|already/i.test(String(err))) return json({ ok: true })

    console.error('[newsletter] sign-up failed', err)
    return json({ ok: false, error: 'Something went wrong. Please try again.' }, 500)
  }
}
