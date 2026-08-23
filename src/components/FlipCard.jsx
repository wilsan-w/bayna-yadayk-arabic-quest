import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { playFlip } from '../utils/sfx'

export default function FlipCard({ cardKey, front, back }) {
  const [flipped, setFlipped] = useState(false)

  useEffect(() => setFlipped(false), [cardKey])

  return (
    <div
      className="flip-card"
      onClick={() => {
        playFlip()
        setFlipped((f) => !f)
      }}
    >
      <motion.div
        className="flip-card-inner"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.45, ease: [0.4, 0.2, 0.2, 1] }}
      >
        <div className="flip-face front">
          {front}
          <span className="hint">Tap to flip</span>
        </div>
        <div className="flip-face back">{back}</div>
      </motion.div>
    </div>
  )
}
