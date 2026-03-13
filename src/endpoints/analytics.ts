/* eslint-disable @typescript-eslint/no-explicit-any */
import { checkRole } from '@/access/utilities'
import type { Order, Product, Transaction } from '@/payload-types'
import type {
  AnalyticsData,
  AnalyticsQuery,
  CustomerEmailSummary,
  CustomerProfitability,
  RecentDebtOrder,
  RecentOrder,
  RevenueDataPoint,
  SoldItemSummary,
  TopProduct,
  TransactionSummary,
} from '@/types/index'
import type { Endpoint, PayloadRequest } from 'payload'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const moneyFromKobo = (amount?: number | null) => (amount ?? 0) / 100

const normalizeEmail = (email?: null | string) => {
  const value = email?.trim().toLowerCase()
  return value ? value : null
}

type UnitAmounts = { unitPrice: number; unitCost: number }

const getItemUnitAmounts = (
  item: any,
  product: Product | undefined,
  currency: string,
): UnitAmounts => {
  const unitPriceKobo = item?.unitPrice
  const unitCostKobo = item?.unitCostPrice

  if (typeof unitPriceKobo === 'number' || typeof unitCostKobo === 'number') {
    return {
      unitPrice: moneyFromKobo(unitPriceKobo),
      unitCost: moneyFromKobo(unitCostKobo),
    }
  }

  if (product) {
    // @ts-expect-error Dynamic access for currency fields
    const price = product[`priceIn${currency}`] || 0
    // @ts-expect-error Dynamic access for currency fields
    const cost = product[`costPriceIn${currency}`] || 0
    return { unitPrice: moneyFromKobo(price), unitCost: moneyFromKobo(cost) }
  }

  return { unitPrice: 0, unitCost: 0 }
}

const formatPieData = (data: Record<string, number>, colors: string[]) =>
  Object.entries(data)
    .map(([name, value], i) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: colors[i % colors.length] || '#000',
    }))
    .sort((a, b) => b.value - a.value)

