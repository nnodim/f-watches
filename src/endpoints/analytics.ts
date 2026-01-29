/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Order, Product } from '@/payload-types'
import type {
  AnalyticsData,
  AnalyticsQuery,
  CustomerProfitability,
  RecentOrder,
  RevenueDataPoint,
  TopProduct,
} from '@/types/index'
import type { Endpoint, PayloadRequest } from 'payload'

const moneyFromKobo = (amount?: number | null) => (amount ?? 0) / 100

type UnitAmounts = { unitPrice: number; unitCost: number }

/**
 * Prefer unitPrice/unitCostPrice stored on the order item (snapshot at purchase time).
 * If missing (legacy orders), fallback to product pricing.
 */
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

// Helper for Pie Charts
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
      if (!req.user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const days = parseInt((req.query as AnalyticsQuery).days || '30')
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      const startDateStr = startDate.toISOString()

      const previousStartDate = new Date(startDate)
      previousStartDate.setDate(previousStartDate.getDate() - days)
      const previousStartDateStr = previousStartDate.toISOString()

      // 1) Run independent queries in parallel
      const [
        currentOrdersRes,
        previousOrdersRes,
        currentExpensesRes,
        previousExpensesRes,
        totalProductsCount,
        totalUsersCount,
        newCustomersCount,
        prevNewCustomersCount,
      ] = await Promise.all([
        // Current Orders
        req.payload.find({
          collection: 'orders',
          where: { createdAt: { greater_than_equal: startDateStr } },
          limit: 2000,
          depth: 0,
          select: {
            items: true, // includes unitPrice/unitCostPrice inside items
            amount: true,
            currency: true,
            status: true,
            createdAt: true,
            customer: true,
            customerEmail: true,
          },
          sort: '-createdAt',
        }),
        // Previous Orders
        req.payload.find({
          collection: 'orders',
          where: {
            createdAt: { greater_than_equal: previousStartDateStr, less_than: startDateStr },
          },
          limit: 2000,
          depth: 0,
          select: {
            items: true, // includes unitPrice/unitCostPrice inside items
            amount: true,
            currency: true,
          },
          sort: '-createdAt',
        }),
        // Current Expenses
        req.payload.find({
          collection: 'expenses',
          where: { date: { greater_than_equal: startDateStr } },
          limit: 2000,
          depth: 0,
          sort: '-date',
        }),
        // Previous Expenses
        req.payload.find({
          collection: 'expenses',
          where: { date: { greater_than_equal: previousStartDateStr, less_than: startDateStr } },
          limit: 2000,
          depth: 0,
          sort: '-date',
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

      // 2) Extract Product IDs (only for product names in tables)
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

      // 3) Batch fetch products (ONLY title needed now)
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
            // Optional fallback fields for legacy orders (remove later if not needed)
            priceInNGN: true,
            priceInUSD: true,
            costPriceInNGN: true,
            costPriceInUSD: true,
          },
        })
        productsRes.docs.forEach((p) => productsMap.set(p.id, p as Product))
      }

      // 4) Initialize Aggregation Containers
      let totalRevenue = 0
      let totalCost = 0 // COGS
      let totalGrossProfit = 0
      let totalExpenses = 0 // Operational Expenses

      // Using dateKey to merge orders and expenses
      const metricsByDate = new Map<
        string,
        { revenue: number; cost: number; profit: number; expense: number }
      >()

      const statusCounts: Record<string, number> = {}
      const expenseCategoryTotals: Record<string, number> = {}

      const productMetrics = new Map<
        string,
        { name: string; sales: number; revenue: number; cost: number; profit: number }
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

      // 5) Aggregation Loop: ORDERS (Current)
      for (const order of currentOrders) {
        const orderCurrency = order.currency || 'NGN'
        let orderCost = 0
        let itemsRevenue = 0

        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const productId = typeof item.product === 'object' ? item.product?.id : item.product
            const product = productId ? productsMap.get(productId) : undefined

            const qty = item.quantity || 1
            const { unitPrice, unitCost } = getItemUnitAmounts(item, product, orderCurrency)

            const itemRevenue = unitPrice * qty
            const itemCost = unitCost * qty

            itemsRevenue += itemRevenue
            orderCost += itemCost

            // Product Metrics
            const key = productId || 'unknown'
            if (!productMetrics.has(key)) {
              productMetrics.set(key, {
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

        // Canonical revenue: what was charged/paid
        const orderRevenue = moneyFromKobo(order.amount || 0)
        // If you prefer product-sales-only revenue: use itemsRevenue instead:
        // const orderRevenue = itemsRevenue

        const orderProfit = orderRevenue - orderCost

        totalRevenue += orderRevenue
        totalCost += orderCost
        totalGrossProfit += orderProfit

        // Date Metrics
        const dateKey = new Date(order.createdAt).toLocaleDateString()
        if (!metricsByDate.has(dateKey)) {
          metricsByDate.set(dateKey, { revenue: 0, cost: 0, profit: 0, expense: 0 })
        }
        const dMetric = metricsByDate.get(dateKey)!
        dMetric.revenue += orderRevenue
        dMetric.cost += orderCost
        dMetric.profit += orderProfit

        // Status Counts
        const status = (order.status as string) || 'processing'
        statusCounts[status] = (statusCounts[status] || 0) + 1

        // Customer Metrics
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

      // 6) Aggregation Loop: EXPENSES (Current)
      for (const expense of currentExpenses) {
        const amount = expense.amount || 0 // assumed stored in main currency (not kobo)
        totalExpenses += amount

        const category = (expense.category as string) || 'other'
        expenseCategoryTotals[category] = (expenseCategoryTotals[category] || 0) + amount

        const dateKey = new Date(expense.date).toLocaleDateString()
        if (!metricsByDate.has(dateKey)) {
          metricsByDate.set(dateKey, { revenue: 0, cost: 0, profit: 0, expense: 0 })
        }
        const dMetric = metricsByDate.get(dateKey)!
        dMetric.expense += amount
      }

      // 7) Previous Period Aggregation
      let previousRevenue = 0
      let previousGrossProfit = 0
      let previousExpensesTotal = 0

      for (const order of previousOrders) {
        const orderCurrency = order.currency || 'NGN'
        let orderCost = 0

        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const productId = typeof item.product === 'object' ? item.product?.id : item.product
            const product = productId ? productsMap.get(productId) : undefined

            const qty = item.quantity || 1
            const { unitCost } = getItemUnitAmounts(item, product, orderCurrency)
            orderCost += unitCost * qty
          })
        }

        const rev = moneyFromKobo(order.amount || 0)
        previousRevenue += rev
        previousGrossProfit += rev - orderCost
      }

      for (const expense of previousExpenses) {
        previousExpensesTotal += expense.amount || 0
      }

      // 8) Format Revenue Data (merge orders + expenses by date)
      const revenueData: RevenueDataPoint[] = Array.from(metricsByDate.entries())
        .map(([date, m]) => ({
          date,
          revenue: Math.round(m.revenue),
          cost: Math.round(m.cost),
          profit: Math.round(m.profit), // Gross Profit
          expense: Math.round(m.expense),
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      const orderStatusData = formatPieData(statusCounts, [])

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

      // Recent Orders (include cost + profit)
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

      // Changes
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

      const netProfit = totalGrossProfit - totalExpenses

      const analyticsData: AnalyticsData = {
        overview: {
          totalRevenue: Math.round(totalRevenue),
          totalProfit: Math.round(totalGrossProfit), // gross profit
          netProfit: Math.round(netProfit),
          totalCost: Math.round(totalCost),
          totalExpenses: Math.round(totalExpenses),
          profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0, // net margin
          totalOrders: currentOrders.length,
          totalProducts: totalProductsCount.totalDocs,
          totalCustomers: totalUsersCount.totalDocs,
          revenueChange,
          profitChange,
          expensesChange,
          ordersChange,
          productsChange: 0,
          customersChange,
        },
        revenueData,
        orderStatusData,
        expensesByCategory,
        topProducts,
        recentOrders,
        topCustomers,
      }

      return Response.json(analyticsData)
    } catch (error) {
      console.error('Analytics error:', error)
      return Response.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }
  },
}
