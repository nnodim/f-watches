/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Endpoint } from 'payload'
import crypto from 'crypto'
import { PaystackAdapterArgs } from '.'

type Props = {
  secretKey: PaystackAdapterArgs['secretKey']
  webhooks?: PaystackAdapterArgs['webhooks']
  webhookSecret: PaystackAdapterArgs['webhookSecret']
}

export const webhooksEndpoint: (props: Props) => Endpoint = (props) => {
  const { secretKey, webhooks } = props || {}

  const handler: Endpoint['handler'] = async (req) => {
    let returnStatus = 200

    if (secretKey && req.text) {
      const body = await req.text()
      const paystackSignature = req.headers.get('x-paystack-signature')

      if (paystackSignature) {
        let event: any

        try {
          // Verify Paystack webhook signature
          const hash = crypto.createHmac('sha512', secretKey).update(body).digest('hex')
          if (hash !== paystackSignature) {
            req.payload.logger.error('Invalid Paystack webhook signature')
            returnStatus = 400
          } else {
            event = JSON.parse(body)
          }
        } catch (err: unknown) {
          const msg: string = err instanceof Error ? err.message : JSON.stringify(err)
          req.payload.logger.error(`Error parsing Paystack webhook: ${msg}`)
          returnStatus = 400
        }

        if (typeof webhooks === 'object' && event) {
          const webhookEventHandler = webhooks[event.event]

          if (typeof webhookEventHandler === 'function') {
            try {
              await webhookEventHandler({
                event,
                req,
              })
            } catch (err: unknown) {
              const msg: string = err instanceof Error ? err.message : JSON.stringify(err)
              req.payload.logger.error(`Error handling Paystack webhook: ${msg}`)
              returnStatus = 500
            }
          }
        }
      } else {
        req.payload.logger.error('Missing Paystack signature header')
        returnStatus = 400
      }
    }

    return Response.json({ received: true }, { status: returnStatus })
  }

  return {
    handler,
    method: 'post',
    path: '/webhooks',
  }
}
