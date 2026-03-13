'use client'

import type {
  AnalyticsData,
  CustomerEmailSummary,
  CustomerProfitability,
  ExpenseByCategory,
  OrderStatusData,
  RecentDebtOrder,
  RecentOrder,
  SoldItemSummary,
  TimeRange,
  TopProduct,
  TransactionSummary,
} from '@/types/index'
import {
  AlertTriangle,
  ArrowRight,
  CreditCard,
  DollarSign,
  Package,
  Percent,
  ShoppingCart,
  Users,
  Wallet,
} from 'lucide-react'
import Link from 'next/link'
import React, { useCallback, useEffect, useState } from 'react'
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PieLabelRenderProps,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { DashboardSkeleton } from '../DashboardSkeleton'

const COLORS = ['#17594a', '#d97706', '#b91c1c', '#1d4ed8', '#6d28d9', '#0f766e']

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'sales', label: 'Sales' },
  { id: 'orders', label: 'Orders' },
  { id: 'debts', label: 'Debts' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'customers', label: 'Customers' },
] as const

type TabId = (typeof TABS)[number]['id']

type DrilldownType = 'customers' | 'soldItems' | null

type ActiveRange =
  | { mode: 'preset'; days: TimeRange }
  | { mode: 'custom'; startDate: string; endDate: string }

type StatCardProps = {
  title: string
  value: string | number
  change?: number
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  color: string
  hint?: string
  comparisonLabel?: string
  href?: string
  onClick?: () => void
}

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount)

const formatDate = (value?: null | string) => (value ? new Date(value).toLocaleDateString() : '-')

const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
    paddingBottom: '32px',
  },
  hero: {
    background:
      'linear-gradient(135deg, rgba(12,52,43,1) 0%, rgba(18,112,91,0.92) 48%, rgba(226,152,52,0.95) 100%)',
    borderRadius: '24px',
    color: '#f8fafc',
    padding: '28px',
    boxShadow: '0 18px 50px rgba(12, 52, 43, 0.22)',
  },
  heroLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 10px',
    borderRadius: '999px',
    backgroundColor: 'rgba(255,255,255,0.14)',
    fontSize: '12px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
  heroTitle: { margin: '16px 0 8px', fontSize: '32px', fontWeight: 700, lineHeight: 1.1 },
  heroCopy: {
    margin: 0,
    maxWidth: '720px',
    color: 'rgba(248, 250, 252, 0.88)',
    fontSize: '15px',
    lineHeight: 1.6,
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap' as const,
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
  },
  tabButton: {
    border: '1px solid #d8e3df',
    borderRadius: '999px',
    backgroundColor: '#ffffff',
    color: '#22423a',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    padding: '10px 16px',
  },
  select: {
    padding: '10px 14px',
    border: '1px solid #d1d5db',
    borderRadius: '10px',
    fontSize: '14px',
    backgroundColor: '#fff',
    color: '#1f2937',
    cursor: 'pointer',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap' as const,
  },
  input: {
    padding: '10px 14px',
    border: '1px solid #d1d5db',
    borderRadius: '10px',
    fontSize: '14px',
    backgroundColor: '#fff',
    color: '#1f2937',
  },
  actionButton: {
    border: '1px solid #17594a',
    backgroundColor: '#17594a',
    color: '#fff',
    borderRadius: '10px',
    padding: '10px 14px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  secondaryButton: {
    border: '1px solid #d1d5db',
    backgroundColor: '#fff',
    color: '#1f2937',
    borderRadius: '10px',
    padding: '10px 14px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '18px',
  },
  statCard: {
    display: 'block',
    width: '100%',
    textAlign: 'left' as const,
    backgroundColor: '#fff',
    border: '1px solid #e6ece9',
    borderRadius: '18px',
    padding: '20px',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
    textDecoration: 'none',
    color: 'inherit',
  },
  statCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '18px',
  },
  iconWrapper: {
    padding: '12px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  change: { fontSize: '12px', fontWeight: 700 },
  statLabel: {
    color: '#64748b',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
  },
  statValue: { color: '#0f172a', fontSize: '28px', fontWeight: 700, margin: '8px 0 0' },
  statHint: { color: '#64748b', fontSize: '13px', marginTop: '10px', display: 'flex', gap: '8px' },
  sectionCard: {
    backgroundColor: '#fff',
    border: '1px solid #e6ece9',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
  },
  sectionTitle: { margin: '0 0 6px', fontSize: '20px', fontWeight: 700, color: '#0f172a' },
  sectionCopy: { margin: '0 0 18px', color: '#64748b', fontSize: '14px', lineHeight: 1.6 },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
  },
  chartCard: {
    backgroundColor: '#fcfdfc',
    border: '1px solid #e6ece9',
    borderRadius: '18px',
    padding: '20px',
  },
  chartTitle: { margin: '0 0 14px', fontSize: '16px', fontWeight: 700, color: '#0f172a' },
  tableWrap: { overflowX: 'auto' as const },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  tableHeader: { borderBottom: '1px solid #e5e7eb', backgroundColor: '#f8fafc' },
  th: {
    padding: '12px 14px',
    textAlign: 'left' as const,
    fontSize: '11px',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  td: { padding: '14px', fontSize: '13px', color: '#0f172a', borderBottom: '1px solid #edf2f7' },
  badge: {
    display: 'inline-block',
    padding: '5px 10px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'capitalize' as const,
  },
  profitPositive: { color: '#0f766e', fontWeight: 700 },
  profitNegative: { color: '#b91c1c', fontWeight: 700 },
  empty: {
    border: '1px dashed #d1d5db',
    borderRadius: '14px',
    padding: '24px',
    textAlign: 'center' as const,
    color: '#64748b',
  },
  modalBackdrop: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '24px',
    zIndex: 40,
  },
  modal: {
    width: 'min(920px, 100%)',
    maxHeight: '80vh',
    overflow: 'auto' as const,
    backgroundColor: '#fff',
    borderRadius: '24px',
    padding: '24px',
    boxShadow: '0 30px 60px rgba(15, 23, 42, 0.3)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '18px',
  },
  closeButton: {
    border: '1px solid #d1d5db',
    backgroundColor: '#fff',
    borderRadius: '999px',
    padding: '10px 14px',
    cursor: 'pointer',
    fontWeight: 600,
  },
} satisfies Record<string, React.CSSProperties>

