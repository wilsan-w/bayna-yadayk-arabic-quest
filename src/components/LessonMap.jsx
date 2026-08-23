import { motion } from 'framer-motion'
import { lessons } from '../data/lessons'
import { useGameStore } from '../store/useGameStore'
import ProgressRing from './ProgressRing'
import { playClick } from '../utils/sfx'

const CATS = ['vocabulary', 'verbs', 'expressions']
const ALIGN = ['self-a', 'self-b', 'self-c', 'self-b']

export default function LessonMap({ onOpenLesson }) {
  const lessonBest = useGameStore((s) => s.lessonBest)
  const completed = useGameStore((s) => s.completedCategories)

  const activeCats = (lesson) => CATS.filter((c) => lesson[c].length > 0)

  const progressFor = (lesson) => {
    const cats = activeCats(lesson)
    if (!cats.length) return 0
    const done = cats.filter((c) => completed[`${lesson.id}:${c}`]).length
    return done / cats.length
  }

  return (
    <div>
      <div className="map-header">
        <h1 className="heading">Bayna Yadayk — Arabic Quest</h1>
        <p>Book 1 · Part 1 — tap a lesson to begin</p>
      </div>
      <div className="lesson-path">
        {lessons.map((lesson, i) => {
          const hasContent = lesson.vocabulary.length > 0
          const progress = progressFor(lesson)
          const mastered = hasContent && progress === 1
          const status = !hasContent ? 'locked' : 'available'
          return (
            <div key={lesson.id} style={{ display: 'contents' }}>
              <motion.div
                className={`lesson-node ${status} ${mastered ? 'mastered' : ''} ${ALIGN[i % ALIGN.length]}`}
                onClick={() => {
                  if (hasContent) {
                    playClick()
                    onOpenLesson(lesson.id)
                  }
                }}
                whileTap={hasContent ? { scale: 0.97 } : {}}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <div className="node-circle">{mastered ? '⭐' : hasContent ? lesson.id : '🔒'}</div>
                <div className="node-info">
                  <div className="en">
                    Lesson {lesson.id}: {lesson.titleEn}
                  </div>
                  <div className="ar arabic">{lesson.titleAr}</div>
                  {!hasContent && (
                    <div style={{ color: 'var(--text-faint)', fontSize: 12, marginTop: 2 }}>Coming soon</div>
                  )}
                </div>
                {hasContent && (
                  <div className="node-progress-ring">
                    <ProgressRing progress={progress} color={mastered ? 'var(--gold)' : 'var(--primary)'} />
                  </div>
                )}
              </motion.div>
              {i < lessons.length - 1 && <div className="connector" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
