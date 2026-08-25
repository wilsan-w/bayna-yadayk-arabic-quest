import { useMemo, useState } from 'react'
import { lessons } from '../data/lessons'
import { useGameStore } from '../store/useGameStore'
import { playClick } from '../utils/sfx'

const TABS = [
  { key: 'vocabulary', label: '📚 Vocabulary', noun: 'vocabulary' },
  { key: 'verbs', label: '🌀 Verbs', noun: 'verbs' },
  { key: 'conjugation', label: '🔁 Conjugation', noun: 'conjugations' },
  { key: 'expressions', label: '💬 Expressions', noun: 'expressions' },
]

const CATEGORY_LABELS = {
  vocabulary: '📚 Vocabulary',
  verbs: '🌀 Verbs',
  conjugation: '🔁 Conjugation',
  expressions: '💬 Expressions',
}

function formatWhen(ts) {
  const d = new Date(ts)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  if (sameDay) return `Today, ${time}`
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`
  return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${time}`
}

function lessonLabelFor(entry) {
  if (entry.scope === 'review') {
    const ids = entry.lessonIds || []
    if (ids.length === 1) return `Review · Lesson ${ids[0]}`
    if (ids.length > 1) return `Review · Lessons ${ids[0]}–${ids[ids.length - 1]}`
    return 'Review'
  }
  const lesson = lessons.find((l) => l.id === entry.lessonId)
  return `Lesson ${entry.lessonId}${lesson ? ` · ${lesson.titleEn}` : ''}`
}

function textOf(item) {
  return item.word || item.phrase || item.past
}

export function collectReviewedEntries(category, mastery) {
  const entries = []
  lessons.forEach((lesson) => {
    lesson[category].forEach((item, index) => {
      const key = `${lesson.id}:${category}:${index}`
      const m = mastery[key]
      if (m) entries.push({ lessonId: lesson.id, lessonTitle: lesson.titleEn, index, item, mastery: m })
    })
  })
  return entries
}

export default function ReviewPage({ onBack, onTest }) {
  const [tab, setTab] = useState('vocabulary')
  const mastery = useGameStore((s) => s.mastery)
  const sessionHistory = useGameStore((s) => s.sessionHistory)

  const entries = useMemo(
    () => (tab === 'history' ? [] : collectReviewedEntries(tab, mastery)),
    [tab, mastery]
  )
  const byLesson = useMemo(() => {
    const groups = new Map()
    entries.forEach((e) => {
      if (!groups.has(e.lessonId)) groups.set(e.lessonId, { title: e.lessonTitle, items: [] })
      groups.get(e.lessonId).items.push(e)
    })
    return [...groups.entries()].sort((a, b) => a[0] - b[0])
  }, [entries])

  return (
    <div>
      <button className="icon-btn" onClick={onBack} style={{ marginBottom: 18 }}>
        ←
      </button>
      <div className="map-header" style={{ textAlign: 'left', marginBottom: 18 }}>
        <h1 className="heading" style={{ fontSize: 24 }}>
          Review
        </h1>
        <p>Everything you've studied so far</p>
      </div>

      <div className="review-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`review-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => {
              playClick()
              setTab(t.key)
            }}
          >
            {t.label}
          </button>
        ))}
        <button
          className={`review-tab ${tab === 'history' ? 'active' : ''}`}
          onClick={() => {
            playClick()
            setTab('history')
          }}
        >
          📜 History
        </button>
      </div>

      {tab === 'history' ? (
        sessionHistory.length === 0 ? (
          <div className="review-empty">
            No sessions yet — finish a quiz in a lesson and it'll show up here with your score.
          </div>
        ) : (
          <div className="history-list">
            {sessionHistory.map((h) => (
              <div className="history-item" key={h.id}>
                <div className="history-main">
                  <div className="history-lesson">{lessonLabelFor(h)}</div>
                  <div className="history-category">{CATEGORY_LABELS[h.category] || h.category}</div>
                </div>
                <div className="history-stats">
                  <span className={`history-score ${h.accuracy >= 0.85 ? 'great' : h.accuracy >= 0.6 ? 'good' : 'low'}`}>
                    {Math.round(h.accuracy * 100)}%
                  </span>
                  <span className="history-xp">+{h.xp} XP</span>
                  <span className="history-when">{formatWhen(h.ts)}</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : entries.length === 0 ? (
        <div className="review-empty">
          You haven't studied any {TABS.find((t) => t.key === tab).noun} yet — take a quiz in a lesson first, then
          it'll show up here.
        </div>
      ) : (
        <>
          <div className="btn-row" style={{ marginBottom: 20 }}>
            <button className="btn gold" onClick={() => onTest(tab, entries)}>
              Test all {entries.length} reviewed →
            </button>
          </div>
          {byLesson.map(([lessonId, group]) => (
            <div className="review-lesson-group" key={lessonId}>
              <h3>
                Lesson {lessonId} · {group.title}
              </h3>
              <div className="review-list">
                {group.items.map((e) => (
                  <div className="review-item" key={e.index}>
                    <div className="ar arabic">{textOf(e.item)}</div>
                    <div className="en">{e.item.meaning}</div>
                    <div className="mastery-dots">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className={i < e.mastery.level ? 'filled' : ''} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
