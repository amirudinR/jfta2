export default function StatsBar({ pct, color = 'var(--kin)' }) {
  return (
    <div
      style={{
        flex: 1,
        height: 10,
        background: 'var(--card-line)',
        borderRadius: 5,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${Math.min(Math.max(pct, 0), 100)}%`,
          height: '100%',
          background: color,
          borderRadius: 5,
          transition: 'width .3s',
        }}
      />
    </div>
  )
}
