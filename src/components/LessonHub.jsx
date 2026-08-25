import { motion } from 'framer-motion'
import { lessons } from '../data/lessons'
import { useGameStore } from '../store/useGameStore'
import { playClick } from '../utils/sfx'

const CATEGORY_META = {
  vocabulary: { emoji: '📚', label: 'Vocabulary', desc: 'Words, plurals, synonyms & antonyms' },
  verbs: { emoji: '🌀', label: 'Verbs', desc: 'Past, present, imperative & more' },
  conjugation: { emoji: '🔁', label: 'Verb Conjugation', desc: 'أنا/أنتَ/أنتِ/هو/هي/نحن — present & past' },
  expressions: { emoji: '💬', label: 'Expressions', desc: 'Everyday phrases' },
}

export default function LessonHub({ lessonId, onBack, onStart }) {
  const lesson = lessons.find((l) => l.id === lessonId)
  const lessonBest = useGameStore((s) => s.lessonBest)
  const completed = useGameStore((s) => s.completedCategories)

  return (
    <div>
      <button className="icon-btn" onClick={onBack} style={{ marginBottom: 18 }}>
        ←
      </button>
      <div className="hub-header">
        <div className="node-circle" style={{ background: 'linear-gradient(150deg, var(--purple), var(--blue))' }}>
          {lesson.id}
        </div>
        <div className="titles">
          <div className="en heading">Lesson {lesson.id}: {lesson.titleEn}</div>
          <div className="ar arabic">{lesson.titleAr}</div>
        </div>
      </div>

      <div className="category-grid">
        {Object.entries(CATEGORY_META).map(([key, meta]) => {
          const items = lesson[key]
          const disabled = items.length === 0
          const best = lessonBest[`${lesson.id}:${key}`] || 0
          const done = !!completed[`${lesson.id}:${key}`]
          return (
            <motion.div
              key={key}
              className={`category-card ${disabled ? 'disabled' : ''}`}
              whileTap={disabled ? {} : { scale: 0.97 }}
              onClick={() => {
                if (!disabled) {
                  playClick()
                  onStart(lessonId, key)
                }
              }}
            >
              {done && <div className="done-badge">✅</div>}
              <div className="emoji">{meta.emoji}</div>
              <h3 className="heading">{meta.label}</h3>
              <div className="count">
                {items.length} items{disabled ? ' · coming soon' : ''}
                {best > 0 && <span className="best-score"> · Best {Math.round(best * 100)}%</span>}
              </div>
              {!disabled && (
                <div className="bar-bg">
                  <div className="bar-fill" style={{ width: `${best * 100}%` }} />
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
