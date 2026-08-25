import { shuffleArray } from './quiz'

// Pronoun order matches how the paradigm table and quiz both present forms.
export const PRONOUNS = [
  { key: 'ana', label: 'أَنَا', labelEn: 'I' },
  { key: 'anta', label: 'أَنْتَ', labelEn: 'you (m.)' },
  { key: 'anti', label: 'أَنْتِ', labelEn: 'you (f.)' },
  { key: 'huwa', label: 'هُوَ', labelEn: 'he' },
  { key: 'hiya', label: 'هِيَ', labelEn: 'she' },
  { key: 'nahnu', label: 'نَحْنُ', labelEn: 'we' },
]

// A verb's `past`/`present` fields are always the huwa (he) form; the other
// five pronouns live in verb.conj.{past,present}. This merges them into one
// full six-pronoun paradigm per tense.
export function fullParadigm(verb) {
  return {
    past: { huwa: verb.past, ...verb.conj?.past },
    present: { huwa: verb.present, ...verb.conj?.present },
  }
}

export function hasConjugation(verb) {
  return !!(verb.conj?.past && verb.conj?.present)
}

export function buildConjugationQuiz(verbs, count) {
  const pool = []
  verbs.forEach((verb, index) => {
    if (!hasConjugation(verb)) return
    const { present, past } = fullParadigm(verb)
    PRONOUNS.forEach((p) => {
      if (present[p.key]) pool.push({ verb, index, pronoun: p, tense: 'present', form: present[p.key], paradigm: present })
      if (past[p.key]) pool.push({ verb, index, pronoun: p, tense: 'past', form: past[p.key], paradigm: past })
    })
  })

  const n = count === 'all' || count == null ? pool.length : Math.min(count, pool.length)
  const chosen = shuffleArray(pool).slice(0, n)

  return chosen.map((q) => {
    const tenseLabel = q.tense === 'past' ? 'Past Tense' : 'Present Tense'

    // Some pronoun pairs (e.g. أنتَ/هي) legitimately share the same surface
    // form for many verbs — dedupe by text so no two options ever look
    // identical, padding from other verbs' forms at the same pronoun/tense
    // if this verb alone doesn't yield enough distinct distractors.
    const seen = new Set([q.form])
    const sameVerbPool = PRONOUNS.filter((p) => p.key !== q.pronoun.key).map((p) => q.paradigm[p.key])
    const otherVerbPool = pool.filter((p) => p.pronoun.key === q.pronoun.key && p.tense === q.tense && p.index !== q.index).map((p) => p.form)

    const distractors = []
    for (const form of shuffleArray(sameVerbPool)) {
      if (distractors.length >= 3) break
      if (form && !seen.has(form)) {
        seen.add(form)
        distractors.push(form)
      }
    }
    for (const form of shuffleArray(otherVerbPool)) {
      if (distractors.length >= 3) break
      if (form && !seen.has(form)) {
        seen.add(form)
        distractors.push(form)
      }
    }

    const options = shuffleArray([q.form, ...distractors])
    return {
      item: q.verb,
      index: q.index,
      subLabel: 'Conjugate',
      prompt: tenseLabel,
      promptIsArabic: false,
      promptDetail: { pronoun: q.pronoun.label, infinitive: q.verb.masdar || q.verb.meaning, meaning: q.verb.meaning },
      answer: q.form,
      options,
    }
  })
}
