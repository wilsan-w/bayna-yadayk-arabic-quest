import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/useGameStore'
import { buildMonthGrid, intensityTier, longestStreakFrom, MONTH_LABELS, WEEKDAY_LABELS, keyFor } from '../utils/calendar'
import { playClick } from '../utils/sfx'

export default function CalendarPage({ onBack }) {
  const dailyXp = useGameStore((s) => s.dailyXp)
  const streak = useGameStore((s) => s.streak)

  const today = new Date()
  const todayKey = keyFor(today.getFullYear(), today.getMonth(), today.getDate())

  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [selected, setSelected] = useState(todayKey)

  const grid = useMemo(() => buildMonthGrid(cursor.year, cursor.month), [cursor])
  const longest = useMemo(() => longestStreakFrom(dailyXp), [dailyXp])

  const monthTotal = useMemo(
    () =>
      grid
        .filter((c) => c.inMonth)
        .reduce((sum, c) => sum + (dailyXp[c.key] || 0), 0),
    [grid, dailyXp]
  )
  const activeDaysThisMonth = useMemo(
    () => grid.filter((c) => c.inMonth && dailyXp[c.key] > 0).length,
    [grid, dailyXp]
  )

  function shiftMonth(delta) {
    playClick()
    setCursor((c) => {
      let month = c.month + delta
      let year = c.year
      if (month < 0) { month = 11; year -= 1 }
      if (month > 11) { month = 0; year += 1 }
      return { year, month }
    })
  }

  const selectedXp = dailyXp[selected] || 0
  const selectedDate = new Date(selected + 'T00:00:00')

  return (
    <div>
      <button className="icon-btn" onClick={onBack} style={{ marginBottom: 18 }}>
        ←
      </button>
      <div className="map-header" style={{ textAlign: 'left', marginBottom: 18 }}>
        <h1 className="heading" style={{ fontSize: 24 }}>
          Activity Calendar
        </h1>
        <p>Every day you've earned XP, at a glance</p>
      </div>

      <div className="summary-stats" style={{ marginBottom: 22 }}>
        <div className="stat-chip">
          <div className="num">🔥 {streak}</div>
          <div className="lbl">Current streak</div>
        </div>
        <div className="stat-chip">
          <div className="num">{longest}</div>
          <div className="lbl">Longest streak</div>
        </div>
        <div className="stat-chip">
          <div className="num">{activeDaysThisMonth}</div>
          <div className="lbl">Active days this month</div>
        </div>
        <div className="stat-chip">
          <div className="num">{monthTotal}</div>
          <div className="lbl">XP this month</div>
        </div>
      </div>

      <div className="cal-nav">
        <button className="icon-btn" onClick={() => shiftMonth(-1)}>
          ‹
        </button>
        <div className="cal-title heading">
          {MONTH_LABELS[cursor.month]} {cursor.year}
        </div>
        <button className="icon-btn" onClick={() => shiftMonth(1)}>
          ›
        </button>
      </div>

      <div className="cal-weekdays">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="cal-weekday">
            {w}
          </div>
        ))}
      </div>

      <div className="cal-grid">
        {grid.map((cell) => {
          const xp = dailyXp[cell.key] || 0
          const tier = intensityTier(xp)
          const isToday = cell.key === todayKey
          const isSelected = cell.key === selected
          return (
            <motion.button
              key={cell.key}
              className={`cal-cell tier-${tier} ${cell.inMonth ? '' : 'dim'} ${isToday ? 'today' : ''} ${
                isSelected ? 'selected' : ''
              }`}
              onClick={() => {
                playClick()
                setSelected(cell.key)
              }}
              whileTap={{ scale: 0.93 }}
            >
              <span className="cal-daynum">{cell.day}</span>
              {xp > 0 && <span className="cal-xp">+{xp}</span>}
            </motion.button>
          )
        })}
      </div>

      <motion.div
        key={selected}
        className="cal-detail"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="cal-detail-date">
          {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
        {selectedXp > 0 ? (
          <div className="cal-detail-xp">+{selectedXp} XP earned</div>
        ) : (
          <div className="cal-detail-empty">No activity that day</div>
        )}
      </motion.div>
    </div>
  )
}
