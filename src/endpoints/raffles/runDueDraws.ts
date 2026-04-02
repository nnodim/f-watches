import type { Endpoint } from 'payload'

import { runDueRaffles } from '@/lib/raffles'

const headerName = 'x-raffle-cron-secret'

const getBearerToken = (authorizationHeader: string | null) => {
  if (!authorizationHeader?.startsWith('Bearer ')) return null
  return authorizationHeader.slice('Bearer '.length).trim()
}

const authorizeRequest = (req: Parameters<NonNullable<Endpoint['handler']>>[0]) => {
  const configuredSecret = process.env.RAFFLE_CRON_SECRET || process.env.CRON_SECRET
  const receivedSecret = req.headers.get(headerName)
  const bearerToken = getBearerToken(req.headers.get('authorization'))
  const isAdmin = req.user?.roles?.includes('admin')

  if (isAdmin) return true
  if (!configuredSecret) return false

  return receivedSecret === configuredSecret || bearerToken === configuredSecret
}

const handler: Endpoint['handler'] = async (req) => {
  if (!authorizeRequest(req)) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const results = await runDueRaffles({
    payload: req.payload,
    req,
  })

  return Response.json({
    message: 'Processed due raffles.',
    processedAt: new Date().toISOString(),
    results,
  })
}

export const runDueRafflesEndpoint: Endpoint = {
  method: 'post',
  path: '/run-due-draws',
  handler,
}

export const runDueRafflesGetEndpoint: Endpoint = {
  method: 'get',
  path: '/run-due-draws',
  handler: async (req) => {
    return handler(req)
  },
}
