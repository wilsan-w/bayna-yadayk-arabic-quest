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

// `order`: 'mixed' shuffles present- and past-tense questions together (default);
// 'grouped' asks every present-tense question first, then every past-tense one.
export function buildConjugationQuiz(verbs, count, order = 'mixed') {
  const presentPool = []
  const pastPool = []
  verbs.forEach((verb, index) => {
    if (!hasConjugation(verb)) return
    const { present, past } = fullParadigm(verb)
    PRONOUNS.forEach((p) => {
      if (present[p.key]) presentPool.push({ verb, index, pronoun: p, tense: 'present', form: present[p.key], paradigm: present })
      if (past[p.key]) pastPool.push({ verb, index, pronoun: p, tense: 'past', form: past[p.key], paradigm: past })
    })
  })
  const pool = [...presentPool, ...pastPool]

  let chosen
  if (order === 'grouped') {
    const total = count === 'all' || count == null ? pool.length : Math.min(count, pool.length)
    // Split the requested count across the two tenses proportionally to how
    // much of each is available, so a short round still covers both.
    const presentN =
      count === 'all' || count == null ? presentPool.length : Math.round(total * (presentPool.length / pool.length))
    const pastN = total - presentN
    chosen = [...shuffleArray(presentPool).slice(0, presentN), ...shuffleArray(pastPool).slice(0, pastN)]
  } else {
    const n = count === 'all' || count == null ? pool.length : Math.min(count, pool.length)
    chosen = shuffleArray(pool).slice(0, n)
  }

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
      promptDetail: { pronoun: q.pronoun.label, baseForm: q.verb.past || q.verb.masdar || q.verb.meaning, meaning: q.verb.meaning },
      answer: q.form,
      options,
    }
  })
}

const ENGLISH_SUBJECT = { ana: 'I', anta: 'you', anti: 'you', huwa: 'he', hiya: 'she', nahnu: 'we' }

// Verb meanings are stored as "to X" and sometimes carry a second sense or a
// parenthetical ("to act / do", "to grant (lease)") — only the first sense
// is usable as a plain subject + verb phrase.
function englishBaseForm(meaning) {
  return meaning.replace(/^to /, '').split(/[/(]/)[0].trim()
}

function toThirdPersonVerb(word) {
  if (word === 'be') return 'is'
  if (word === 'have') return 'has'
  if (/[sxz]$|[cs]h$/.test(word)) return word + 'es'
  if (/[^aeiou]o$/.test(word)) return word + 'es'
  if (/[^aeiou]y$/.test(word)) return word.slice(0, -1) + 'ies'
  return word + 's'
}

function englishPhrase(pronounKey, meaning) {
  const base = englishBaseForm(meaning)
  const subject = ENGLISH_SUBJECT[pronounKey]
  if (pronounKey !== 'huwa' && pronounKey !== 'hiya') return `${subject} ${base}`
  const words = base.split(' ')
  words[0] = toThirdPersonVerb(words[0])
  return `${subject} ${words.join(' ')}`
}

// Short "pronoun + present-tense verb" phrases generated straight from a
// lesson's conjugation data — e.g. "أَنَا أَذْهَبُ" / "I go". Deliberately
// minimal (no objects/particles) so sentence-building for verb conjugation
// drills recognizing pronoun + verb-form pairing, distinct from the
// hand-written vocab sentences and verb phrases.
export function buildConjugationPhrasePool(verbs) {
  const pool = []
  verbs.forEach((verb) => {
    if (!hasConjugation(verb)) return
    const { present } = fullParadigm(verb)
    PRONOUNS.forEach((p) => {
      const form = present[p.key]
      if (!form) return
      pool.push({ phrase: `${p.label} ${form}`, meaning: englishPhrase(p.key, verb.meaning), _authored: true })
    })
  })
  return pool
}
