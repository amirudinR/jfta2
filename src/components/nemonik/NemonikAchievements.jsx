import { Lock, Sparkles } from 'lucide-react'
import { BADGES, levelInfo } from '../../lib/nemonik-achievements'

// Panel achievement: bar XP/level + grid badge (terbuka/terkunci).
export default function NemonikAchievements({ xp = 0, unlocked = {} }) {
  const { level, intoLevel, needed, pct } = levelInfo(xp)
  const unlockedCount = BADGES.filter((b) => unlocked[b.id]).length

  return (
    <div className="nemo-ach">
      <div className="nemo-ach-head">
        <div className="nemo-ach-level">
          <Sparkles size={16} />
          <span>Level {level}</span>
        </div>
        <span className="nemo-ach-xp">{xp} XP</span>
      </div>

      <div className="nemo-ach-xpbar" role="progressbar" aria-valuenow={intoLevel} aria-valuemin={0} aria-valuemax={needed}>
        <div className="nemo-ach-xpfill" style={{ width: `${pct}%` }} />
      </div>
      <div className="nemo-ach-xpnote">{intoLevel} / {needed} XP menuju Level {level + 1}</div>

      <div className="nemo-ach-sub">
        Badge {unlockedCount}/{BADGES.length}
      </div>
      <div className="nemo-ach-grid">
        {BADGES.map((b) => {
          const on = !!unlocked[b.id]
          return (
            <div className={`nemo-ach-badge ${on ? 'on' : 'off'}`} key={b.id} title={b.desc}>
              <div className="nemo-ach-icon">{on ? b.icon : <Lock size={18} />}</div>
              <div className="nemo-ach-label">{b.label}</div>
              <div className="nemo-ach-desc">{b.desc}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
