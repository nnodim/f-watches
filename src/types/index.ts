export interface AnalyticsOverview {
  totalRevenue: number
  totalProfit: number
  totalCost: number
  totalExpenses: number
  netProfit: number
  profitMargin: number
  totalOutstandingDebt: number
  debtCollected: number
  activeDebtOrders: number
  overdueDebtOrders: number
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  totalItemsSold: number
  revenueChange: number
  profitChange: number
  expensesChange: number
  ordersChange: number
  productsChange: number
  customersChange: number
  itemsSoldChange: number
  debtCollectedChange: number
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
  debtCollected: number
}

export type OrderStatusData = {
  name: string
  value: number
  [key: string]: string | number
}

export interface TopProduct {
  id: string
  name: string
  sales: number
  revenue: number
  profit: number
  profitMargin: number
}

export interface SoldItemSummary {
  id: string
  name: string
  quantitySold: number
  ordersCount: number
  revenue: number
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

export interface RecentDebtOrder {
  id: string
  customer: string
  debtStatus: string
  amountPaid: number
  amountOutstanding: number
  dueDate?: null | string
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

export interface CustomerEmailSummary {
  email: string
  totalOrders: number
  totalRevenue: number
  lastOrderDate?: null | string
}

export interface TransactionSummary {
  id: string
  customerEmail: string
  status: string
  paymentMethod: string
  amount: number
  currency: string
  createdAt: string
  orderId?: string
}

export interface TransactionStatusData {
  name: string
  value: number
  [key: string]: string | number
}

export interface AnalyticsData {
  overview: AnalyticsOverview
  revenueData: RevenueDataPoint[]
  orderStatusData: OrderStatusData[]
  debtStatusData: OrderStatusData[]
  transactionStatusData: TransactionStatusData[]
  expensesByCategory: ExpenseByCategory[]
  topProducts: TopProduct[]
  soldItems: SoldItemSummary[]
  recentOrders: RecentOrder[]
  recentDebtOrders: RecentDebtOrder[]
  topCustomers: CustomerProfitability[]
  customerEmails: CustomerEmailSummary[]
  recentTransactions: TransactionSummary[]
}

export type TimeRange = '7' | '30' | '90' | '365'

export interface AnalyticsQuery {
  days?: string
  startDate?: string
  endDate?: string
}

export interface StatCardProps {
  title: string
  value: string | number
  change: number
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  color: string
}
