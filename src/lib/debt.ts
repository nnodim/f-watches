import type { PayloadRequest } from 'payload'

type DebtStatus = 'not-tracked' | 'unpaid' | 'partial' | 'paid' | 'overdue' | 'overpaid'

type SyncOrderDebtSummaryArgs = {
  orderID: string
  req: PayloadRequest
}

const getMinorUnitValue = (value?: null | number) => (typeof value === 'number' ? value : 0)

const resolveDebtStatus = ({
  debtTrackingEnabled,
  dueDate,
  orderAmount,
  amountOutstanding,
  amountPaid,
}: {
  amountOutstanding: number
  amountPaid: number
  debtTrackingEnabled?: boolean | null
  dueDate?: null | string
  orderAmount: number
}): DebtStatus => {
  if (!debtTrackingEnabled) return 'not-tracked'
  if (amountOutstanding < 0) return 'overpaid'
  if (amountOutstanding === 0) return 'paid'

  if (dueDate) {
    const dueAt = new Date(dueDate)
    if (!Number.isNaN(dueAt.getTime()) && dueAt.getTime() < Date.now()) {
      return 'overdue'
    }
  }

  if (amountPaid <= 0) return 'unpaid'
  if (amountPaid < orderAmount) return 'partial'

  return 'paid'
}

export const syncOrderDebtSummary = async ({
  orderID,
  req,
}: SyncOrderDebtSummaryArgs): Promise<void> => {
  const order = await req.payload.findByID({
    collection: 'orders',
    id: orderID,
    depth: 0,
    req,
    select: {
      amount: true,
      debtDueDate: true,
      debtTrackingEnabled: true,
    },
  })

  const orderAmount = getMinorUnitValue(order.amount)

  if (!order.debtTrackingEnabled) {
    await req.payload.update({
      collection: 'orders',
      id: orderID,
      context: {
        ...(req.context || {}),
        skipDebtSync: true,
      },
      data: {
        amountOutstanding: 0,
        amountPaid: orderAmount,
        debtLastPaymentAt: null,
        debtStatus: 'not-tracked',
      },
      req,
    })

    return
  }

  const debtPayments = await req.payload.find({
    collection: 'debt-payments',
    depth: 0,
    limit: 1000,
    pagination: false,
    req,
    sort: '-paidAt',
    where: {
      order: {
        equals: orderID,
      },
    },
    select: {
      amount: true,
      paidAt: true,
    },
  })

  const amountPaid = debtPayments.docs.reduce((sum, payment) => {
    return sum + getMinorUnitValue(payment.amount)
  }, 0)

  const amountOutstanding = orderAmount - amountPaid
  const latestPayment = debtPayments.docs[0]?.paidAt || null
  const debtStatus = resolveDebtStatus({
    amountOutstanding,
    amountPaid,
    debtTrackingEnabled: order.debtTrackingEnabled,
    dueDate: order.debtDueDate,
    orderAmount,
  })

  await req.payload.update({
    collection: 'orders',
    id: orderID,
    context: {
      ...(req.context || {}),
      skipDebtSync: true,
    },
    data: {
      amountOutstanding,
      amountPaid,
      debtLastPaymentAt: latestPayment,
      debtStatus,
    },
    req,
  })
}

