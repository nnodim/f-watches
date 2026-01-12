/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Order, Product } from '@/payload-types'
import type {
  AnalyticsData,
  AnalyticsQuery,
  CustomerProfitability,
  RecentOrder,
  RevenueDataPoint,
  TopProduct
} from '@/types/index'
import type { Endpoint, PayloadRequest } from 'payload'

const getProductPricing = (product: Product, currency: string = 'NGN') => {
  // @ts-expect-error Dynamic access
  const price = product[`priceIn${currency}`] || 0
  // @ts-expect-error Dynamic access
  const cost = product[`costPriceIn${currency}`] || 0
  return { price, cost }
}

const convertFromKobo = (amount: number, currency: string = 'NGN'): number => {
  return amount / 100
}

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

      // 1. Run independent queries in PARALLEL
      const [
        currentOrdersRes,
        previousOrdersRes,
        currentExpensesRes, // New
        previousExpensesRes, // New
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
            items: true,
            amount: true,
            currency: true,
            status: true,
            createdAt: true,
            customer: true,
            customerEmail: true,
          },
        }),
        // Previous Orders
        req.payload.find({
          collection: 'orders',
          where: {
            createdAt: { greater_than_equal: previousStartDateStr, less_than: startDateStr },
          },
          limit: 2000,
          depth: 0,
          select: { items: true, amount: true, currency: true },
        }),
        // Current Expenses (New)
        req.payload.find({
          collection: 'expenses',
          where: { date: { greater_than_equal: startDateStr } },
          limit: 2000,
          depth: 0,
        }),
        // Previous Expenses (New)
        req.payload.find({
          collection: 'expenses',
          where: { date: { greater_than_equal: previousStartDateStr, less_than: startDateStr } },
          limit: 2000,
          depth: 0,
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
      const currentExpenses = currentExpensesRes.docs
      const previousExpenses = previousExpensesRes.docs

      // 2. Extract Product IDs
      const productIds = new Set<string>()
      currentOrders.forEach((order) => {
        order.items?.forEach((item) => {
          if (typeof item.product === 'string') productIds.add(item.product)
          else if (item.product?.id) productIds.add(item.product.id)
        })
      })

      // 3. Batch fetch products
      const productsMap = new Map<string, Product>()
      if (productIds.size > 0) {
        const productsRes = await req.payload.find({
          collection: 'products',
          where: { id: { in: Array.from(productIds) } },
          limit: productIds.size,
          pagination: false,
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

      // 4. Initialize Aggregation Containers
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
      const expenseCategoryCounts: Record<string, number> = {}

      const productMetrics = new Map<string, any>()
      const customerMetrics = new Map<string, any>()

      // 5. Aggregation Loop: ORDERS
      for (const order of currentOrders) {
        const orderCurrency = order.currency || 'NGN'
        let orderCost = 0

        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item) => {
            const productId = typeof item.product === 'object' ? item.product?.id : item.product
            if (!productId || !productsMap.has(productId)) return

            const product = productsMap.get(productId)!
            const { price, cost } = getProductPricing(product, orderCurrency)
            const qty = item.quantity || 1
            const itemCost = convertFromKobo(cost, orderCurrency) * qty
            const itemRevenue = convertFromKobo(price, orderCurrency) * qty

            orderCost += itemCost

            // Product Metrics
            if (!productMetrics.has(productId)) {
              productMetrics.set(productId, {
                name: product.title || 'Unknown',
                sales: 0,
                revenue: 0,
                cost: 0,
                profit: 0,
              })
            }
            const pMetric = productMetrics.get(productId)
            pMetric.sales += qty
            pMetric.revenue += itemRevenue
            pMetric.cost += itemCost
            pMetric.profit += itemRevenue - itemCost
          })
        }

        const orderRevenue = convertFromKobo(order.amount || 0, orderCurrency)
        const orderProfit = orderRevenue - orderCost // Gross Profit for this order

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
        const status = order.status || 'processing'
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
        const cMetric = customerMetrics.get(customerKey)
        cMetric.orders += 1
        cMetric.revenue += orderRevenue
        cMetric.cost += orderCost
        cMetric.profit += orderProfit
      }

      // 6. Aggregation Loop: EXPENSES
      for (const expense of currentExpenses) {
        const amount = expense.amount || 0 // Assuming stored in main currency
        totalExpenses += amount

        // Category Metrics
        const category = (expense.category as string) || 'other'
        expenseCategoryCounts[category] = (expenseCategoryCounts[category] || 0) + amount

        // Date Metrics (Merge with orders)
        const dateKey = new Date(expense.date).toLocaleDateString()
        if (!metricsByDate.has(dateKey)) {
          metricsByDate.set(dateKey, { revenue: 0, cost: 0, profit: 0, expense: 0 })
        }
        const dMetric = metricsByDate.get(dateKey)!
        dMetric.expense += amount
      }

      // 7. Process Previous Period
      let previousRevenue = 0
      let previousGrossProfit = 0
      let previousExpensesTotal = 0

      for (const order of previousOrders) {
        let orderCost = 0
        if (order.items) {
          order.items.forEach((item) => {
            const pid = typeof item.product === 'string' ? item.product : item.product?.id
            if (pid && productsMap.has(pid)) {
              const { cost } = getProductPricing(productsMap.get(pid)!, order.currency || 'NGN')
              orderCost += convertFromKobo(cost, order.currency || 'NGN') * (item.quantity || 1)
            }
          })
        }
        const rev = convertFromKobo(order.amount || 0, order.currency || 'NGN')
        previousRevenue += rev
        previousGrossProfit += rev - orderCost
      }

      for (const expense of previousExpenses) {
        previousExpensesTotal += expense.amount || 0
      }

      // 8. Format Final Data
      const revenueData: RevenueDataPoint[] = Array.from(metricsByDate.entries())
        .map(([date, m]) => ({
          date,
          revenue: Math.round(m.revenue),
          cost: Math.round(m.cost),
          profit: Math.round(m.profit), // Gross Profit
          expense: Math.round(m.expense),
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      // Helper for Pie Charts
      const formatPieData = (data: Record<string, number>, colors: string[]) =>
        Object.entries(data)
          .map(([name, value], i) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value,
            color: colors[i % colors.length] || '#000',
          }))
          .sort((a, b) => b.value - a.value)

      const orderStatusData = formatPieData(statusCounts, []) // Colors handled on frontend usually, or add here
      const expensesByCategory = formatPieData(expenseCategoryCounts, [
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
        // (Simplified cost recalc for recent orders list omitted for brevity, logic same as before)
        const amount = convertFromKobo(order.amount || 0, order.currency || 'NGN')
        return {
          id: order.id,
          customer: order.customerEmail || 'Guest',
          status: order.status || 'processing',
          amount,
          cost: 0,
          profit: 0,
          date: order.createdAt, // Fill cost/profit properly if needed
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
          totalProfit: Math.round(totalGrossProfit), // Keep as Gross for this field
          netProfit: Math.round(netProfit), // New Net field
          totalCost: Math.round(totalCost),
          totalExpenses: Math.round(totalExpenses),
          profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0, // Margin usually based on Net
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
