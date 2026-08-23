import { useEffect } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'

export default function SessionSummary({ accuracy, xpEarned, onContinue }) {
  useEffect(() => {
    if (accuracy >= 0.7) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ['#3ddc97', '#ffc94d', '#b18cff', '#5fb3ff'] })
    }
  }, [accuracy])

  const great = accuracy >= 0.85
  const good = accuracy >= 0.6

  return (
    <motion.div
      className="summary-shell"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 14 }}
    >
      <div className="big-emoji">{great ? '🏆' : good ? '🎉' : '💪'}</div>
      <h2 className="heading" style={{ margin: 0 }}>
        {great ? 'Excellent!' : good ? 'Nice work!' : 'Keep practicing!'}
      </h2>
      <div className="summary-stats">
        <div className="stat-chip">
          <div className="num">{Math.round(accuracy * 100)}%</div>
          <div className="lbl">Accuracy</div>
        </div>
        <div className="stat-chip">
          <div className="num">+{xpEarned}</div>
          <div className="lbl">XP earned</div>
        </div>
      </div>
      <button className="btn gold" onClick={onContinue}>
        Continue
      </button>
    </motion.div>
  )
}
