function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function shuffleArray(arr) {
  return shuffle(arr)
}

// Builds multiple-choice questions from a list of items.
// getSource/getTarget extract the "Arabic side" and "meaning side" text.
// direction: 'source-target' (Arabic prompt) | 'target-source' (meaning prompt) | 'mixed' (random per question)
export function buildQuiz(items, getSource, getTarget, count, direction = 'source-target') {
  const pool = items
    .map((item, index) => ({ item, index, source: getSource(item), target: getTarget(item) }))
    .filter((p) => p.source && p.target)
  const n = count === 'all' || count == null ? pool.length : Math.min(count, pool.length)
  const chosen = shuffle(pool).slice(0, n)

  return chosen.map((q) => {
    const dir = direction === 'mixed' ? (Math.random() < 0.5 ? 'source-target' : 'target-source') : direction
    const promptIsArabic = dir === 'source-target'
    const prompt = promptIsArabic ? q.source : q.target
    const answer = promptIsArabic ? q.target : q.source

    const distractorPool = pool.filter((p) => p.index !== q.index)
    const distractors = shuffle(distractorPool)
      .slice(0, 3)
      .map((p) => (promptIsArabic ? p.target : p.source))
    const options = shuffle([answer, ...distractors])

    return { item: q.item, index: q.index, prompt, answer, options, promptIsArabic }
  })
}
