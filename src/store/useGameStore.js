import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// XP required to go from level N to N+1 grows gradually.
export function levelFromXp(xp) {
  let level = 1
  let need = 100
  let remaining = xp
  while (remaining >= need) {
    remaining -= need
    level += 1
    need = Math.round(need * 1.25)
  }
  return { level, into: remaining, need }
}

// Local calendar-day key (not UTC) so activity lands on the day the user
// actually experienced it, regardless of timezone.
export function dateKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function todayKey() {
  return dateKey()
}

function dayDiff(a, b) {
  const d1 = new Date(a + 'T00:00:00')
  const d2 = new Date(b + 'T00:00:00')
  return Math.round((d2 - d1) / 86400000)
}

const itemKey = (lessonId, category, index) => `${lessonId}:${category}:${index}`

export const useGameStore = create(
  persist(
    (set, get) => ({
      xp: 0,
      streak: 0,
      lastActiveDate: null,
      dailyXp: {}, // 'YYYY-MM-DD' -> XP earned that local calendar day
      mastery: {}, // itemKey -> { seen, correct, level(0-3) }
      lessonBest: {}, // `${lessonId}:${category}` -> best accuracy 0-1
      completedCategories: {}, // `${lessonId}:${category}` -> true

      addXp(amount) {
        set((s) => {
          const today = todayKey()
          let streak = s.streak
          if (s.lastActiveDate !== today) {
            const diff = s.lastActiveDate ? dayDiff(s.lastActiveDate, today) : 1
            streak = diff === 1 ? s.streak + 1 : 1
          }
          const dailyXp = { ...s.dailyXp, [today]: (s.dailyXp[today] || 0) + amount }
          return { xp: s.xp + amount, streak, lastActiveDate: today, dailyXp }
        })
      },

      recordAnswer(lessonId, category, index, correct) {
        set((s) => {
          const key = itemKey(lessonId, category, index)
          const prev = s.mastery[key] || { seen: 0, correct: 0, level: 0 }
          const seen = prev.seen + 1
          const correctCount = prev.correct + (correct ? 1 : 0)
          let level = prev.level
          if (correct) level = Math.min(3, level + 1)
          else level = Math.max(0, level - 1)
          return {
            mastery: { ...s.mastery, [key]: { seen, correct: correctCount, level } },
          }
        })
      },

      finishSession(lessonId, category, accuracy, xpEarned) {
        set((s) => {
          const key = `${lessonId}:${category}`
          const best = Math.max(accuracy, s.lessonBest[key] || 0)
          return {
            lessonBest: { ...s.lessonBest, [key]: best },
            completedCategories: { ...s.completedCategories, [key]: true },
          }
        })
        get().addXp(xpEarned)
      },

      categoryProgress(lessonId, category) {
        const key = `${lessonId}:${category}`
        return get().lessonBest[key] || 0
      },

      isCategoryDone(lessonId, category) {
        return !!get().completedCategories[`${lessonId}:${category}`]
      },

      lessonProgress(lessonId, categories) {
        const done = categories.filter((c) => get().isCategoryDone(lessonId, c)).length
        return categories.length ? done / categories.length : 0
      },

      reset() {
        set({
          xp: 0,
          streak: 0,
          lastActiveDate: null,
          dailyXp: {},
          mastery: {},
          lessonBest: {},
          completedCategories: {},
        })
      },
    }),
    { name: 'by-arabic-quest-progress' }
  )
)
