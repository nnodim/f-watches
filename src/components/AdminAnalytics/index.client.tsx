'use client'
import type {
  AnalyticsData,
  CustomerProfitability,
  ExpenseByCategory,
  OrderStatusData,
  RecentOrder,
  StatCardProps,
  TimeRange,
  TopProduct,
} from '@/types/index'
import {
  CreditCard,
  DollarSign,
  Percent,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
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
import Link from 'next/link'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount)
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
    paddingBottom: '32px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '16px',
  },
  select: {
    padding: '8px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    color: '#374151',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
  },
  statCard: {
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },
  statCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  iconWrapper: {
    padding: '12px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeIndicator: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
    fontWeight: 500,
    gap: '4px',
  },
  statLabel: { color: '#6b7280', fontSize: '13px', fontWeight: 500, marginBottom: '4px' },
  statValue: { fontSize: '22px', fontWeight: 700, color: '#111827' },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
  },
  chartCard: {
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },
  chartTitle: { fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '16px' },
  // ... Tables and other styles
  table: { width: '100%', borderCollapse: 'collapse' as const },
  tableHeader: { backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' },
  th: {
    padding: '12px 16px',
    textAlign: 'left' as const,
    fontSize: '11px',
    fontWeight: 500,
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  td: {
    padding: '14px 16px',
    fontSize: '13px',
    color: '#111827',
    borderBottom: '1px solid #e5e7eb',
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: 600,
    display: 'inline-block',
  },
  profitPositive: { color: '#059669', fontWeight: 600 },
  profitNegative: { color: '#dc2626', fontWeight: 600 },
}
const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon: Icon, color }) => (
  <div style={styles.statCard}>
    <div style={styles.statCardHeader}>
      <div style={{ ...styles.iconWrapper, backgroundColor: color }}>
        <Icon style={{ width: '20px', height: '20px', color: '#fff' }} />
      </div>
      {change !== 0 && (
        <div
          style={{
            ...styles.changeIndicator,
            color:
              change > 0
                ? title === 'Expenses'
                  ? '#dc2626'
                  : '#059669'
                : title === 'Expenses'
                  ? '#059669'
                  : '#dc2626',
          }}
        >
          {/* Logic flipped for expenses: increase is bad (red), decrease is good (green) */}
          {change > 0 ? (
            <TrendingUp style={{ width: '14px', height: '14px' }} />
          ) : (
            <TrendingDown style={{ width: '14px', height: '14px' }} />
          )}
          {Math.abs(change)}%
        </div>
      )}
    </div>
    <div style={styles.statLabel}>{title}</div>
    <div style={styles.statValue}>{value}</div>
  </div>
)