const getStatusStyle = (status: string): React.CSSProperties => {
  switch (status) {
    case 'paid':
    case 'completed':
    case 'succeeded':
      return { ...styles.badge, backgroundColor: '#dcfce7', color: '#166534' }
    case 'partial':
    case 'processing':
    case 'pending':
      return { ...styles.badge, backgroundColor: '#dbeafe', color: '#1d4ed8' }
    case 'unpaid':
      return { ...styles.badge, backgroundColor: '#fef3c7', color: '#92400e' }
    case 'overdue':
    case 'cancelled':
    case 'failed':
    case 'expired':
    case 'refunded':
      return { ...styles.badge, backgroundColor: '#fee2e2', color: '#991b1b' }
    default:
      return { ...styles.badge, backgroundColor: '#e5e7eb', color: '#334155' }
  }
}

const getChangeColor = (title: string, change: number) => {
  const expenseCard = title === 'Expenses'
  if (change === 0) return '#64748b'
  if (expenseCard) return change > 0 ? '#b91c1c' : '#0f766e'
  return change > 0 ? '#0f766e' : '#b91c1c'
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change = 0,
  icon: Icon,
  color,
  hint,
  comparisonLabel,
  href,
  onClick,
}) => {
  const content = (
    <>
      <div style={styles.statCardHeader}>
        <div style={{ ...styles.iconWrapper, backgroundColor: color }}>
          <Icon style={{ width: '20px', height: '20px', color: '#fff' }} />
        </div>
        <div
          style={{
            ...styles.change,
            color: getChangeColor(title, change),
            textAlign: 'right',
            maxWidth: '110px',
            lineHeight: 1.35,
          }}
        >
          <div>{change === 0 ? 'No change' : `${change > 0 ? '+' : ''}${change}%`}</div>
          {comparisonLabel ? (
            <div style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>
              {comparisonLabel}
            </div>
          ) : null}
        </div>
      </div>
      <div style={styles.statLabel}>{title}</div>
      <div style={styles.statValue}>{value}</div>
      {hint ? (
        <div style={styles.statHint}>
          <span>{hint}</span>
          {(href || onClick) && <ArrowRight style={{ width: '14px', height: '14px' }} />}
        </div>
      ) : null}
    </>
  )

  if (href) {
    return (
      <Link href={href} style={styles.statCard}>
        {content}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} style={styles.statCard}>
        {content}
      </button>
    )
  }

  return <div style={styles.statCard}>{content}</div>
}

