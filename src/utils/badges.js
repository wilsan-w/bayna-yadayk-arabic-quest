// Badge definitions. XP badges unlock permanently once total XP crosses the
// threshold; streak badges unlock off the best streak ever reached (not the
// current streak), so they stay earned even after a streak breaks.

export const XP_BADGES = [
  { id: 'xp-100', threshold: 100, emoji: '🌱', title: 'First Steps', desc: 'Earn 100 XP' },
  { id: 'xp-500', threshold: 500, emoji: '📖', title: 'Getting Started', desc: 'Earn 500 XP' },
  { id: 'xp-1000', threshold: 1000, emoji: '📚', title: 'Dedicated Learner', desc: 'Earn 1,000 XP' },
  { id: 'xp-2500', threshold: 2500, emoji: '⭐', title: 'Rising Scholar', desc: 'Earn 2,500 XP' },
  { id: 'xp-5000', threshold: 5000, emoji: '🌟', title: 'Arabic Enthusiast', desc: 'Earn 5,000 XP' },
  { id: 'xp-10000', threshold: 10000, emoji: '🏆', title: 'Master Student', desc: 'Earn 10,000 XP' },
  { id: 'xp-20000', threshold: 20000, emoji: '👑', title: 'Arabic Sage', desc: 'Earn 20,000 XP' },
]

export const STREAK_BADGES = [
  { id: 'streak-3', threshold: 3, emoji: '🔥', title: 'Warming Up', desc: '3-day streak' },
  { id: 'streak-7', threshold: 7, emoji: '🔥', title: 'One Week Strong', desc: '7-day streak' },
  { id: 'streak-14', threshold: 14, emoji: '🔥', title: 'Two Weeks Strong', desc: '14-day streak' },
  { id: 'streak-30', threshold: 30, emoji: '🔥', title: 'One Month Streak', desc: '30-day streak' },
  { id: 'streak-60', threshold: 60, emoji: '🔥', title: 'Two Month Streak', desc: '60-day streak' },
  { id: 'streak-100', threshold: 100, emoji: '🔥', title: 'Century Streak', desc: '100-day streak' },
]

// Returns every badge with its unlocked state and the value it's judged
// against, ready to render — XP badges first, then streak badges.
export function badgeStatus(xp, bestStreak) {
  const xpBadges = XP_BADGES.map((b) => ({ ...b, category: 'xp', value: xp, unlocked: xp >= b.threshold }))
  const streakBadges = STREAK_BADGES.map((b) => ({
    ...b,
    category: 'streak',
    value: bestStreak,
    unlocked: bestStreak >= b.threshold,
  }))
  return [...xpBadges, ...streakBadges]
}

export function unlockedBadgeIds(xp, bestStreak) {
  return badgeStatus(xp, bestStreak)
    .filter((b) => b.unlocked)
    .map((b) => b.id)
}
