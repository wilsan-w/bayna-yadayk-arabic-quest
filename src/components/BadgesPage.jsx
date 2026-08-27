import { useGameStore } from '../store/useGameStore'
import { badgeStatus } from '../utils/badges'

function BadgeCard({ badge }) {
  const pct = Math.min(1, badge.value / badge.threshold)
  return (
    <div className={`badge-card ${badge.unlocked ? 'unlocked' : 'locked'}`}>
      <div className="badge-emoji">{badge.unlocked ? badge.emoji : '🔒'}</div>
      <div className="badge-title">{badge.title}</div>
      <div className="badge-desc">{badge.desc}</div>
      {!badge.unlocked && (
        <div className="badge-progress-bg">
          <div className="badge-progress-fill" style={{ width: `${pct * 100}%` }} />
        </div>
      )}
    </div>
  )
}

export default function BadgesPage({ onBack }) {
  const xp = useGameStore((s) => s.xp)
  const bestStreak = useGameStore((s) => s.bestStreak)
  const badges = badgeStatus(xp, bestStreak)
  const xpBadges = badges.filter((b) => b.category === 'xp')
  const streakBadges = badges.filter((b) => b.category === 'streak')
  const unlockedCount = badges.filter((b) => b.unlocked).length

  return (
    <div>
      <button className="icon-btn" onClick={onBack} style={{ marginBottom: 18 }}>
        ←
      </button>
      <div className="map-header" style={{ textAlign: 'left', marginBottom: 18 }}>
        <h1 className="heading" style={{ fontSize: 24 }}>
          Badges
        </h1>
        <p>
          {unlockedCount} of {badges.length} unlocked
        </p>
      </div>

      <h3 className="badge-section-title">⚡ XP Badges</h3>
      <div className="badge-grid">
        {xpBadges.map((b) => (
          <BadgeCard key={b.id} badge={b} />
        ))}
      </div>

      <h3 className="badge-section-title">🔥 Streak Badges</h3>
      <div className="badge-grid">
        {streakBadges.map((b) => (
          <BadgeCard key={b.id} badge={b} />
        ))}
      </div>
    </div>
  )
}
