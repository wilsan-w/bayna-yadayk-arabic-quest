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

  const entries = useMemo(() => collectReviewedEntries(tab, mastery), [tab, mastery])
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
      </div>

      {entries.length === 0 ? (
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
