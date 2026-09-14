export default function StatBox({ label, value }) {
  return (
    <div style={{ background: 'var(--card-deep)', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--card-soft)', marginTop: 2 }}>{label}</div>
    </div>
  )
}
