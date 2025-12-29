import type { Field, GroupField, PayloadRequest } from 'payload'

import {
  PaymentAdapter,
  PaymentAdapterArgs,
  PaymentAdapterClient,
  PaymentAdapterClientArgs,
} from '@payloadcms/plugin-ecommerce/types'
import { confirmOrder } from './confirmOrder'
import { webhooksEndpoint } from './webhooks'
import { initiatePayment } from './initiatePayment'

type PaystackWebhookHandler = (args: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event: any // Paystack webhook event
  req: PayloadRequest
}) => Promise<void> | void

type PaystackWebhookHandlers = {
  /**
   * Description of the event (e.g., charge.success or subscription.create).
   */
  [webhookName: string]: PaystackWebhookHandler
}

export type PaystackAdapterArgs = {
  /**
   * Paystack public key for client-side operations
   */
  publicKey: string
  /**
   * Paystack secret key for server-side operations
   */
  secretKey: string
  /**
   * Webhook secret for verifying webhook signatures
   */
  webhookSecret: string
  /**
   * Optional webhook handlers for different Paystack events
   */
  webhooks?: PaystackWebhookHandlers
} & PaymentAdapterArgs

export const paystackAdapter: (props: PaystackAdapterArgs) => PaymentAdapter = (props) => {
  const { groupOverrides, secretKey, webhooks, webhookSecret } = props
  const label = props?.label || 'Paystack'

  const baseFields: Field[] = [
    {
      name: 'customerCode',
      type: 'text',
      label: 'Paystack Customer Code',
    },
    {
      name: 'accessCode',
      type: 'text',
      label: 'Paystack Access Code',
    },
    {
      name: 'reference',
      type: 'text',
      label: 'Paystack Transaction Reference',
    },
    {
      name: 'transactionId',
      type: 'text',
      label: 'Paystack Transaction ID',
    },
    {
      name: 'paidAt',
      type: 'text',
      label: 'Paystack Transaction Date',
    },
    {
      name: 'channel',
      type: 'text',
      label: 'Paystack Payment Channel',
    },
  ]

  const groupField: GroupField = {
    name: 'paystack',
    type: 'group',
    ...groupOverrides,
    admin: {
      condition: (data) => {
        const path = 'paymentMethod'
        return data?.[path] === 'paystack'
      },
      ...groupOverrides?.admin,
    },
    fields:
      groupOverrides?.fields && typeof groupOverrides?.fields === 'function'
        ? groupOverrides.fields({ defaultFields: baseFields })
        : baseFields,
  }

  return {
    name: 'paystack',
    confirmOrder: confirmOrder({
      secretKey,
    }),
    endpoints: [webhooksEndpoint({ secretKey, webhooks, webhookSecret })],
    group: groupField,
    initiatePayment: initiatePayment({
      secretKey,
    }),
    label,
  }
}

export type PaystackAdapterClientArgs = {
  /**
   * Paystack public key for client-side operations
   */
  publicKey: string
} & PaymentAdapterClientArgs

export const paystackAdapterClient: (
  props: PaystackAdapterClientArgs,
) => PaymentAdapterClient = () => {
  return {
    name: 'paystack',
    confirmOrder: true,
    initiatePayment: true,
    label: 'Card',
  }
}

export type InitiatePaymentReturnType = {
  accessCode: string
  authorizationUrl: string
  message: string
  reference: string
}
