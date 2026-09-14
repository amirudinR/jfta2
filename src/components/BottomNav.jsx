import { BookOpen, FlaskConical, History, BarChart3, User } from 'lucide-react'

const TABS = [
  { key: 'materi', label: 'Materi', icon: BookOpen },
  { key: 'ujian-baru', label: 'Ujian', icon: FlaskConical },
  { key: 'recall', label: 'Recall', icon: History },
  { key: 'kemampuan', label: 'Progress', icon: BarChart3 },
  { key: 'profil', label: 'Profil', icon: User },
]

export default function BottomNav({ active, onChange, user, recallDue = 0 }) {
  return (
    <nav className="bottom-nav no-print" role="tablist">
      {TABS.map((t) => {
        const Icon = t.icon
        const isActive = active === t.key
          || (t.key === 'materi' && ['harian', 'materi', 'kartu', 'kuis', 'ulangi', 'sprint', 'ujian', 'daftar', 'referensi', 'kotoba-n3', 'kotoba-n2', 'kotoba-n1'].includes(active))
          || (t.key === 'ujian-baru' && active === 'ujian-baru')
          || (t.key === 'recall' && active === 'recall')
          || (t.key === 'kemampuan' && active === 'kemampuan')
          || (t.key === 'profil' && active === 'profil')
        return (
          <button
            key={t.key}
            className={`bnav-item ${isActive ? 'active' : ''}`}
            onClick={() => onChange(t.key)}
            role="tab"
            aria-selected={isActive}
          >
            {t.key === 'profil' && user?.photoURL ? (
              <img src={user.photoURL} alt="" className="bnav-avatar" referrerPolicy="no-referrer" />
            ) : (
              <Icon size={20} />
            )}
            {t.key === 'recall' && recallDue > 0 ? (
              <span className="bnav-badge">{recallDue}</span>
            ) : null}
            <span>{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
