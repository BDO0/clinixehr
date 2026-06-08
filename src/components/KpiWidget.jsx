import SparklineChart from './SparklineChart';

/**
 * KPI stat card with optional sparkline trend chart.
 * Reusable for dashboard analytics.
 */
export default function KpiWidget({ icon: Icon, label, value, sub, color = '#C48B28', bg, trend = [], trendKey = 'value' }) {
  return (
    <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: '0.72rem', fontWeight: 600,
          color: 'var(--color-text-sub)', textTransform: 'uppercase', letterSpacing: '0.04em'
        }}>
          {label}
        </span>
        {Icon && (
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: bg || 'rgba(196,139,40,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Icon size={18} color={color} strokeWidth={2} />
          </div>
        )}
      </div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text-main)', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{sub}</div>}
      {trend.length > 0 && <SparklineChart data={trend} dataKey={trendKey} color={color} height={50} />}
    </div>
  );
}