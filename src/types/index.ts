export interface AnalyticsOverview {
  totalRevenue: number
  totalProfit: number
  totalCost: number
  totalExpenses: number
  netProfit: number
  profitMargin: number
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  revenueChange: number
  profitChange: number
  expensesChange: number
  ordersChange: number
  productsChange: number
  customersChange: number
}

export interface ExpenseByCategory {
  name: string
  value: number
  color: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: string | number | any
}

export interface RevenueDataPoint {
  date: string
  revenue: number
  cost: number
  profit: number
  expense: number
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
  expensesByCategory: ExpenseByCategory[]
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
