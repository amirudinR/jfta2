import { useEffect } from 'react'
import {
  CalendarCheck, GraduationCap, FlaskConical,
  History, User, X, BarChart3,
} from 'lucide-react'

const NAV_ITEMS = [
  { key: 'harian',    label: 'Hafalan Harian', icon: CalendarCheck, desc: 'Target hafalan hari ini' },
  { key: 'kartu',    label: 'Latihan',         icon: GraduationCap, desc: 'Kartu, kuis, sprint' },
  { key: 'ujian-baru', label: 'Ujian',         icon: FlaskConical,  desc: 'Uji kemampuanmu' },
  { key: 'recall',   label: 'Recall',           icon: History,       desc: 'Ulangi materi lampau' },
  { key: 'kemampuan',label: 'Kemampuan',        icon: BarChart3,     desc: 'Statistik & progres' },
  { key: 'profil',   label: 'Profil',           icon: User,          desc: 'Akun & pengaturan' },
]

const LATIHAN_MODES = ['kartu','kuis','ulangi','sprint','daftar','referensi','materi']

export default function Sidebar({ open, onClose, active, onChange, user, recallDue = 0 }) {
  // Tutup sidebar saat tekan Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Kunci scroll body saat sidebar terbuka
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleNav = (key) => {
    onChange(key)
    onClose()
  }

  const isActive = (key) => {
    if (key === 'kartu') return LATIHAN_MODES.includes(active)
    return active === key
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`sidebar-backdrop ${open ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Menu navigasi" role="navigation">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="hanko" style={{ width: 36, height: 36, fontSize: 13, borderRadius: 10 }}>暗記</span>
            <span className="sidebar-brand-text">Menu</span>
          </div>
          <button className="sidebar-close" onClick={onClose} aria-label="Tutup menu">
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active_ = isActive(item.key)
            return (
              <button
                key={item.key}
                className={`sidebar-item ${active_ ? 'active' : ''}`}
                onClick={() => handleNav(item.key)}
                aria-current={active_ ? 'page' : undefined}
              >
                <span className="sidebar-item-icon">
                  {item.key === 'profil' && user?.photoURL ? (
                    <img src={user.photoURL} alt="" className="sidebar-avatar" referrerPolicy="no-referrer" />
                  ) : (
                    <Icon size={20} />
                  )}
                  {item.key === 'recall' && recallDue > 0 && (
                    <span className="sidebar-badge">{recallDue}</span>
                  )}
                </span>
                <span className="sidebar-item-text">
                  <span className="sidebar-item-label">{item.label}</span>
                  <span className="sidebar-item-desc">{item.desc}</span>
                </span>
                {active_ && <span className="sidebar-active-dot" aria-hidden />}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          {user ? (
            <div className="sidebar-user">
              {user.photoURL && (
                <img src={user.photoURL} alt="" className="sidebar-user-avatar" referrerPolicy="no-referrer" />
              )}
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{user.displayName || 'Pengguna'}</span>
                <span className="sidebar-user-email">{user.email}</span>
              </div>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  )
}
