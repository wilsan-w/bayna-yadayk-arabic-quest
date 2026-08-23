import { useState } from 'react'
import { motion } from 'framer-motion'
import { playCorrect, playWrong } from '../utils/sfx'

export default function SentenceBuild({ questions, onAnswer, onDone }) {
  const [qIndex, setQIndex] = useState(0)
  const [bank, setBank] = useState(() => questions[0]?.bankTokens || [])
  const [answer, setAnswer] = useState([])
  const [result, setResult] = useState(null) // null | 'correct' | 'wrong'
  const [wrongOnce, setWrongOnce] = useState(false)
  const [correctFirstTry, setCorrectFirstTry] = useState(0)

  const q = questions[qIndex]
  if (!q) return null

  function moveToAnswer(token) {
    if (result === 'correct') return
    setBank((b) => b.filter((t) => t.id !== token.id))
    setAnswer((a) => [...a, token])
  }

  function moveToBank(token) {
    if (result === 'correct') return
    setAnswer((a) => a.filter((t) => t.id !== token.id))
    setBank((b) => [...b, token])
  }

  function check() {
    if (answer.length === 0) return
    const given = answer.map((t) => t.text)
    const isCorrect = given.length === q.correctTokens.length && given.every((w, i) => w === q.correctTokens[i])

    if (isCorrect) {
      playCorrect()
      setResult('correct')
      if (!wrongOnce) setCorrectFirstTry((c) => c + 1)
      onAnswer(q.index, !wrongOnce)
      setTimeout(() => {
        if (qIndex + 1 >= questions.length) {
          onDone({ correctFirstTry: correctFirstTry + (wrongOnce ? 0 : 1), total: questions.length })
        } else {
          const next = qIndex + 1
          setQIndex(next)
          setBank(questions[next].bankTokens)
          setAnswer([])
          setResult(null)
          setWrongOnce(false)
        }
      }, 900)
    } else {
      playWrong()
      setResult('wrong')
      setWrongOnce(true)
      setTimeout(() => {
        setBank(q.bankTokens)
        setAnswer([])
        setResult(null)
      }, 1400)
    }
  }

  return (
    <div className="session-shell">
      <div className="session-progress-bg">
        <div className="session-progress-fill" style={{ width: `${(qIndex / questions.length) * 100}%` }} />
      </div>

      <div className="quiz-prompt">
        <div className="sub">Build the translation</div>
        <div className={q.promptIsArabic ? 'word arabic' : 'word'} style={{ fontSize: q.promptIsArabic ? 32 : 26 }}>
          {q.prompt}
        </div>
      </div>

      <div className="sentence-answer-row" dir={q.answerIsArabic ? 'rtl' : 'ltr'}>
        {answer.length === 0 && <span className="sentence-placeholder">Tap words below…</span>}
        {answer.map((t) => (
          <motion.button
            key={t.id}
            className={`sentence-token answer ${q.answerIsArabic ? 'arabic' : ''} ${
              result === 'correct' ? 'correct' : result === 'wrong' ? 'wrong' : ''
            }`}
            onClick={() => moveToBank(t)}
            whileTap={{ scale: 0.94 }}
          >
            {t.text}
          </motion.button>
        ))}
      </div>

      {result === 'wrong' && (
        <div className="sentence-correct-hint">
          Correct: <span className={q.answerIsArabic ? 'arabic' : ''}>{q.correctTokens.join(' ')}</span>
        </div>
      )}

      <div className="sentence-bank" dir={q.answerIsArabic ? 'rtl' : 'ltr'}>
        {bank.map((t) => (
          <motion.button
            key={t.id}
            className={`sentence-token bank ${q.answerIsArabic ? 'arabic' : ''}`}
            onClick={() => moveToAnswer(t)}
            whileTap={{ scale: 0.94 }}
            layout
          >
            {t.text}
          </motion.button>
        ))}
      </div>

      <div className="btn-row">
        <button className="btn secondary" onClick={() => { setBank(q.bankTokens); setAnswer([]) }} disabled={!!result}>
          Clear
        </button>
        <button className="btn gold" onClick={check} disabled={answer.length === 0 || !!result}>
          Check
        </button>
      </div>
    </div>
  )
}