const SectionHeader: React.FC<{ title: string; copy: string }> = ({ title, copy }) => (
  <>
    <h2 style={styles.sectionTitle}>{title}</h2>
    <p style={styles.sectionCopy}>{copy}</p>
  </>
)

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div style={styles.empty}>{message}</div>
)

const defaultAnalytics: AnalyticsData = {
  overview: {
    totalRevenue: 0,
    totalProfit: 0,
    totalCost: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    totalOutstandingDebt: 0,
    debtCollected: 0,
    activeDebtOrders: 0,
    overdueDebtOrders: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalItemsSold: 0,
    revenueChange: 0,
    profitChange: 0,
    expensesChange: 0,
    ordersChange: 0,
    productsChange: 0,
    customersChange: 0,
    itemsSoldChange: 0,
    debtCollectedChange: 0,
  },
  revenueData: [],
  orderStatusData: [],
  debtStatusData: [],
  transactionStatusData: [],
  expensesByCategory: [],
  topProducts: [],
  soldItems: [],
  recentOrders: [],
  recentDebtOrders: [],
  topCustomers: [],
  customerEmails: [],
  recentTransactions: [],
}

export const AnalyticsClient: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>('30')
  const [activeRange, setActiveRange] = useState<ActiveRange>({ mode: 'preset', days: '30' })
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [drilldown, setDrilldown] = useState<DrilldownType>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData>(defaultAnalytics)

  const fetchAnalytics = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const params = new URLSearchParams()

      if (activeRange.mode === 'custom') {
        params.set('startDate', activeRange.startDate)
        params.set('endDate', activeRange.endDate)
      } else {
        params.set('days', activeRange.days)
      }

      const response = await fetch(`/api/analytics?${params.toString()}`)
      const data: AnalyticsData = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [activeRange])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  if (loading) return <DashboardSkeleton />

  const openSoldItems = () => setDrilldown('soldItems')
  const openCustomerEmails = () => setDrilldown('customers')
  const totalTransactions = analytics.transactionStatusData.reduce(
    (sum, entry) => sum + Number(entry.value || 0),
    0,
  )

  const comparisonLabel =
    activeRange.mode === 'custom'
      ? (() => {
          const start = new Date(`${activeRange.startDate}T00:00:00.000Z`)
          const end = new Date(`${activeRange.endDate}T23:59:59.999Z`)
          const days = Math.max(
            1,
            Math.ceil((end.getTime() - start.getTime() + 1) / (1000 * 60 * 60 * 24)),
          )
          return `vs previous ${days} day${days === 1 ? '' : 's'}`
        })()
      : `vs previous ${activeRange.days} day${Number(activeRange.days) === 1 ? '' : 's'}`

  const activeRangeLabel =
    activeRange.mode === 'custom'
      ? `${formatDate(activeRange.startDate)} to ${formatDate(activeRange.endDate)}`
      : `Last ${activeRange.days} day${Number(activeRange.days) === 1 ? '' : 's'}`

  const applyCustomRange = () => {
    if (!customStartDate || !customEndDate) return
    setActiveRange({ mode: 'custom', startDate: customStartDate, endDate: customEndDate })
  }

  const clearCustomRange = () => {
    setCustomStartDate('')
    setCustomEndDate('')
    setActiveRange({ mode: 'preset', days: timeRange })
  }

  const renderTopProducts = (products: TopProduct[]) => (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead style={styles.tableHeader}>
          <tr>
            <th style={styles.th}>Product</th>
            <th style={styles.th}>Units Sold</th>
            <th style={styles.th}>Revenue</th>
            <th style={styles.th}>Profit</th>
            <th style={styles.th}>Margin</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td style={{ ...styles.td, fontWeight: 600 }}>
                <Link href={`/admin/collections/products/${product.id}`}>{product.name}</Link>
              </td>
              <td style={styles.td}>{product.sales}</td>
              <td style={styles.td}>{formatCurrency(product.revenue)}</td>
              <td style={product.profit >= 0 ? styles.profitPositive : styles.profitNegative}>
                {formatCurrency(product.profit)}
              </td>
              <td style={styles.td}>{product.profitMargin.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const renderRecentOrders = (orders: RecentOrder[]) => (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead style={styles.tableHeader}>
          <tr>
            <th style={styles.th}>Order ID</th>
            <th style={styles.th}>Customer</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Revenue</th>
            <th style={styles.th}>Cost</th>
            <th style={styles.th}>Profit</th>
            <th style={styles.th}>Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td style={{ ...styles.td, fontWeight: 600 }}>
                <Link href={`/admin/collections/orders/${order.id}`}>#{order.id}</Link>
              </td>
              <td style={styles.td}>{order.customer}</td>
              <td style={styles.td}>
                <span style={getStatusStyle(order.status)}>{order.status}</span>
              </td>
              <td style={styles.td}>{formatCurrency(order.amount)}</td>
              <td style={styles.td}>{formatCurrency(order.cost)}</td>
              <td style={order.profit >= 0 ? styles.profitPositive : styles.profitNegative}>
                {formatCurrency(order.profit)}
              </td>
              <td style={styles.td}>{formatDate(order.date)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const renderDebtOrders = (orders: RecentDebtOrder[]) => (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead style={styles.tableHeader}>
          <tr>
            <th style={styles.th}>Order ID</th>
            <th style={styles.th}>Customer</th>
            <th style={styles.th}>Debt Status</th>
            <th style={styles.th}>Paid</th>
            <th style={styles.th}>Outstanding</th>
            <th style={styles.th}>Due Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td style={{ ...styles.td, fontWeight: 600 }}>
                <Link href={`/admin/collections/orders/${order.id}`}>#{order.id}</Link>
              </td>
              <td style={styles.td}>{order.customer}</td>
              <td style={styles.td}>
                <span style={getStatusStyle(order.debtStatus)}>{order.debtStatus}</span>
              </td>
              <td style={styles.td}>{formatCurrency(order.amountPaid)}</td>
              <td style={styles.td}>{formatCurrency(order.amountOutstanding)}</td>
              <td style={styles.td}>{formatDate(order.dueDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const renderTransactions = (transactions: TransactionSummary[]) => (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead style={styles.tableHeader}>
          <tr>
            <th style={styles.th}>Transaction</th>
            <th style={styles.th}>Customer Email</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Method</th>
            <th style={styles.th}>Amount</th>
            <th style={styles.th}>Order</th>
            <th style={styles.th}>Date</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td style={{ ...styles.td, fontWeight: 600 }}>#{transaction.id}</td>
              <td style={styles.td}>{transaction.customerEmail}</td>
              <td style={styles.td}>
                <span style={getStatusStyle(transaction.status)}>{transaction.status}</span>
              </td>
              <td style={styles.td}>{transaction.paymentMethod}</td>
              <td style={styles.td}>{formatCurrency(transaction.amount)}</td>
              <td style={styles.td}>
                {transaction.orderId ? (
                  <Link href={`/admin/collections/orders/${transaction.orderId}`}>
                    #{transaction.orderId}
                  </Link>
                ) : (
                  '-'
                )}
              </td>
              <td style={styles.td}>{formatDate(transaction.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const renderCustomers = (customers: CustomerProfitability[]) => (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead style={styles.tableHeader}>
          <tr>
            <th style={styles.th}>Customer Email</th>
            <th style={styles.th}>Orders</th>
            <th style={styles.th}>Revenue</th>
            <th style={styles.th}>Profit</th>
            <th style={styles.th}>Margin</th>
            <th style={styles.th}>Avg Order</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer, i) => (
            <tr key={i}>
              <td style={{ ...styles.td, fontWeight: 600 }}>{customer.email}</td>
              <td style={styles.td}>{customer.totalOrders}</td>
              <td style={styles.td}>{formatCurrency(customer.totalRevenue)}</td>
              <td style={customer.totalProfit >= 0 ? styles.profitPositive : styles.profitNegative}>
                {formatCurrency(customer.totalProfit)}
              </td>
              <td style={styles.td}>{customer.profitMargin.toFixed(1)}%</td>
              <td style={styles.td}>{formatCurrency(customer.averageOrderValue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const renderOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={styles.statsGrid}>
        <StatCard
          title="Revenue"
          value={formatCurrency(analytics.overview.totalRevenue)}
          change={analytics.overview.revenueChange}
          comparisonLabel={comparisonLabel}
          icon={DollarSign}
          color="#17594a"
          hint="Sales performance for the selected range"
        />
        <StatCard
          title="Net Profit"
          value={formatCurrency(analytics.overview.netProfit)}
          change={analytics.overview.profitChange}
          comparisonLabel={comparisonLabel}
          icon={Wallet}
          color="#0f766e"
          hint="Revenue after cost and expenses"
        />
        <StatCard
          title="Total Orders"
          value={analytics.overview.totalOrders.toLocaleString()}
          change={analytics.overview.ordersChange}
          comparisonLabel={comparisonLabel}
          icon={ShoppingCart}
          color="#d97706"
          href="/admin/collections/orders"
          hint="Open all orders"
        />
        <StatCard
          title="Items Sold"
          value={analytics.overview.totalItemsSold.toLocaleString()}
          change={analytics.overview.itemsSoldChange}
          comparisonLabel={comparisonLabel}
          icon={Package}
          color="#0f4c81"
          onClick={openSoldItems}
          hint="Show every sold item"
        />
        <StatCard
          title="Outstanding Debt"
          value={formatCurrency(analytics.overview.totalOutstandingDebt)}
          icon={CreditCard}
          color="#b45309"
          href="/admin/collections/orders"
          hint="Review debt-carrying orders"
        />
        <StatCard
          title="Customers"
          value={analytics.overview.totalCustomers.toLocaleString()}
          change={analytics.overview.customersChange}
          comparisonLabel={comparisonLabel}
          icon={Users}
          color="#7c3aed"
          onClick={openCustomerEmails}
          hint="View customers"
        />
      </div>

      <div style={styles.sectionCard}>
        <SectionHeader
          title="Revenue"
          copy="Revenue, gross profit, expenses, and debt collection are grouped here so you can read the business trend without switching screens."
        />
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={analytics.revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#17594a"
              strokeWidth={2.5}
              dot={false}
            />
            <Line type="monotone" dataKey="profit" stroke="#0f766e" strokeWidth={2.5} dot={false} />
            <Line
              type="monotone"
              dataKey="expense"
              stroke="#b91c1c"
              strokeWidth={2.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="debtCollected"
              stroke="#d97706"
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )

  const renderSales = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={styles.statsGrid}>
        <StatCard
          title="Revenue"
          value={formatCurrency(analytics.overview.totalRevenue)}
          change={analytics.overview.revenueChange}
          comparisonLabel={comparisonLabel}
          icon={DollarSign}
          color="#17594a"
        />
        <StatCard
          title="Gross Profit"
          value={formatCurrency(analytics.overview.totalProfit)}
          change={analytics.overview.profitChange}
          comparisonLabel={comparisonLabel}
          icon={Wallet}
          color="#0f766e"
        />
        <StatCard
          title="Expenses"
          value={formatCurrency(analytics.overview.totalExpenses)}
          change={analytics.overview.expensesChange}
          comparisonLabel={comparisonLabel}
          icon={CreditCard}
          color="#b91c1c"
          href="/admin/collections/expenses"
          hint="Open expenses"
        />
        <StatCard
          title="Net Margin"
          value={`${analytics.overview.profitMargin.toFixed(1)}%`}
          icon={Percent}
          color="#1d4ed8"
        />
      </div>

      <div style={styles.chartsGrid}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Expenses by category</h3>
          {analytics.expensesByCategory.length === 0 ? (
            <EmptyState message="No expenses recorded in this range." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={analytics.expensesByCategory}
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  dataKey="value"
                  labelLine={false}
                  label={(props: PieLabelRenderProps) => {
                    const name = (props.name ?? '') as string
                    const percent = props.percent ?? 0
                    return percent > 0.06 ? name : ''
                  }}
                >
                  {analytics.expensesByCategory.map((entry: ExpenseByCategory, index: number) => (
                    <Cell key={`${entry.name}-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number | undefined) => formatCurrency(value ?? 0)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Sales motion</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={analytics.revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#17594a"
                strokeWidth={2.5}
                dot={false}
              />
              <Line type="monotone" dataKey="cost" stroke="#64748b" strokeWidth={2.5} dot={false} />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#0f766e"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.sectionCard}>
        <SectionHeader
          title="Top products"
          copy="Products ranked by profit so you can separate volume from actual contribution."
        />
        {analytics.topProducts.length === 0 ? (
          <EmptyState message="No sold products in this range." />
        ) : (
          renderTopProducts(analytics.topProducts)
        )}
      </div>
    </div>
  )

  const renderOrdersTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={styles.statsGrid}>
        <StatCard
          title="Total Orders"
          value={analytics.overview.totalOrders.toLocaleString()}
          change={analytics.overview.ordersChange}
          comparisonLabel={comparisonLabel}
          icon={ShoppingCart}
          color="#d97706"
          href="/admin/collections/orders"
          hint="Open orders"
        />
        <StatCard
          title="Items Sold"
          value={analytics.overview.totalItemsSold.toLocaleString()}
          change={analytics.overview.itemsSoldChange}
          comparisonLabel={comparisonLabel}
          icon={Package}
          color="#0f4c81"
          onClick={openSoldItems}
          hint="Inspect all sold items"
        />
        <StatCard
          title="Products Active"
          value={analytics.overview.totalProducts.toLocaleString()}
          icon={Package}
          color="#334155"
          href="/admin/collections/products"
          hint="Open catalog"
        />
      </div>

      <div style={styles.chartsGrid}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Order status spread</h3>
          {analytics.orderStatusData.length === 0 ? (
            <EmptyState message="No order statuses available." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={analytics.orderStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={96}
                  dataKey="value"
                  labelLine={false}
                  label={(props: PieLabelRenderProps) => {
                    const name = (props.name ?? '') as string
                    const percent = props.percent ?? 0
                    return percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                  }}
                >
                  {analytics.orderStatusData.map((entry: OrderStatusData, index: number) => (
                    <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Recent order feed</h3>
          {analytics.recentOrders.length === 0 ? (
            <EmptyState message="No recent orders in this range." />
          ) : (
            renderRecentOrders(analytics.recentOrders.slice(0, 5))
          )}
        </div>
      </div>

      <div style={styles.sectionCard}>
        <SectionHeader
          title="Recent orders"
          copy="The latest orders with revenue, cost, and profit attached for quick review."
        />
        {analytics.recentOrders.length === 0 ? (
          <EmptyState message="No recent orders in this range." />
        ) : (
          renderRecentOrders(analytics.recentOrders)
        )}
      </div>
    </div>
  )

  const renderDebts = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={styles.statsGrid}>
        <StatCard
          title="Debt Collected"
          value={formatCurrency(analytics.overview.debtCollected)}
          change={analytics.overview.debtCollectedChange}
          comparisonLabel={comparisonLabel}
          icon={Wallet}
          color="#0f766e"
          href="/admin/collections/debt-payments"
          hint="Open debt payments"
        />
        <StatCard
          title="Outstanding Debt"
          value={formatCurrency(analytics.overview.totalOutstandingDebt)}
          icon={CreditCard}
          color="#b45309"
          href="/admin/collections/orders"
          hint="Review debt orders"
        />
        <StatCard
          title="Active Debt Orders"
          value={analytics.overview.activeDebtOrders.toLocaleString()}
          icon={ShoppingCart}
          color="#475569"
        />
        <StatCard
          title="Overdue"
          value={analytics.overview.overdueDebtOrders.toLocaleString()}
          icon={AlertTriangle}
          color="#b91c1c"
        />
      </div>

      <div style={styles.chartsGrid}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Debt status mix</h3>
          {analytics.debtStatusData.length === 0 ? (
            <EmptyState message="No debt-tracked orders available." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={analytics.debtStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={96}
                  dataKey="value"
                  labelLine={false}
                  label={(props: PieLabelRenderProps) => {
                    const name = (props.name ?? '') as string
                    const percent = props.percent ?? 0
                    return percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                  }}
                >
                  {analytics.debtStatusData.map((entry: OrderStatusData, index: number) => (
                    <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Debt recovery trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={analytics.revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="debtCollected"
                stroke="#d97706"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.sectionCard}>
        <SectionHeader
          title="Debt-carrying orders"
          copy="These are the most recent orders with outstanding balances so collection follow-up is one click away."
        />
        {analytics.recentDebtOrders.length === 0 ? (
          <EmptyState message="No active debt orders in this range." />
        ) : (
          renderDebtOrders(analytics.recentDebtOrders)
        )}
      </div>
    </div>
  )

  const renderTransactionsTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={styles.statsGrid}>
        <StatCard
          title="Transactions"
          value={totalTransactions.toLocaleString()}
          icon={CreditCard}
          color="#1d4ed8"
          href="/admin/collections/transactions"
          hint="Open transactions"
        />
        <StatCard
          title="Succeeded"
          value={
            analytics.transactionStatusData
              .find((entry) => entry.name.toLowerCase() === 'succeeded')
              ?.value.toLocaleString() || '0'
          }
          icon={Wallet}
          color="#0f766e"
        />
        <StatCard
          title="Pending"
          value={
            analytics.transactionStatusData
              .find((entry) => entry.name.toLowerCase() === 'pending')
              ?.value.toLocaleString() || '0'
          }
          icon={ShoppingCart}
          color="#d97706"
        />
        <StatCard
          title="Failed"
          value={
            analytics.transactionStatusData
              .find((entry) => entry.name.toLowerCase() === 'failed')
              ?.value.toLocaleString() || '0'
          }
          icon={AlertTriangle}
          color="#b91c1c"
        />
      </div>

      <div style={styles.chartsGrid}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Transaction status spread</h3>
          {analytics.transactionStatusData.length === 0 ? (
            <EmptyState message="No transactions available in this range." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={analytics.transactionStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={96}
                  dataKey="value"
                  labelLine={false}
                  label={(props: PieLabelRenderProps) => {
                    const name = (props.name ?? '') as string
                    const percent = props.percent ?? 0
                    return percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                  }}
                >
                  {analytics.transactionStatusData.map((entry: OrderStatusData, index: number) => (
                    <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div style={styles.sectionCard}>
        <SectionHeader
          title="Recent transactions"
          copy="Payment activity is listed here with email, payment method, and linked order where available."
        />
        {analytics.recentTransactions.length === 0 ? (
          <EmptyState message="No recent transactions in this range." />
        ) : (
          renderTransactions(analytics.recentTransactions)
        )}
      </div>
    </div>
  )

  const renderCustomersTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={styles.statsGrid}>
        <StatCard
          title="Customer"
          value={analytics.overview.totalCustomers.toLocaleString()}
          change={analytics.overview.customersChange}
          comparisonLabel={comparisonLabel}
          icon={Users}
          color="#7c3aed"
          onClick={openCustomerEmails}
          hint="Open the customer list"
        />
        <StatCard
          title="Orders"
          value={analytics.overview.totalOrders.toLocaleString()}
          change={analytics.overview.ordersChange}
          comparisonLabel={comparisonLabel}
          icon={ShoppingCart}
          color="#d97706"
        />
        <StatCard
          title="Revenue"
          value={formatCurrency(analytics.overview.totalRevenue)}
          change={analytics.overview.revenueChange}
          comparisonLabel={comparisonLabel}
          icon={DollarSign}
          color="#17594a"
        />
      </div>

      <div style={styles.sectionCard}>
        <SectionHeader
          title="Top customers"
          copy="Customers are identified by email so guest orders and account orders are measured the same way."
        />
        {analytics.topCustomers.length === 0 ? (
          <EmptyState message="No customer order data in this range." />
        ) : (
          renderCustomers(analytics.topCustomers)
        )}
      </div>
    </div>
  )

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'sales':
        return renderSales()
      case 'orders':
        return renderOrdersTab()
      case 'debts':
        return renderDebts()
      case 'transactions':
        return renderTransactionsTab()
      case 'customers':
        return renderCustomersTab()
      case 'overview':
      default:
        return renderOverview()
    }
  }

  const drilldownRows =
    drilldown === 'soldItems'
      ? analytics.soldItems
      : drilldown === 'customers'
        ? analytics.customerEmails
        : []

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div style={styles.heroLabel}>Fwatches commerce</div>
        <h1 style={styles.heroTitle}>Analytics</h1>
        <p style={styles.heroCopy}>
          Use section tabs to move between sales, orders, debts, transactions, and customers without
          losing the current date range. Change badges now explain which earlier period each metric
          is being compared against.
        </p>
      </div>

      <div style={styles.toolbar}>
        <div style={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...styles.tabButton,
                backgroundColor: activeTab === tab.id ? '#17594a' : '#fff',
                color: activeTab === tab.id ? '#fff' : '#22423a',
                borderColor: activeTab === tab.id ? '#17594a' : '#d8e3df',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={styles.filterGroup}>
          <select
            value={timeRange}
            onChange={(e) => {
              const nextRange = e.target.value as TimeRange
              setTimeRange(nextRange)
              setActiveRange({ mode: 'preset', days: nextRange })
            }}
            style={styles.select}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <input
            type="date"
            value={customStartDate}
            onChange={(e) => setCustomStartDate(e.target.value)}
            style={styles.input}
          />
          <input
            type="date"
            value={customEndDate}
            onChange={(e) => setCustomEndDate(e.target.value)}
            style={styles.input}
          />
          <button
            type="button"
            onClick={applyCustomRange}
            disabled={!customStartDate || !customEndDate}
            style={{
              ...styles.actionButton,
              opacity: !customStartDate || !customEndDate ? 0.55 : 1,
            }}
          >
            Apply range
          </button>
          <button type="button" onClick={clearCustomRange} style={styles.secondaryButton}>
            Clear
          </button>
        </div>
      </div>

      <div style={{ color: '#64748b', fontSize: '13px', marginTop: '-8px' }}>
        Showing analytics for {activeRangeLabel}. Changes are calculated against {comparisonLabel}.
      </div>

      {renderActiveTab()}

      {drilldown ? (
        <div style={styles.modalBackdrop} onClick={() => setDrilldown(null)}>
          <div style={styles.modal} onClick={(event) => event.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={{ margin: 0, fontSize: '22px', color: '#0f172a' }}>
                  {drilldown === 'soldItems' ? 'All sold items' : 'Customer email list'}
                </h2>
                <p style={{ margin: '6px 0 0', color: '#64748b' }}>
                  {drilldown === 'soldItems'
                    ? 'Every sold item in the selected range, ranked by quantity.'
                    : 'Distinct customer emails captured from orders in the selected range.'}
                </p>
              </div>
              <button type="button" onClick={() => setDrilldown(null)} style={styles.closeButton}>
                Close
              </button>
            </div>

            {drilldownRows.length === 0 ? (
              <EmptyState
                message={
                  drilldown === 'soldItems'
                    ? 'No sold items in this range.'
                    : 'No customer emails in this range.'
                }
              />
            ) : drilldown === 'soldItems' ? (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead style={styles.tableHeader}>
                    <tr>
                      <th style={styles.th}>Item</th>
                      <th style={styles.th}>Units Sold</th>
                      <th style={styles.th}>Orders</th>
                      <th style={styles.th}>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(drilldownRows as SoldItemSummary[]).map((item) => (
                      <tr key={item.id}>
                        <td style={{ ...styles.td, fontWeight: 600 }}>
                          {item.id !== 'unknown' ? (
                            <Link href={`/admin/collections/products/${item.id}`}>{item.name}</Link>
                          ) : (
                            item.name
                          )}
                        </td>
                        <td style={styles.td}>{item.quantitySold}</td>
                        <td style={styles.td}>{item.ordersCount}</td>
                        <td style={styles.td}>{formatCurrency(item.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead style={styles.tableHeader}>
                    <tr>
                      <th style={styles.th}>Customer Email</th>
                      <th style={styles.th}>Orders</th>
                      <th style={styles.th}>Revenue</th>
                      <th style={styles.th}>Last Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(drilldownRows as CustomerEmailSummary[]).map((customer) => (
                      <tr key={customer.email}>
                        <td style={{ ...styles.td, fontWeight: 600 }}>{customer.email}</td>
                        <td style={styles.td}>{customer.totalOrders}</td>
                        <td style={styles.td}>{formatCurrency(customer.totalRevenue)}</td>
                        <td style={styles.td}>{formatDate(customer.lastOrderDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default AnalyticsClient
