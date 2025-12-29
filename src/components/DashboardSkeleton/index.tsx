const Skeleton: React.FC<{ width?: string; height?: string; style?: React.CSSProperties }> = ({
  width = '100%',
  height = '16px',
  style = {},
}) => (
  <div
    style={{
      width,
      height,
      backgroundColor: '#e5e7eb',
      borderRadius: '6px',
      animation: 'pulse 1.5s infinite ease-in-out',
      ...style,
    }}
  />
)

export const DashboardSkeleton: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }
      `}</style>

      {/* Time range dropdown skeleton */}
      <div style={{ width: '180px' }}>
        <Skeleton height="38px" />
      </div>

      {/* Stats Grid Skeleton */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '20px',
              height: '120px',
            }}
          >
            <Skeleton width="40px" height="40px" />
            <Skeleton width="60%" height="14px" style={{ marginTop: '12px' }} />
            <Skeleton width="40%" height="20px" style={{ marginTop: '10px' }} />
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px',
        }}
      >
        {/* Chart card skeletons */}
        {[1, 2].map((i) => (
          <div
            key={i}
            style={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '24px',
              height: '350px',
            }}
          >
            <Skeleton width="40%" height="20px" />
            <Skeleton width="100%" height="250px" style={{ marginTop: '20px' }} />
          </div>
        ))}
      </div>

      {/* Table Skeletons (Top Products, Top Customers, Recent Orders) */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '24px',
          }}
        >
          <Skeleton width="30%" height="20px" />
          <div style={{ marginTop: '20px' }}>
            {Array.from({ length: 5 }).map((_, row) => (
              <Skeleton
                key={row}
                width="100%"
                height="40px"
                style={{ marginBottom: '12px', borderRadius: '8px' }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
