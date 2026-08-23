import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { playCorrect, playWrong } from '../utils/sfx'
import { shuffleArray } from '../utils/quiz'

export default function MatchGame({ pairs, onDone }) {
  const leftItems = useMemo(() => shuffleArray(pairs.map((p) => ({ id: p.id, text: p.left }))), [pairs])
  const rightItems = useMemo(() => shuffleArray(pairs.map((p) => ({ id: p.id, text: p.right }))), [pairs])

  const [selLeft, setSelLeft] = useState(null)
  const [selRight, setSelRight] = useState(null)
  const [matched, setMatched] = useState(new Set())
  const [wrongPair, setWrongPair] = useState(null)
  const [mistakes, setMistakes] = useState(0)

  function tryMatch(leftId, rightId) {
    if (leftId === rightId) {
      playCorrect()
      const next = new Set(matched)
      next.add(leftId)
      setMatched(next)
      setSelLeft(null)
      setSelRight(null)
      if (next.size === pairs.length) {
        setTimeout(() => onDone({ correctFirstTry: pairs.length - mistakes, total: pairs.length }), 500)
      }
    } else {
      playWrong()
      setMistakes((m) => m + 1)
      setWrongPair([leftId, rightId])
      setTimeout(() => {
        setWrongPair(null)
        setSelLeft(null)
        setSelRight(null)
      }, 500)
    }
  }

  function pickLeft(id) {
    if (matched.has(id) || wrongPair) return
    setSelLeft(id)
    if (selRight != null) tryMatch(id, selRight)
  }
  function pickRight(id) {
    if (matched.has(id) || wrongPair) return
    setSelRight(id)
    if (selLeft != null) tryMatch(selLeft, id)
  }

  const cls = (id, sel, isMatched) => {
    let c = 'match-item'
    if (isMatched) c += ' matched'
    else if (wrongPair && (wrongPair[0] === id || wrongPair[1] === id)) c += ' wrong-flash'
    else if (sel === id) c += ' selected'
    return c
  }

  return (
    <div className="session-shell">
      <div className="quiz-prompt">
        <div className="sub">Match the pairs</div>
      </div>
      <div className="match-grid">
        <div className="match-col">
          {leftItems.map((it) => (
            <motion.div
              key={it.id}
              className={cls(it.id, selLeft, matched.has(it.id)) + ' arabic'}
              onClick={() => pickLeft(it.id)}
              whileTap={{ scale: 0.96 }}
            >
              {it.text}
            </motion.div>
          ))}
        </div>
        <div className="match-col">
          {rightItems.map((it) => (
            <motion.div
              key={it.id}
              className={cls(it.id, selRight, matched.has(it.id))}
              onClick={() => pickRight(it.id)}
              whileTap={{ scale: 0.96 }}
            >
              {it.text}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
