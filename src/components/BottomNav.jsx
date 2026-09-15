import { CalendarCheck, GraduationCap, FlaskConical, History, User } from 'lucide-react'

// Mode-mode yang dianggap "aktif di tab Latihan"
const LATIHAN_MODES = [
  'kartu', 'kuis', 'ulangi', 'sprint', 'daftar',
  'referensi', 'kemampuan', 'materi',
]

const TABS = [
  { key: 'harian',    label: 'Harian',   icon: CalendarCheck },
  { key: 'latihan',  label: 'Latihan',  icon: GraduationCap },
  { key: 'ujian-baru', label: 'Ujian',  icon: FlaskConical },
  { key: 'recall',   label: 'Recall',   icon: History },
  { key: 'profil',   label: 'Profil',   icon: User },
]

export default function BottomNav({ active, onChange, user, recallDue = 0 }) {
  return (
    <nav className="bottom-nav no-print" aria-label="Navigasi utama">
      {TABS.map((t) => {
        const Icon = t.icon
        const isActive =
          (t.key === 'latihan' && LATIHAN_MODES.includes(active)) ||
          active === t.key

        // Tab Latihan → masuk ke mode kartu (default latihan)
        const handleClick = () => {
          if (t.key === 'latihan') { onChange('kartu'); return }
          onChange(t.key)
        }

        return (
          <button
            key={t.key}
            className={`bnav-item ${isActive ? 'active' : ''}`}
            onClick={handleClick}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="bnav-icon-wrap">
              {t.key === 'profil' && user?.photoURL ? (
                <img src={user.photoURL} alt="" className="bnav-avatar" referrerPolicy="no-referrer" />
              ) : (
                <Icon size={22} />
              )}
              {t.key === 'recall' && recallDue > 0 ? (
                <span className="bnav-badge">{recallDue}</span>
              ) : null}
            </span>
            <span className="bnav-label">{t.label}</span>
            {isActive && <span className="bnav-dot" aria-hidden />}
          </button>
        )
      })}
    </nav>
  )
}
