import { useState } from 'react'
import { motion } from 'framer-motion'
import { playCorrect, playWrong } from '../utils/sfx'

export default function QuizRound({ questions, onAnswer, onDone }) {
  const [qIndex, setQIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [wrongOnce, setWrongOnce] = useState(false)
  const [correctFirstTry, setCorrectFirstTry] = useState(0)

  const q = questions[qIndex]

  function choose(opt) {
    if (selected) return
    const isCorrect = opt === q.answer
    setSelected(opt)
    if (isCorrect) {
      playCorrect()
      if (!wrongOnce) setCorrectFirstTry((c) => c + 1)
      onAnswer(q.index, !wrongOnce)
      setTimeout(() => {
        if (qIndex + 1 >= questions.length) {
          onDone({ correctFirstTry: correctFirstTry + (wrongOnce ? 0 : 1), total: questions.length })
        } else {
          setQIndex((i) => i + 1)
          setSelected(null)
          setWrongOnce(false)
        }
      }, 650)
    } else {
      playWrong()
      setWrongOnce(true)
      setTimeout(() => setSelected(null), 550)
    }
  }

  if (!q) return null

  return (
    <div className="session-shell">
      <div className="session-progress-bg">
        <div className="session-progress-fill" style={{ width: `${(qIndex / questions.length) * 100}%` }} />
      </div>
      <motion.div
        key={qIndex}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}
      >
        <div className="quiz-prompt">
          <div className="sub">{q.subLabel ?? (q.promptIsArabic ? 'What does this mean?' : 'Which word means this?')}</div>
          <div className={q.promptIsArabic ? 'word arabic' : 'word'}>{q.prompt}</div>
          {q.promptDetail && (
            <div className="quiz-prompt-detail">
              <span className="arabic">{q.promptDetail.pronoun}</span>
              <span className="detail-sep">—</span>
              <span>{q.promptDetail.infinitive}</span>
            </div>
          )}
        </div>
        <div className="options-grid">
          {q.options.map((opt, i) => {
            const isArabicOption = !q.promptIsArabic
            let cls = 'option-btn'
            if (selected) {
              if (opt === q.answer) cls += ' correct'
              else if (opt === selected) cls += ' wrong'
            }
            return (
              <motion.button
                key={opt + i}
                className={cls + (isArabicOption ? ' arabic' : '')}
                onClick={() => choose(opt)}
                disabled={!!selected}
                whileTap={{ scale: 0.96 }}
              >
                {opt}
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
