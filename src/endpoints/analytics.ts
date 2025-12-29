/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Order, Product } from '@/payload-types'
import type {
  AnalyticsData,
  AnalyticsQuery,
  CustomerProfitability,
  OrderStatusData,
  RecentOrder,
  RevenueDataPoint,
  TopProduct,
} from '@/types/index'
import type { Endpoint, PayloadRequest } from 'payload'

// Helper to safely get product cost/price
const getProductPricing = (
  product: Product,
  currency: string = 'NGN',
): { price: number; cost: number } => {
  // @ts-expect-error - Dynamic access based on currency
  const price = product[`priceIn${currency}`] || 0
  // @ts-expect-error - Dynamic access based on currency
  const cost = product[`costPriceIn${currency}`] || 0
  return { price, cost }
}

// Helper to convert amount from kobo to Naira (or cents to dollars)
const convertFromKobo = (amount: number, currency: string = 'NGN'): number => {
  // If currency is NGN, USD, or other currencies that use 100 subunits
  // Divide by 100 to convert from kobo/cents to main currency
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
        totalProductsCount,
        totalUsersCount,
        newCustomersCount,
        prevNewCustomersCount,
      ] = await Promise.all([
        // Fetch current period orders (lightweight, depth 0)
        req.payload.find({
          collection: 'orders',
          where: { createdAt: { greater_than_equal: startDateStr } },
          limit: 2000, // Increased limit, but data is lighter
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
        // Fetch previous period orders (lightweight)
        req.payload.find({
          collection: 'orders',
          where: {
            createdAt: {
              greater_than_equal: previousStartDateStr,
              less_than: startDateStr,
            },
          },
          limit: 2000,
          depth: 0,
          select: { items: true, amount: true, currency: true },
        }),
        // Get counts only (much faster than find)
        req.payload.count({ collection: 'products' }),
        req.payload.count({ collection: 'users' }),
        // New customers count
        req.payload.count({
          collection: 'users',
          where: { createdAt: { greater_than_equal: startDateStr } },
        }),
        // Previous new customers count
        req.payload.count({
          collection: 'users',
          where: {
            createdAt: {
              greater_than_equal: previousStartDateStr,
              less_than: startDateStr,
            },
          },
        }),
      ])

      const currentOrders = currentOrdersRes.docs as unknown as Order[]
      const previousOrders = previousOrdersRes.docs as unknown as Order[]

      // 2. Extract all unique Product IDs needed for calculation
      const productIds = new Set<string>()
      currentOrders.forEach((order) => {
        order.items?.forEach((item) => {
          if (typeof item.product === 'string') productIds.add(item.product)
          // Handle edge case if depth was somehow mixed
          else if (item.product?.id) productIds.add(item.product.id)
        })
      })

      // 3. Batch fetch only the referenced products
      // This replaces the expensive 'depth: 2' on orders
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
      let totalCost = 0
      let totalProfit = 0

      const metricsByDate = new Map<string, { revenue: number; cost: number; profit: number }>()
      const statusCounts: Record<string, number> = {}

      // Trackers for Top Products & Customers
      const productMetrics = new Map<string, any>()
      const customerMetrics = new Map<string, any>()

      // 5. SINGLE PASS Aggregation Loop
      for (const order of currentOrders) {
        const orderCurrency = order.currency || 'NGN'
        let orderCost = 0

        // A. Process Items for Cost & Product Metrics
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item) => {
            const productId = typeof item.product === 'object' ? item.product?.id : item.product
            if (!productId || !productsMap.has(productId)) return

            const product = productsMap.get(productId)!
            const { price, cost } = getProductPricing(product, orderCurrency)
            const qty = item.quantity || 1

            // Convert product prices from kobo to Naira
            const itemCost = convertFromKobo(cost, orderCurrency) * qty
            const itemRevenue = convertFromKobo(price, orderCurrency) * qty

            orderCost += itemCost

            // Update Product Metrics
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

        // Convert order amount from kobo to Naira
        const orderRevenue = convertFromKobo(order.amount || 0, orderCurrency)
        const orderProfit = orderRevenue - orderCost

        // B. Update Global Totals
        totalRevenue += orderRevenue
        totalCost += orderCost
        totalProfit += orderProfit

        // C. Update Date Metrics
        const dateKey = new Date(order.createdAt).toLocaleDateString()
        if (!metricsByDate.has(dateKey)) {
          metricsByDate.set(dateKey, { revenue: 0, cost: 0, profit: 0 })
        }
        const dMetric = metricsByDate.get(dateKey)!
        dMetric.revenue += orderRevenue
        dMetric.cost += orderCost
        dMetric.profit += orderProfit

        // D. Update Status Counts
        const status = order.status || 'processing'
        statusCounts[status] = (statusCounts[status] || 0) + 1

        // E. Update Customer Metrics
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

      // 6. Process Previous Period (Simplified) for Comparison
      let previousRevenue = 0
      let previousProfit = 0

      for (const order of previousOrders) {
        let orderCost = 0
        if (order.items) {
          order.items.forEach((item) => {
            const pid = typeof item.product === 'string' ? item.product : item.product?.id
            if (pid && productsMap.has(pid)) {
              const { cost } = getProductPricing(productsMap.get(pid)!, order.currency || 'NGN')
              // Convert cost from kobo to Naira
              orderCost += convertFromKobo(cost, order.currency || 'NGN') * (item.quantity || 1)
            }
          })
        }
        // Convert previous order amounts from kobo to Naira
        const prevOrderRevenue = convertFromKobo(order.amount || 0, order.currency || 'NGN')
        previousRevenue += prevOrderRevenue
        previousProfit += prevOrderRevenue - orderCost
      }

      // 7. Format Final Data

      // Revenue Graph
      const revenueData: RevenueDataPoint[] = Array.from(metricsByDate.entries())
        .map(([date, m]) => ({
          date,
          revenue: Math.round(m.revenue),
          cost: Math.round(m.cost),
          profit: Math.round(m.profit),
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      // Status Data
      const orderStatusData: OrderStatusData[] = Object.entries(statusCounts).map(
        ([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
        }),
      )

      // Top Products
      const topProducts: TopProduct[] = Array.from(productMetrics.values())
        .map((p) => ({
          ...p,
          profitMargin: p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0,
        }))
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 10)

      // Top Customers
      const topCustomers: CustomerProfitability[] = Array.from(customerMetrics.values())
        .map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          totalOrders: c.orders,
          totalRevenue: c.revenue,
          totalCost: c.cost,
          totalProfit: c.profit,
          profitMargin: c.revenue > 0 ? (c.profit / c.revenue) * 100 : 0,
          averageOrderValue: c.orders > 0 ? c.revenue / c.orders : 0,
        }))
        .sort((a, b) => b.totalProfit - a.totalProfit)
        .slice(0, 10)

      // Recent Orders (Re-map from the first 10 of currentOrders)
      const recentOrders: RecentOrder[] = currentOrders.slice(0, 10).map((order) => {
        // Recalculate just for these 10 to avoid storing it on the object during the big loop
        let cost = 0
        order.items?.forEach((item) => {
          const pid = typeof item.product === 'string' ? item.product : item.product?.id
          if (pid && productsMap.has(pid)) {
            const { cost: c } = getProductPricing(productsMap.get(pid)!, order.currency || 'NGN')
            // Convert cost from kobo to Naira
            cost += convertFromKobo(c, order.currency || 'NGN') * (item.quantity || 1)
          }
        })
        // Convert amount from kobo to Naira for display
        const amount = convertFromKobo(order.amount || 0, order.currency || 'NGN')
        return {
          id: order.id,
          customer: order.customerEmail || 'Guest',
          status: order.status || 'processing',
          amount,
          cost,
          profit: amount - cost,
          date: order.createdAt,
        }
      })

      // Changes Calculation
      const revenueChange =
        previousRevenue > 0
          ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100)
          : 0
      const profitChange =
        previousProfit > 0 ? Math.round(((totalProfit - previousProfit) / previousProfit) * 100) : 0
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

      const analyticsData: AnalyticsData = {
        overview: {
          totalRevenue: Math.round(totalRevenue),
          totalProfit: Math.round(totalProfit),
          totalCost: Math.round(totalCost),
          profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
          totalOrders: currentOrders.length,
          totalProducts: totalProductsCount.totalDocs,
          totalCustomers: totalUsersCount.totalDocs,
          revenueChange,
          profitChange,
          ordersChange,
          productsChange: 0,
          customersChange,
        },
        revenueData,
        orderStatusData,
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
