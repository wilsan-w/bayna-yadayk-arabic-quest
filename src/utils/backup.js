import { useGameStore } from '../store/useGameStore'
import { useSettingsStore } from '../store/useSettingsStore'

const FORMAT_VERSION = 1

export function exportCode() {
  const game = useGameStore.getState()
  const settings = useSettingsStore.getState()
  const payload = {
    v: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    game: {
      xp: game.xp,
      streak: game.streak,
      bestStreak: game.bestStreak,
      lastActiveDate: game.lastActiveDate,
      dailyXp: game.dailyXp,
      mastery: game.mastery,
      lessonBest: game.lessonBest,
      completedCategories: game.completedCategories,
      sessionHistory: game.sessionHistory,
    },
    settings: {
      quizDirection: settings.quizDirection,
      quizLength: settings.quizLength,
      matchEnabled: settings.matchEnabled,
      matchPairs: settings.matchPairs,
      sentenceEnabled: settings.sentenceEnabled,
      sentenceLength: settings.sentenceLength,
      soundEnabled: settings.soundEnabled,
    },
  }
  return btoa(JSON.stringify(payload))
}

// Returns the exportedAt timestamp on success; throws with a friendly message on failure.
export function importCode(code) {
  let payload
  try {
    payload = JSON.parse(atob(code.trim()))
  } catch {
    throw new Error('That code looks invalid or corrupted — double-check you copied the whole thing.')
  }
  if (!payload || typeof payload !== 'object' || !payload.game) {
    throw new Error('That code looks invalid or corrupted — double-check you copied the whole thing.')
  }
  const g = payload.game
  useGameStore.setState({
    xp: typeof g.xp === 'number' ? g.xp : 0,
    streak: typeof g.streak === 'number' ? g.streak : 0,
    bestStreak: typeof g.bestStreak === 'number' ? g.bestStreak : 0,
    lastActiveDate: g.lastActiveDate ?? null,
    dailyXp: g.dailyXp && typeof g.dailyXp === 'object' ? g.dailyXp : {},
    mastery: g.mastery && typeof g.mastery === 'object' ? g.mastery : {},
    lessonBest: g.lessonBest && typeof g.lessonBest === 'object' ? g.lessonBest : {},
    completedCategories:
      g.completedCategories && typeof g.completedCategories === 'object' ? g.completedCategories : {},
    sessionHistory: Array.isArray(g.sessionHistory) ? g.sessionHistory : [],
  })
  if (payload.settings && typeof payload.settings === 'object') {
    useSettingsStore.setState(payload.settings)
  }
  return payload.exportedAt || null
}
