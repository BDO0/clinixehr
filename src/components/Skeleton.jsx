export function SkeletonCard({ lines = 3, height = 80 }) {
  return (
    <div className="card" style={{ padding: '1rem', marginBottom: '0.75rem' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{
            height: i === 0 ? 18 : 13,
            width: i === 0 ? '60%' : i === lines - 1 ? '40%' : '85%',
            marginBottom: i < lines - 1 ? 10 : 0,
          }}
        />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 4 }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="skeleton" style={{ height: 13, width: '50%' }} />
      <div className="skeleton" style={{ height: 28, width: '70%' }} />
      <div className="skeleton" style={{ height: 11, width: '40%' }} />
    </div>
  );
}
