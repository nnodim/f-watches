const Skeleton: React.FC<{ width?: string; height?: string; style?: React.CSSProperties }> = ({
  width = '100%',
  height = '16px',
  style = {},
}) => (
  <div
    style={{
      width,
      height,
      background:
        'linear-gradient(90deg, rgba(226,232,240,0.9) 0%, rgba(241,245,249,1) 50%, rgba(226,232,240,0.9) 100%)',
      backgroundSize: '200% 100%',
      borderRadius: '10px',
      animation: 'pulse 1.4s ease-in-out infinite',
      ...style,
    }}
  />
)

const Surface: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style = {},
}) => (
  <div
    style={{
      backgroundColor: '#fff',
      border: '1px solid #e6ece9',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
      ...style,
    }}
  >
    {children}
  </div>
)

export const DashboardSkeleton: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '32px' }}>
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.85; background-position: 0% 50%; }
          50% { opacity: 0.45; background-position: 100% 50%; }
          100% { opacity: 0.85; background-position: 0% 50%; }
        }
      `}</style>

      <div
        style={{
          background:
            'linear-gradient(135deg, rgba(12,52,43,1) 0%, rgba(18,112,91,0.92) 48%, rgba(226,152,52,0.95) 100%)',
          borderRadius: '24px',
          padding: '28px',
        }}
      >
        <Skeleton
          width="180px"
          height="28px"
          style={{ background: 'rgba(255,255,255,0.24)', borderRadius: '999px' }}
        />
        <Skeleton
          width="320px"
          height="40px"
          style={{ marginTop: '18px', background: 'rgba(255,255,255,0.32)' }}
        />
        <Skeleton
          width="76%"
          height="16px"
          style={{ marginTop: '18px', background: 'rgba(255,255,255,0.22)' }}
        />
        <Skeleton
          width="62%"
          height="16px"
          style={{ marginTop: '10px', background: 'rgba(255,255,255,0.18)' }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} width="96px" height="40px" style={{ borderRadius: '999px' }} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Skeleton width="150px" height="42px" />
          <Skeleton width="150px" height="42px" />
          <Skeleton width="150px" height="42px" />
          <Skeleton width="120px" height="42px" />
          <Skeleton width="92px" height="42px" />
        </div>
      </div>

      <Skeleton width="460px" height="14px" />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px',
        }}
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <Surface key={index} style={{ padding: '20px', minHeight: '164px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px',
                marginBottom: '18px',
              }}
            >
              <Skeleton width="44px" height="44px" style={{ borderRadius: '14px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                <Skeleton width="60px" height="14px" />
                <Skeleton width="84px" height="10px" />
              </div>
            </div>
            <Skeleton width="44%" height="12px" />
            <Skeleton width="62%" height="30px" style={{ marginTop: '10px' }} />
            <Skeleton width="70%" height="12px" style={{ marginTop: '14px' }} />
          </Surface>
        ))}
      </div>

      <Surface>
        <Skeleton width="180px" height="22px" />
        <Skeleton width="54%" height="14px" style={{ marginTop: '12px' }} />
        <Skeleton width="100%" height="320px" style={{ marginTop: '20px', borderRadius: '18px' }} />
      </Surface>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
        }}
      >
        {[1, 2].map((index) => (
          <Surface key={index} style={{ padding: '20px' }}>
            <Skeleton width="150px" height="20px" />
            <Skeleton width="72%" height="12px" style={{ marginTop: '12px' }} />
            <Skeleton width="100%" height="280px" style={{ marginTop: '18px', borderRadius: '18px' }} />
          </Surface>
        ))}
      </div>

      {[1, 2].map((index) => (
        <Surface key={index}>
          <Skeleton width="180px" height="22px" />
          <Skeleton width="58%" height="14px" style={{ marginTop: '12px' }} />
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Array.from({ length: 5 }).map((_, row) => (
              <Skeleton key={row} width="100%" height="42px" style={{ borderRadius: '12px' }} />
            ))}
          </div>
        </Surface>
      ))}
    </div>
  )
}
