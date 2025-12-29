import { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'
import type { PaystackAdapterArgs } from './index.js'
import { handlePaystackSuccess } from '@/lib/utils.js'

type Props = {
  secretKey: PaystackAdapterArgs['secretKey']
}

export const confirmOrder: (props: Props) => NonNullable<PaymentAdapter>['confirmOrder'] =
  (props) =>
  async ({ data, req }) => {
    const payload = req.payload
    const { secretKey } = props || {}
    const reference = data.paymentReference as string

    if (!secretKey) throw new Error('Paystack secret key is required')
    if (!reference) throw new Error('Transaction reference is required')

    try {
      // 1. Find the local transaction
      const transactionsResults = await payload.find({
        collection: 'transactions',
        where: { 'paystack.reference': { equals: reference } },
      })

      const transaction = transactionsResults.docs[0]
      if (!transaction) throw new Error('No transaction found for the provided reference')

      // 2. CHECK: Has Webhook already processed this?
      // If status is 'succeeded' and order is linked, we are done. FAST EXIT.
      if (transaction.status === 'succeeded' && transaction.order) {
        console.log('Payment confirmed successfully (via webhook)')
        return {
          message: 'Payment confirmed successfully (via webhook)',
          orderID: typeof transaction.order === 'object' ? transaction.order.id : transaction.order,
          transactionID: transaction.id,
          // We intentionally OMIT transactionID here to prevent double inventory deduction
          // in the generic handler.
        }
      }

      // 3. Fallback: Webhook hasn't fired yet. Verify manually.
      const verifyResponse = await fetch(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      )

      if (!verifyResponse.ok) throw new Error('Failed to verify transaction with Paystack')
      const verifyData = await verifyResponse.json()
      const transaction_data = verifyData.data

      if (transaction_data.status !== 'success') {
        throw new Error('Transaction was not successful')
      }

      console.log('Payment confirmation through comfirmOrder handler')

      // 4. Run the Shared Logic (Atomic processing)
      const result = await handlePaystackSuccess({
        payload,
        transaction,
        paystackData: transaction_data,
        req,
      })

      if (!result.transactionID) {
        // Enforce the non-optional return contract
        throw new Error('Handler did not return a transactionID')
      }      

      return {
        message: result.message,
        orderID: result.orderID,
        transactionID: result.transactionID,
      }
    } catch (error) {
      payload.logger.error(error, 'Error confirming payment with Paystack')
      throw new Error(error instanceof Error ? error.message : 'Unknown error confirming payment')
    }
  }