export const analyticsEndpoint: Endpoint = {
  method: 'get',
  path: '/analytics',
  handler: async (req: PayloadRequest) => {
    try {
      if (!req.user || !checkRole(['admin'], req.user)) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const query = req.query as AnalyticsQuery
      const customStartDate = query.startDate
      const customEndDate = query.endDate
      const hasCustomRange = Boolean(customStartDate && customEndDate)
      const fallbackDays = parseInt(query.days || '30')
      const now = new Date()

      let startDate: Date
      let endDate: Date
      let rangeDays = fallbackDays

      if (hasCustomRange) {
        startDate = new Date(`${customStartDate}T00:00:00.000Z`)
        endDate = new Date(`${customEndDate}T23:59:59.999Z`)

        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
          return Response.json({ error: 'Invalid date range' }, { status: 400 })
        }

        if (startDate > endDate) {
          return Response.json({ error: 'Start date must be before end date' }, { status: 400 })
        }

        rangeDays = Math.max(
          1,
          Math.ceil((endDate.getTime() - startDate.getTime() + 1) / (1000 * 60 * 60 * 24)),
        )
      } else {
        endDate = now
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - fallbackDays)
      }

      const startDateStr = startDate.toISOString()
      const endDateStr = endDate.toISOString()

      const previousEndDate = new Date(startDate)
      previousEndDate.setMilliseconds(previousEndDate.getMilliseconds() - 1)
      const previousStartDate = new Date(previousEndDate)
      previousStartDate.setDate(previousStartDate.getDate() - rangeDays + 1)
      const previousStartDateStr = previousStartDate.toISOString()
      const previousEndDateStr = previousEndDate.toISOString()

      let totalItemsSold = 0
      let previousItemsSold = 0

      const [
        currentOrdersRes,
        previousOrdersRes,
        currentExpensesRes,
        previousExpensesRes,
        currentDebtPaymentsRes,
        previousDebtPaymentsRes,
        activeDebtOrdersRes,
        totalProductsCount,
        currentTransactionsRes,
      ] = await Promise.all([
        req.payload.find({
          collection: 'orders',
          where: {
            createdAt: { greater_than_equal: startDateStr, less_than_equal: endDateStr },
          },
          limit: 2000,
          depth: 0,
          select: {
            amount: true,
            amountOutstanding: true,
            createdAt: true,
            currency: true,
            customer: true,
            customerEmail: true,
            debtDueDate: true,
            debtStatus: true,
            items: true,
            status: true,
            updatedAt: true,
          },
          sort: '-createdAt',
        }),
        req.payload.find({
          collection: 'orders',
          where: {
            createdAt: {
              greater_than_equal: previousStartDateStr,
              less_than_equal: previousEndDateStr,
            },
          },
          limit: 2000,
          depth: 0,
          select: {
            amount: true,
            createdAt: true,
            currency: true,
            customerEmail: true,
            items: true,
          },
          sort: '-createdAt',
        }),
        req.payload.find({
          collection: 'expenses',
          where: { date: { greater_than_equal: startDateStr, less_than_equal: endDateStr } },
          limit: 2000,
          depth: 0,
          sort: '-date',
        }),
        req.payload.find({
          collection: 'expenses',
          where: {
            date: {
              greater_than_equal: previousStartDateStr,
              less_than_equal: previousEndDateStr,
            },
          },
          limit: 2000,
          depth: 0,
          sort: '-date',
        }),
        req.payload.find({
          collection: 'debt-payments',
          where: { paidAt: { greater_than_equal: startDateStr, less_than_equal: endDateStr } },
          limit: 2000,
          depth: 0,
          sort: '-paidAt',
          select: {
            amount: true,
            paidAt: true,
          },
        }),
        req.payload.find({
          collection: 'debt-payments',
          where: {
            paidAt: {
              greater_than_equal: previousStartDateStr,
              less_than_equal: previousEndDateStr,
            },
          },
          limit: 2000,
          depth: 0,
          sort: '-paidAt',
          select: {
            amount: true,
          },
        }),
        req.payload.find({
          collection: 'orders',
          where: {
            debtTrackingEnabled: { equals: true },
          },
          limit: 2000,
          depth: 0,
          select: {
            amountOutstanding: true,
            amountPaid: true,
            customer: true,
            customerEmail: true,
            debtDueDate: true,
            debtStatus: true,
            updatedAt: true,
          },
          sort: '-updatedAt',
        }),
        req.payload.count({ collection: 'products' }),
        req.payload.find({
          collection: 'transactions',
          where: {
            createdAt: { greater_than_equal: startDateStr, less_than_equal: endDateStr },
          },
          limit: 2000,
          depth: 0,
          sort: '-createdAt',
          select: {
            amount: true,
            createdAt: true,
            currency: true,
            customerEmail: true,
            order: true,
            paymentMethod: true,
            status: true,
          },
        }),
      ])

      const currentOrders = currentOrdersRes.docs as unknown as Order[]
      const previousOrders = previousOrdersRes.docs as unknown as Order[]
      const currentExpenses = currentExpensesRes.docs as any[]
      const previousExpenses = previousExpensesRes.docs as any[]
      const currentDebtPayments = currentDebtPaymentsRes.docs as Array<{
        amount?: number | null
        paidAt?: string | null
      }>
      const previousDebtPayments = previousDebtPaymentsRes.docs as Array<{
        amount?: number | null
      }>
      const activeDebtOrders = activeDebtOrdersRes.docs as unknown as Order[]
      const currentTransactions = currentTransactionsRes.docs as unknown as Transaction[]

      const productIds = new Set<string>()

      for (const order of [...currentOrders, ...previousOrders]) {
        order.items?.forEach((item: any) => {
          if (typeof item.product === 'string') productIds.add(item.product)
          else if (item.product?.id) productIds.add(item.product.id)
        })
      }

      const productsMap = new Map<string, Product>()
      if (productIds.size > 0) {
        const productsRes = await req.payload.find({
          collection: 'products',
          where: { id: { in: Array.from(productIds) } },
          limit: productIds.size,
          pagination: false,
          depth: 0,
          select: {
            title: true,
            priceInNGN: true,
            priceInUSD: true,
            costPriceInNGN: true,
            costPriceInUSD: true,
          },
        })

        productsRes.docs.forEach((product) => productsMap.set(product.id, product as Product))
      }

      let totalRevenue = 0
      let totalCost = 0
      let totalGrossProfit = 0
      let totalExpenses = 0
      let totalOutstandingDebt = 0
      let activeDebtOrdersCount = 0
      let overdueDebtOrdersCount = 0
      let debtCollected = 0

      const metricsByDate = new Map<
        string,
        { revenue: number; cost: number; profit: number; expense: number; debtCollected: number }
      >()

      const statusCounts: Record<string, number> = {}
      const debtStatusCounts: Record<string, number> = {}
      const transactionStatusCounts: Record<string, number> = {}
      const expenseCategoryTotals: Record<string, number> = {}

      const productMetrics = new Map<
        string,
        {
          id: string
          name: string
          sales: number
          revenue: number
          cost: number
          profit: number
          orderIDs: Set<string>
        }
      >()

      const customerMetrics = new Map<
        string,
        {
          id: string
          name: string
          email: string
          orders: number
          revenue: number
          cost: number
          profit: number
        }
      >()

      const customerEmailMetrics = new Map<string, CustomerEmailSummary>()

      for (const order of currentOrders) {
        const orderCurrency = order.currency || 'NGN'
        let orderCost = 0

        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const productId = typeof item.product === 'object' ? item.product?.id : item.product
            const product = productId ? productsMap.get(productId) : undefined
            const qty = item.quantity || 1
            const { unitPrice, unitCost } = getItemUnitAmounts(item, product, orderCurrency)
            const itemRevenue = unitPrice * qty
            const itemCost = unitCost * qty
            const key = productId || 'unknown'

            totalItemsSold += qty
            orderCost += itemCost

            if (!productMetrics.has(key)) {
              productMetrics.set(key, {
                id: product?.id || 'unknown',
                name: product?.title || 'Unknown',
                sales: 0,
                revenue: 0,
                cost: 0,
                profit: 0,
                orderIDs: new Set<string>(),
              })
            }

            const metric = productMetrics.get(key)!
            metric.sales += qty
            metric.revenue += itemRevenue
            metric.cost += itemCost
            metric.profit += itemRevenue - itemCost
            metric.orderIDs.add(order.id)
          })
        }

        const orderRevenue = moneyFromKobo(order.amount || 0)
        const orderProfit = orderRevenue - orderCost

        totalRevenue += orderRevenue
        totalCost += orderCost
        totalGrossProfit += orderProfit

        const dateKey = new Date(order.createdAt).toLocaleDateString()
        if (!metricsByDate.has(dateKey)) {
          metricsByDate.set(dateKey, {
            revenue: 0,
            cost: 0,
            profit: 0,
            expense: 0,
            debtCollected: 0,
          })
        }

        const dayMetrics = metricsByDate.get(dateKey)!
        dayMetrics.revenue += orderRevenue
        dayMetrics.cost += orderCost
        dayMetrics.profit += orderProfit

        const status = (order.status as string) || 'processing'
        statusCounts[status] = (statusCounts[status] || 0) + 1

        const customerEmail = normalizeEmail(order.customerEmail)
        const customerId = typeof order.customer === 'string' ? order.customer : order.customer?.id
        const customerKey = customerEmail || customerId || `guest-${order.id}`
        const customerLabel = customerEmail || 'Guest'

        if (!customerMetrics.has(customerKey)) {
          customerMetrics.set(customerKey, {
            id: customerId || '',
            name: customerEmail ? customerEmail.split('@')[0] : 'Guest',
            email: customerLabel,
            orders: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
          })
        }

        const customerMetric = customerMetrics.get(customerKey)!
        customerMetric.orders += 1
        customerMetric.revenue += orderRevenue
        customerMetric.cost += orderCost
        customerMetric.profit += orderProfit

        if (customerEmail) {
          if (!customerEmailMetrics.has(customerEmail)) {
            customerEmailMetrics.set(customerEmail, {
              email: customerEmail,
              totalOrders: 0,
              totalRevenue: 0,
              lastOrderDate: order.createdAt,
            })
          }

          const emailMetric = customerEmailMetrics.get(customerEmail)!
          emailMetric.totalOrders += 1
          emailMetric.totalRevenue += orderRevenue

          if (
            order.createdAt &&
            (!emailMetric.lastOrderDate ||
              new Date(order.createdAt).getTime() > new Date(emailMetric.lastOrderDate).getTime())
          ) {
            emailMetric.lastOrderDate = order.createdAt
          }
        }
      }

      for (const expense of currentExpenses) {
        const amount = expense.amount || 0
        totalExpenses += amount

        const category = (expense.category as string) || 'other'
        expenseCategoryTotals[category] = (expenseCategoryTotals[category] || 0) + amount

        const dateKey = new Date(expense.date).toLocaleDateString()
        if (!metricsByDate.has(dateKey)) {
          metricsByDate.set(dateKey, {
            revenue: 0,
            cost: 0,
            profit: 0,
            expense: 0,
            debtCollected: 0,
          })
        }

        metricsByDate.get(dateKey)!.expense += amount
      }

      for (const payment of currentDebtPayments) {
        const amount = moneyFromKobo(payment.amount || 0)
        debtCollected += amount

        const dateKey = new Date(payment.paidAt || new Date().toISOString()).toLocaleDateString()
        if (!metricsByDate.has(dateKey)) {
          metricsByDate.set(dateKey, {
            revenue: 0,
            cost: 0,
            profit: 0,
            expense: 0,
            debtCollected: 0,
          })
        }

        metricsByDate.get(dateKey)!.debtCollected += amount
      }

      for (const order of activeDebtOrders) {
        const outstanding = moneyFromKobo(order.amountOutstanding || 0)
        const status = (order.debtStatus as string) || 'unpaid'

        totalOutstandingDebt += outstanding
        if (outstanding > 0) activeDebtOrdersCount += 1
        if (status === 'overdue') overdueDebtOrdersCount += 1

        debtStatusCounts[status] = (debtStatusCounts[status] || 0) + 1
      }

      for (const transaction of currentTransactions) {
        const status = transaction.status || 'pending'
        transactionStatusCounts[status] = (transactionStatusCounts[status] || 0) + 1
      }

      let previousRevenue = 0
      let previousGrossProfit = 0
      let previousExpensesTotal = 0
      let previousDebtCollected = 0

      for (const order of previousOrders) {
        const orderCurrency = order.currency || 'NGN'
        let orderCost = 0

        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const productId = typeof item.product === 'object' ? item.product?.id : item.product
            const product = productId ? productsMap.get(productId) : undefined
            const qty = item.quantity || 1
            const { unitCost } = getItemUnitAmounts(item, product, orderCurrency)

            previousItemsSold += qty
            orderCost += unitCost * qty
          })
        }

        const revenue = moneyFromKobo(order.amount || 0)
        previousRevenue += revenue
        previousGrossProfit += revenue - orderCost
      }

      for (const expense of previousExpenses) {
        previousExpensesTotal += expense.amount || 0
      }

      for (const payment of previousDebtPayments) {
        previousDebtCollected += moneyFromKobo(payment.amount || 0)
      }

      const previousCustomerEmails = new Set(
        previousOrders
          .map((order) => normalizeEmail(order.customerEmail))
          .filter((email): email is string => Boolean(email)),
      )

      const revenueData: RevenueDataPoint[] = Array.from(metricsByDate.entries())
        .map(([date, metrics]) => ({
          date,
          revenue: Math.round(metrics.revenue),
          cost: Math.round(metrics.cost),
          profit: Math.round(metrics.profit),
          expense: Math.round(metrics.expense),
          debtCollected: Math.round(metrics.debtCollected),
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      const orderStatusData = formatPieData(statusCounts, COLORS)
      const debtStatusData = formatPieData(debtStatusCounts, COLORS)
      const transactionStatusData = formatPieData(transactionStatusCounts, COLORS)
      const expensesByCategory = formatPieData(expenseCategoryTotals, [
        '#ef4444',
        '#f97316',
        '#eab308',
        '#84cc16',
        '#06b6d4',
        '#8b5cf6',
      ])

      const topProducts: TopProduct[] = Array.from(productMetrics.values())
        .map((product) => ({
          id: product.id,
          name: product.name,
          sales: product.sales,
          revenue: product.revenue,
          profit: product.profit,
          profitMargin: product.revenue > 0 ? (product.profit / product.revenue) * 100 : 0,
        }))
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 10)

      const soldItems: SoldItemSummary[] = Array.from(productMetrics.values())
        .map((product) => ({
          id: product.id,
          name: product.name,
          quantitySold: product.sales,
          ordersCount: product.orderIDs.size,
          revenue: product.revenue,
        }))
        .sort((a, b) => b.quantitySold - a.quantitySold)

      const topCustomers: CustomerProfitability[] = Array.from(customerMetrics.values())
        .map((customer) => ({
          ...customer,
          totalProfit: customer.profit,
          totalRevenue: customer.revenue,
          totalCost: customer.cost,
          totalOrders: customer.orders,
          profitMargin: customer.revenue > 0 ? (customer.profit / customer.revenue) * 100 : 0,
          averageOrderValue: customer.orders > 0 ? customer.revenue / customer.orders : 0,
        }))
        .sort((a, b) => b.totalProfit - a.totalProfit)
        .slice(0, 10)

      const customerEmails: CustomerEmailSummary[] = Array.from(customerEmailMetrics.values()).sort(
        (a, b) => b.totalOrders - a.totalOrders || b.totalRevenue - a.totalRevenue,
      )

      const recentOrders: RecentOrder[] = currentOrders.slice(0, 10).map((order) => {
        const orderCurrency = order.currency || 'NGN'
        const amount = moneyFromKobo(order.amount || 0)
        let cost = 0

        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const productId = typeof item.product === 'object' ? item.product?.id : item.product
            const product = productId ? productsMap.get(productId) : undefined
            const qty = item.quantity || 1
            const { unitCost } = getItemUnitAmounts(item, product, orderCurrency)

            cost += unitCost * qty
          })
        }

        return {
          id: order.id,
          customer: normalizeEmail(order.customerEmail) || 'Guest',
          status: (order.status as string) || 'processing',
          amount,
          cost: Math.round(cost),
          profit: Math.round(amount - cost),
          date: order.createdAt,
        }
      })

      const recentDebtOrders: RecentDebtOrder[] = activeDebtOrders
        .filter((order) => (order.amountOutstanding || 0) > 0)
        .slice(0, 10)
        .map((order) => ({
          id: order.id,
          customer: normalizeEmail(order.customerEmail) || 'Guest',
          debtStatus: (order.debtStatus as string) || 'unpaid',
          amountPaid: Math.round(moneyFromKobo(order.amountPaid || 0)),
          amountOutstanding: Math.round(moneyFromKobo(order.amountOutstanding || 0)),
          dueDate: order.debtDueDate,
        }))

      const recentTransactions: TransactionSummary[] = currentTransactions.slice(0, 10).map((txn) => ({
        id: txn.id,
        customerEmail: normalizeEmail(txn.customerEmail) || 'Guest',
        status: txn.status,
        paymentMethod: txn.paymentMethod || 'unknown',
        amount: Math.round(moneyFromKobo(txn.amount || 0)),
        currency: txn.currency || 'NGN',
        createdAt: txn.createdAt,
        orderId: typeof txn.order === 'string' ? txn.order : txn.order?.id || undefined,
      }))

      const revenueChange =
        previousRevenue > 0
          ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100)
          : 0

      const profitChange =
        previousGrossProfit > 0
          ? Math.round(((totalGrossProfit - previousGrossProfit) / previousGrossProfit) * 100)
          : 0

      const expensesChange =
        previousExpensesTotal > 0
          ? Math.round(((totalExpenses - previousExpensesTotal) / previousExpensesTotal) * 100)
          : 0

      const ordersChange =
        previousOrders.length > 0
          ? Math.round(
              ((currentOrders.length - previousOrders.length) / previousOrders.length) * 100,
            )
          : 0

      const customersChange =
        previousCustomerEmails.size > 0
          ? Math.round(
              ((customerEmailMetrics.size - previousCustomerEmails.size) /
                previousCustomerEmails.size) *
                100,
            )
          : 0

      const itemsSoldChange =
        previousItemsSold > 0
          ? Math.round(((totalItemsSold - previousItemsSold) / previousItemsSold) * 100)
          : 0

      const debtCollectedChange =
        previousDebtCollected > 0
          ? Math.round(((debtCollected - previousDebtCollected) / previousDebtCollected) * 100)
          : 0

      const netProfit = totalGrossProfit - totalExpenses

      const analyticsData: AnalyticsData = {
        overview: {
          totalRevenue: Math.round(totalRevenue),
          totalProfit: Math.round(totalGrossProfit),
          netProfit: Math.round(netProfit),
          totalCost: Math.round(totalCost),
          totalExpenses: Math.round(totalExpenses),
          profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
          totalOutstandingDebt: Math.round(totalOutstandingDebt),
          debtCollected: Math.round(debtCollected),
          activeDebtOrders: activeDebtOrdersCount,
          overdueDebtOrders: overdueDebtOrdersCount,
          totalOrders: currentOrders.length,
          totalProducts: totalProductsCount.totalDocs,
          totalCustomers: customerEmailMetrics.size,
          totalItemsSold,
          revenueChange,
          profitChange,
          expensesChange,
          ordersChange,
          productsChange: 0,
          customersChange,
          itemsSoldChange,
          debtCollectedChange,
        },
        revenueData,
        orderStatusData,
        debtStatusData,
        transactionStatusData,
        expensesByCategory,
        topProducts,
        soldItems,
        recentOrders,
        recentDebtOrders,
        topCustomers,
        customerEmails,
        recentTransactions,
      }

      return Response.json(analyticsData)
    } catch (error) {
      console.error('Analytics error:', error)
      return Response.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }
  },
}
