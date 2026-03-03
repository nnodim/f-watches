/* eslint-disable @typescript-eslint/no-explicit-any */
import { checkRole } from '@/access/utilities'
import type { Order, Product } from '@/payload-types'
import type {
  AnalyticsData,
  AnalyticsQuery,
  CustomerProfitability,
  RecentDebtOrder,
  RecentOrder,
  RevenueDataPoint,
  TopProduct,
} from '@/types/index'
import type { Endpoint, PayloadRequest } from 'payload'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const moneyFromKobo = (amount?: number | null) => (amount ?? 0) / 100

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

      const days = parseInt((req.query as AnalyticsQuery).days || '30')
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      const startDateStr = startDate.toISOString()

      const previousStartDate = new Date(startDate)
      previousStartDate.setDate(previousStartDate.getDate() - days)
      const previousStartDateStr = previousStartDate.toISOString()

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
        totalUsersCount,
        newCustomersCount,
        prevNewCustomersCount,
      ] = await Promise.all([
        req.payload.find({
          collection: 'orders',
          where: { createdAt: { greater_than_equal: startDateStr } },
          limit: 2000,
          depth: 0,
          select: {
            items: true,
            amount: true,
            currency: true,
            status: true,
            createdAt: true,
            customer: true,
            customerEmail: true,
          },
          sort: '-createdAt',
        }),
        req.payload.find({
          collection: 'orders',
          where: {
            createdAt: { greater_than_equal: previousStartDateStr, less_than: startDateStr },
          },
          limit: 2000,
          depth: 0,
          select: {
            items: true,
            amount: true,
            currency: true,
          },
          sort: '-createdAt',
        }),
        req.payload.find({
          collection: 'expenses',
          where: { date: { greater_than_equal: startDateStr } },
          limit: 2000,
          depth: 0,
          sort: '-date',
        }),
        req.payload.find({
          collection: 'expenses',
          where: { date: { greater_than_equal: previousStartDateStr, less_than: startDateStr } },
          limit: 2000,
          depth: 0,
          sort: '-date',
        }),
        req.payload.find({
          collection: 'debt-payments',
          where: { paidAt: { greater_than_equal: startDateStr } },
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
            paidAt: { greater_than_equal: previousStartDateStr, less_than: startDateStr },
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
            customer: true,
            customerEmail: true,
            amountPaid: true,
            amountOutstanding: true,
            debtDueDate: true,
            debtStatus: true,
            updatedAt: true,
          },
          sort: '-updatedAt',
        }),
        req.payload.count({ collection: 'products' }),
        req.payload.count({ collection: 'users' }),
        req.payload.count({
          collection: 'users',
          where: { createdAt: { greater_than_equal: startDateStr } },
        }),
        req.payload.count({
          collection: 'users',
          where: {
            createdAt: { greater_than_equal: previousStartDateStr, less_than: startDateStr },
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

      const productIds = new Set<string>()
      currentOrders.forEach((order) => {
        order.items?.forEach((item: any) => {
          if (typeof item.product === 'string') productIds.add(item.product)
          else if (item.product?.id) productIds.add(item.product.id)
        })
      })
      previousOrders.forEach((order) => {
        order.items?.forEach((item: any) => {
          if (typeof item.product === 'string') productIds.add(item.product)
          else if (item.product?.id) productIds.add(item.product.id)
        })
      })

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
        productsRes.docs.forEach((p) => productsMap.set(p.id, p as Product))
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
      const expenseCategoryTotals: Record<string, number> = {}

      const productMetrics = new Map<
        string,
        { id: string; name: string; sales: number; revenue: number; cost: number; profit: number }
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

      for (const order of currentOrders) {
        const orderCurrency = order.currency || 'NGN'
        let orderCost = 0

        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const productId = typeof item.product === 'object' ? item.product?.id : item.product
            const product = productId ? productsMap.get(productId) : undefined

            const qty = item.quantity || 1
            totalItemsSold += qty
            const { unitPrice, unitCost } = getItemUnitAmounts(item, product, orderCurrency)

            const itemRevenue = unitPrice * qty
            const itemCost = unitCost * qty

            const key = productId || 'unknown'
            orderCost += itemCost

            if (!productMetrics.has(key)) {
              productMetrics.set(key, {
                id: product?.id || 'unknown',
                name: product?.title || 'Unknown',
                sales: 0,
                revenue: 0,
                cost: 0,
                profit: 0,
              })
            }

            const pMetric = productMetrics.get(key)!
            pMetric.sales += qty
            pMetric.revenue += itemRevenue
            pMetric.cost += itemCost
            pMetric.profit += itemRevenue - itemCost
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
        const dMetric = metricsByDate.get(dateKey)!
        dMetric.revenue += orderRevenue
        dMetric.cost += orderCost
        dMetric.profit += orderProfit

        const status = (order.status as string) || 'processing'
        statusCounts[status] = (statusCounts[status] || 0) + 1

        const customerEmail = order.customerEmail || 'Guest'
        const customerId = typeof order.customer === 'string' ? order.customer : order.customer?.id
        const customerKey = customerId || customerEmail

        if (!customerMetrics.has(customerKey)) {
          customerMetrics.set(customerKey, {
            id: customerId || '',
            name: customerEmail.split('@')[0],
            email: customerEmail,
            orders: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
          })
        }

        const cMetric = customerMetrics.get(customerKey)!
        cMetric.orders += 1
        cMetric.revenue += orderRevenue
        cMetric.cost += orderCost
        cMetric.profit += orderProfit
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
        const dMetric = metricsByDate.get(dateKey)!
        dMetric.expense += amount
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
        const dMetric = metricsByDate.get(dateKey)!
        dMetric.debtCollected += amount
      }

      for (const order of activeDebtOrders) {
        const outstanding = moneyFromKobo(order.amountOutstanding || 0)
        const status = (order.debtStatus as string) || 'unpaid'

        totalOutstandingDebt += outstanding
        if (outstanding > 0) activeDebtOrdersCount += 1
        if (status === 'overdue') overdueDebtOrdersCount += 1

        debtStatusCounts[status] = (debtStatusCounts[status] || 0) + 1
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
            previousItemsSold += qty
            const { unitCost } = getItemUnitAmounts(item, product, orderCurrency)
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

      const expensesByCategory = formatPieData(expenseCategoryTotals, [
        '#ef4444',
        '#f97316',
        '#eab308',
        '#84cc16',
        '#06b6d4',
        '#8b5cf6',
      ])

      const topProducts: TopProduct[] = Array.from(productMetrics.values())
        .map((p) => ({ ...p, profitMargin: p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0 }))
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 10)

      const topCustomers: CustomerProfitability[] = Array.from(customerMetrics.values())
        .map((c) => ({
          ...c,
          totalProfit: c.profit,
          totalRevenue: c.revenue,
          totalCost: c.cost,
          totalOrders: c.orders,
          profitMargin: c.revenue > 0 ? (c.profit / c.revenue) * 100 : 0,
          averageOrderValue: c.orders > 0 ? c.revenue / c.orders : 0,
        }))
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 10)

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
          customer: order.customerEmail || 'Guest',
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
          customer: order.customerEmail || 'Guest',
          debtStatus: (order.debtStatus as string) || 'unpaid',
          amountPaid: Math.round(moneyFromKobo(order.amountPaid || 0)),
          amountOutstanding: Math.round(moneyFromKobo(order.amountOutstanding || 0)),
          dueDate: order.debtDueDate,
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
        prevNewCustomersCount.totalDocs > 0
          ? Math.round(
              ((newCustomersCount.totalDocs - prevNewCustomersCount.totalDocs) /
                prevNewCustomersCount.totalDocs) *
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
          totalCustomers: totalUsersCount.totalDocs,
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
        expensesByCategory,
        topProducts,
        recentOrders,
        recentDebtOrders,
        topCustomers,
      }

      return Response.json(analyticsData)
    } catch (error) {
      console.error('Analytics error:', error)
      return Response.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }
  },
}

