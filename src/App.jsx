import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import TopBar from './components/TopBar'
import LessonMap from './components/LessonMap'
import LessonHub from './components/LessonHub'
import StudySession from './components/StudySession'
import SettingsPage from './components/SettingsPage'
import ReviewPage from './components/ReviewPage'
import ReviewTestSession from './components/ReviewTestSession'
import CalendarPage from './components/CalendarPage'
import BadgesPage from './components/BadgesPage'
import { useGameStore, levelFromXp } from './store/useGameStore'
import { unlockedBadgeIds } from './utils/badges'
import { playLevelUp } from './utils/sfx'

function App() {
  const [screen, setScreen] = useState('map') // map | hub | session | settings | review | reviewTest | calendar | badges
  const [lessonId, setLessonId] = useState(null)
  const [category, setCategory] = useState(null)
  const [reviewEntries, setReviewEntries] = useState(null)
  const [returnTo, setReturnTo] = useState('map')

  const xp = useGameStore((s) => s.xp)
  const bestStreak = useGameStore((s) => s.bestStreak)
  const prevLevel = useRef(levelFromXp(xp).level)
  const prevBadgeIds = useRef(new Set(unlockedBadgeIds(xp, bestStreak)))

  useEffect(() => {
    const level = levelFromXp(xp).level
    if (level > prevLevel.current) {
      playLevelUp()
      confetti({ particleCount: 160, spread: 100, origin: { y: 0.3 }, colors: ['#ffc94d', '#3ddc97', '#b18cff'] })
    }
    prevLevel.current = level
  }, [xp])

  useEffect(() => {
    const current = new Set(unlockedBadgeIds(xp, bestStreak))
    const gainedNew = [...current].some((id) => !prevBadgeIds.current.has(id))
    if (gainedNew) {
      playLevelUp()
      confetti({ particleCount: 140, spread: 90, origin: { y: 0.3 }, colors: ['#ffc94d', '#3ddc97', '#b18cff'] })
    }
    prevBadgeIds.current = current
  }, [xp, bestStreak])

  const goMap = () => {
    setScreen('map')
    setLessonId(null)
    setCategory(null)
  }

  return (
    <div className="app-shell">
      <TopBar
        onHome={goMap}
        onSettings={() => {
          setReturnTo(screen === 'settings' ? 'map' : screen)
          setScreen('settings')
        }}
        onReview={() => setScreen('review')}
        onCalendar={() => setScreen('calendar')}
        onBadges={() => setScreen('badges')}
      />
      {screen === 'map' && (
        <motion.div key="map" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <LessonMap
            onOpenLesson={(id) => {
              setLessonId(id)
              setScreen('hub')
            }}
          />
        </motion.div>
      )}
      {screen === 'hub' && (
        <motion.div key="hub" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <LessonHub
            lessonId={lessonId}
            onBack={goMap}
            onStart={(id, cat) => {
              setCategory(cat)
              setScreen('session')
            }}
          />
        </motion.div>
      )}
      {screen === 'session' && (
        <motion.div key="session" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <StudySession lessonId={lessonId} category={category} onExit={() => setScreen('hub')} />
        </motion.div>
      )}
      {screen === 'settings' && (
        <motion.div key="settings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <SettingsPage onBack={() => setScreen(returnTo)} />
        </motion.div>
      )}
      {screen === 'review' && (
        <motion.div key="review" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <ReviewPage
            onBack={goMap}
            onTest={(cat, entries) => {
              setCategory(cat)
              setReviewEntries(entries)
              setScreen('reviewTest')
            }}
          />
        </motion.div>
      )}
      {screen === 'reviewTest' && (
        <motion.div key="reviewTest" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <ReviewTestSession category={category} entries={reviewEntries} onExit={() => setScreen('review')} />
        </motion.div>
      )}
      {screen === 'calendar' && (
        <motion.div key="calendar" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <CalendarPage onBack={goMap} />
        </motion.div>
      )}
      {screen === 'badges' && (
        <motion.div key="badges" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <BadgesPage onBack={goMap} />
        </motion.div>
      )}
    </div>
  )
}

export default App
