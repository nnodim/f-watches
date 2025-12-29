/* eslint-disable @typescript-eslint/no-explicit-any */
import { OrderConfirmationEmailHtml } from '@/components/emails/RecieptEmail'
import { Transaction } from '@/payload-types'
import type { Payload, PayloadRequest } from 'payload'

type ProcessPaymentArgs = {
  payload: Payload
  transaction: Transaction
  paystackData: any
  req: PayloadRequest
}

export const handlePaystackSuccess = async ({
  payload,
  transaction,
  paystackData,
  req,
}: ProcessPaymentArgs) => {
  // 1. Idempotency Check: If order already exists, stop processing
  if (transaction.order && transaction.status === 'succeeded') {
    return {
      orderID: typeof transaction.order === 'object' ? transaction.order.id : transaction.order,
      message: 'Order already processed',
    }
  }

  const cartID = paystackData.metadata.cartID
  const cartItemsSnapshot = paystackData.metadata.cartItemsSnapshot
    ? JSON.parse(paystackData.metadata.cartItemsSnapshot)
    : []
  const shippingAddress = paystackData.metadata.shippingAddress
    ? JSON.parse(paystackData.metadata.shippingAddress)
    : undefined
  const customerEmail = paystackData.customer.email

  // 2. Create the Order
  const order = await payload.create({
    collection: 'orders',
    data: {
      amount: paystackData.amount,
      currency: paystackData.currency,
      // If we have a user in the transaction, link them, otherwise use email
      customer: req.user ? req.user.id : undefined,
      customerEmail: customerEmail || req.user?.email,
      shippingAddress,
      status: 'processing',
      transactions: [transaction.id],
      items: cartItemsSnapshot,
    },
  })

  // 3. Update Cart (Mark as purchased)
  if (cartID) {
    await payload.update({
      id: cartID,
      collection: 'carts',
      data: { purchasedAt: new Date().toISOString() },
    })
  }

  // 4. Update Inventory (Atomic Operation)
  // We handle this here so it happens even if the user closes the browser
  // if (Array.isArray(cartItemsSnapshot)) {
  //   for (const item of cartItemsSnapshot) {
  //     if (item.variant) {
  //       const id = typeof item.variant === 'object' ? item.variant.id : item.variant
  //       const variantDoc = await payload.findByID({ id, collection: 'variants', depth: 0 })
  //       const currentInventory = (variantDoc.inventory as number) || 0
  //       await payload.update({
  //         id,
  //         collection: 'variants',
  //         data: { inventory: currentInventory - (item.quantity || 0) },
  //       })
  //     } else if (item.product) {
  //       const id = typeof item.product === 'object' ? item.product.id : item.product
  //       const productDoc = await payload.findByID({ id, collection: 'products', depth: 0 })
  //       const currentInventory = (productDoc.inventory as number) || 0
  //       await payload.update({
  //         id,
  //         collection: 'products',
  //         data: { inventory: currentInventory - (item.quantity || 0) },
  //       })
  //     }
  //   }
  // }

  // 5. Update Transaction Status & Link Order
  await payload.update({
    id: transaction.id,
    collection: 'transactions',
    data: {
      order: order.id,
      status: 'succeeded',
      paystack: {
        ...transaction.paystack,
        transactionId: paystackData.id,
        paidAt: paystackData.paid_at,
        channel: paystackData.channel,
        customerCode: paystackData.customer_code,
      },
    },
  })

  // 6. Send Email (Async - don't block the return if possible, or await if critical)
  try {
    const completeOrder = await payload.findByID({ collection: 'orders', id: order.id, depth: 2 })
    const emailHtml = await OrderConfirmationEmailHtml({ order: completeOrder })
    await payload.sendEmail({
      to: customerEmail,
      subject: `Order Confirmation - #${order.id.slice(0, 8).toUpperCase()}`,
      html: emailHtml,
    })
  } catch (emailError) {
    payload.logger.error(emailError, 'Failed to send order confirmation email')
  }

  return {
    orderID: order.id,
    message: 'Order processed successfully',
    transactionID: transaction.id,
  }
}