export const AnalyticsClient: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true)
  const [timeRange, setTimeRange] = useState<TimeRange>('30')
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    overview: {
      totalRevenue: 0,
      totalProfit: 0,
      totalCost: 0,
      totalExpenses: 0,
      netProfit: 0,
      profitMargin: 0,
      totalOrders: 0,
      totalProducts: 0,
      totalCustomers: 0,
      revenueChange: 0,
      profitChange: 0,
      expensesChange: 0,
      ordersChange: 0,
      productsChange: 0,
      customersChange: 0,
      totalItemsSold: 0,
      itemsSoldChange: 0,
    },
    revenueData: [],
    orderStatusData: [],
    expensesByCategory: [],
    topProducts: [],
    recentOrders: [],
    topCustomers: [],
  })
  const fetchAnalytics = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics?days=${timeRange}`)
      const data: AnalyticsData = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const getStatusStyle = (status: string) => {
    const baseStyle = styles.statusBadge
    switch (status) {
      case 'completed':
        return { ...baseStyle, backgroundColor: '#d1fae5', color: '#065f46' }
      case 'processing':
        return { ...baseStyle, backgroundColor: '#dbeafe', color: '#1e40af' }
      case 'cancelled':
        return { ...baseStyle, backgroundColor: '#fee2e2', color: '#991b1b' }
      default:
        return { ...baseStyle, backgroundColor: '#f3f4f6', color: '#374151' }
    }
  }

  // if (loading) {
  //   return (
  //     <div style={styles.loadingContainer}>
  //       <style>{`
  //         @keyframes spin {
  //           to { transform: rotate(360deg); }
  //         }
  //       `}</style>
  //       <div style={styles.spinner}></div>
  //     </div>
  //   )
  // }

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div style={styles.container}>
      {/* Time Range Filter */}
      <div style={styles.header}>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          style={styles.select}
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <StatCard
          title="Total Revenue"
          value={formatCurrency(analytics.overview.totalRevenue)}
          change={analytics.overview.revenueChange}
          icon={DollarSign}
          color="#3b82f6"
        />
        <StatCard
          title="Net Profit"
          value={formatCurrency(analytics.overview.netProfit)}
          change={analytics.overview.profitChange}
          icon={Wallet}
          color="#10b981"
        />
        <Link href="/admin/collections/expenses">
          <StatCard
            title="Expenses"
            value={formatCurrency(analytics.overview.totalExpenses)}
            change={analytics.overview.expensesChange}
            icon={CreditCard}
            color="#ef4444"
          />
        </Link>
        <StatCard
          title="Net Margin"
          value={`${analytics.overview.profitMargin.toFixed(1)}%`}
          change={0}
          icon={Percent}
          color="#8b5cf6"
        />
        <Link href="/admin/collections/orders">
          <StatCard
            title="Total Orders"
            value={analytics.overview.totalOrders.toLocaleString()}
            change={analytics.overview.ordersChange}
            icon={ShoppingCart}
            color="#f59e0b"
          />
        </Link>
        <Link href="/admin/collections/products">
          <StatCard
            title="Items Sold"
            value={analytics.overview.totalItemsSold.toLocaleString()}
            change={analytics.overview.itemsSoldChange}
            icon={ShoppingCart}
            color="#0ea5e9"
          />
        </Link>
        <StatCard
          title="Customers"
          value={analytics.overview.totalCustomers.toLocaleString()}
          change={analytics.overview.customersChange}
          icon={Users}
          color="#6366f1"
        />
      </div>

      {/* Charts Row */}
      <div style={styles.chartsGrid}>
        {/* Revenue & Profit Chart */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Financial Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  textTransform: 'capitalize',
                  color: '#6b7280',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="Revenue"
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                name="Gross Profit"
              />
              <Line
                type="monotone"
                dataKey="expense"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                name="Expenses"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Expenses Breakdown */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Expenses by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.expensesByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: PieLabelRenderProps) => {
                  const name = (props && (props.name ?? '')) as string
                  const percent = (props && props.percent) ?? 0
                  return percent > 0.05 ? `${name}` : ''
                }}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.expensesByCategory.map((entry: ExpenseByCategory, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number | undefined) => formatCurrency(value ?? 0)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Chart */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Order Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.orderStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: PieLabelRenderProps) => {
                  const name = (props && (props.name ?? '')) as string
                  const percent = (props && props.percent) ?? 0
                  return `${name}: ${(percent * 100).toFixed(0)}%`
                }}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.orderStatusData.map((entry: OrderStatusData, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products by Profit */}
      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>Top Products by Profit</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead style={styles.tableHeader}>
              <tr>
                <th style={styles.th}>Product</th>
                <th style={styles.th}>Sales</th>
                <th style={styles.th}>Revenue</th>
                <th style={styles.th}>Profit</th>
                <th style={styles.th}>Margin</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topProducts.map((product: TopProduct, index: number) => (
                <tr key={index}>
                  <td style={{ ...styles.td, fontWeight: 500 }}>
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
      </div>

      {/* Top Customers by Profitability */}
      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>Top Customers by Profitability</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead style={styles.tableHeader}>
              <tr>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Orders</th>
                <th style={styles.th}>Revenue</th>
                <th style={styles.th}>Profit</th>
                <th style={styles.th}>Margin</th>
                <th style={styles.th}>Avg Order</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topCustomers.map((customer: CustomerProfitability) => (
                <tr key={customer.id || customer.email}>
                  <td style={{ ...styles.td, fontWeight: 500 }}>{customer.email}</td>
                  <td style={styles.td}>{customer.totalOrders}</td>
                  <td style={styles.td}>{formatCurrency(customer.totalRevenue)}</td>
                  <td
                    style={
                      customer.totalProfit >= 0 ? styles.profitPositive : styles.profitNegative
                    }
                  >
                    {formatCurrency(customer.totalProfit)}
                  </td>
                  <td style={styles.td}>{customer.profitMargin.toFixed(1)}%</td>
                  <td style={styles.td}>{formatCurrency(customer.averageOrderValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Orders */}
      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>Recent Orders</h3>
        <div style={{ overflowX: 'auto' }}>
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
              {analytics.recentOrders.map((order: RecentOrder) => (
                <tr key={order.id}>
                  <td style={{ ...styles.td, fontWeight: 500 }}>#{order.id}</td>
                  <td style={styles.td}>{order.customer}</td>
                  <td style={styles.td}>
                    <span style={getStatusStyle(order.status)}>{order.status}</span>
                  </td>
                  <td style={styles.td}>{formatCurrency(order.amount)}</td>
                  <td style={styles.td}>{formatCurrency(order.cost)}</td>
                  <td style={order.profit >= 0 ? styles.profitPositive : styles.profitNegative}>
                    {formatCurrency(order.profit)}
                  </td>
                  <td style={{ ...styles.td, color: '#6b7280' }}>
                    {new Date(order.date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsClient
