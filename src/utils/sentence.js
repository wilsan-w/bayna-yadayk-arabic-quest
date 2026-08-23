function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function tokenize(text) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

// Builds word-bank sentence-construction questions from items shaped like
// { phrase | word, meaning }. Only items where at least one side has more
// than one word are eligible (single words don't make a sentence).
export function buildSentenceQuestions(items, direction, count) {
  const pool = items
    .map((item, index) => ({
      item,
      index,
      source: (item.phrase || item.word || '').trim(),
      target: (item.meaning || '').trim(),
    }))
    .filter((p) => p.source && p.target && (tokenize(p.source).length > 1 || tokenize(p.target).length > 1))

  if (pool.length === 0) return []

  const n = count === 'all' || count == null ? pool.length : Math.min(count, pool.length)
  const chosen = shuffle(pool).slice(0, n)

  return chosen.map((q) => {
    const dir = direction === 'mixed' ? (Math.random() < 0.5 ? 'source-target' : 'target-source') : direction
    const promptIsArabic = dir === 'source-target'
    const prompt = promptIsArabic ? q.source : q.target
    const answerText = promptIsArabic ? q.target : q.source
    const answerIsArabic = !promptIsArabic

    const correctTokens = tokenize(answerText)

    const distractorPool = pool
      .filter((p) => p.index !== q.index)
      .flatMap((p) => tokenize(promptIsArabic ? p.target : p.source))
      .filter((t) => !correctTokens.includes(t))
    const uniqueDistractors = [...new Set(distractorPool)]
    const distractorCount = Math.min(4, uniqueDistractors.length)
    const distractors = shuffle(uniqueDistractors).slice(0, distractorCount)

    const bankTokens = shuffle(correctTokens.map((t, i) => ({ id: `c${i}`, text: t })).concat(
      distractors.map((t, i) => ({ id: `d${i}`, text: t }))
    ))

    return {
      item: q.item,
      index: q.index,
      prompt,
      promptIsArabic,
      answerIsArabic,
      correctTokens,
      bankTokens,
    }
  })
}
