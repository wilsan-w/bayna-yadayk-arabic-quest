import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useSettingsStore = create(
  persist(
    (set) => ({
      quizDirection: 'mixed', // 'source-target' (Arabic -> English) | 'target-source' (English -> Arabic) | 'mixed'
      quizLength: 10, // number of questions, or 'all'
      matchEnabled: true,
      matchPairs: 6,
      sentenceEnabled: true,
      soundEnabled: true,
      setSetting: (key, value) => set({ [key]: value }),
    }),
    { name: 'by-arabic-quest-settings' }
  )
)
