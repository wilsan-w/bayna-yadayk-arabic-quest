export default function ProgressRing({ progress = 0, size = 40, stroke = 5, color = 'var(--primary)' }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - progress)
  return (
    <svg width={size} height={size} className="progress-ring-svg">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.12)" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  )
}
