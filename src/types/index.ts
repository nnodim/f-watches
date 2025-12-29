export interface AnalyticsOverview {
  totalRevenue: number
  totalProfit: number
  totalCost: number
  profitMargin: number
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  revenueChange: number
  profitChange: number
  ordersChange: number
  productsChange: number
  customersChange: number
}

export interface RevenueDataPoint {
  date: string
  revenue: number
  profit: number
  cost: number
}

export type OrderStatusData = {
  name: string
  value: number
  [key: string]: string | number
}

export interface TopProduct {
  name: string
  sales: number
  revenue: number
  profit: number
  profitMargin: number
}

export interface RecentOrder {
  id: string
  customer: string
  status: string
  amount: number
  cost: number
  profit: number
  date: string
}

export interface CustomerProfitability {
  id: string
  name: string
  email: string
  totalOrders: number
  totalRevenue: number
  totalCost: number
  totalProfit: number
  profitMargin: number
  averageOrderValue: number
}

export interface AnalyticsData {
  overview: AnalyticsOverview
  revenueData: RevenueDataPoint[]
  orderStatusData: OrderStatusData[]
  topProducts: TopProduct[]
  recentOrders: RecentOrder[]
  topCustomers: CustomerProfitability[]
}

export type TimeRange = '7' | '30' | '90' | '365'

export interface AnalyticsQuery {
  days?: string
}

export interface StatCardProps {
  title: string
  value: string | number
  change: number
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  color: string
}
