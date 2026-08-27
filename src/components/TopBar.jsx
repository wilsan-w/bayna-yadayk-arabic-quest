import { motion } from 'framer-motion'
import { useGameStore, levelFromXp } from '../store/useGameStore'

export default function TopBar({ onHome, onSettings, onReview, onCalendar, onBadges }) {
  const xp = useGameStore((s) => s.xp)
  const streak = useGameStore((s) => s.streak)
  const { level, into, need } = levelFromXp(xp)
  const pct = Math.min(1, into / need)

  return (
    <div className="topbar">
      <div className="level-badge" onClick={onHome} title="Home" style={{ cursor: 'pointer' }}>
        {level}
      </div>
      <div className="xp-track">
        <div className="xp-label">
          <span>Level {level}</span>
          <span>{xp} XP</span>
        </div>
        <div className="xp-bar-bg">
          <motion.div
            className="xp-bar-fill"
            initial={false}
            animate={{ width: `${pct * 100}%` }}
            transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          />
        </div>
      </div>
      <button className="streak-pill" onClick={onCalendar} title="Activity calendar" style={{ border: 'none', cursor: 'pointer' }}>
        🔥 {streak}
      </button>
      <button className="icon-btn" onClick={onBadges} title="Badges">
        🏅
      </button>
      <button className="icon-btn" onClick={onReview} title="Review">
        📋
      </button>
      <button className="icon-btn" onClick={onSettings} title="Settings">
        ⚙️
      </button>
    </div>
  )
}
