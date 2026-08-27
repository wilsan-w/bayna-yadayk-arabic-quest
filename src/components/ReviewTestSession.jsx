import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/useGameStore'
import { useSettingsStore } from '../store/useSettingsStore'
import QuizRound from './QuizRound'
import SentenceBuild from './SentenceBuild'
import MatchGame from './MatchGame'
import SessionSummary from './SessionSummary'
import { lessons } from '../data/lessons'
import { buildQuiz, shuffleArray } from '../utils/quiz'
import { buildSentenceQuestions } from '../utils/sentence'
import { buildConjugationQuiz, buildConjugationPhrasePool } from '../utils/conjugation'
import { playClick } from '../utils/sfx'

function textOf(item) {
  return item.word || item.phrase || item.past
}

export default function ReviewTestSession({ category, entries, onExit }) {
  const recordAnswer = useGameStore((s) => s.recordAnswer)
  const addXp = useGameStore((s) => s.addXp)
  const logSession = useGameStore((s) => s.logSession)
  const settings = useSettingsStore()

  const [phase, setPhase] = useState(category === 'conjugation' ? 'conjugationOrder' : 'quiz')
  const [quizResult, setQuizResult] = useState(null)
  const [sentenceResult, setSentenceResult] = useState(null)
  const [matchResult, setMatchResult] = useState(null)
  const [finalXp, setFinalXp] = useState(0)
  const [conjugationOrder, setConjugationOrder] = useState('mixed') // 'mixed' | 'grouped'

  const items = useMemo(() => entries.map((e) => e.item), [entries])
  const hasMatch = category !== 'verbs' && category !== 'conjugation' && items.length >= 4 && settings.matchEnabled

  const quiz = useMemo(() => {
    const count = settings.quizLength === 'all' ? items.length : settings.quizLength
    if (category === 'conjugation') {
      return buildConjugationQuiz(items, count, conjugationOrder)
    }
    const getSource = category === 'verbs' ? (it) => it.past : (it) => it.word || it.phrase
    return buildQuiz(items, getSource, (it) => it.meaning, count, settings.quizDirection)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, category, settings.quizLength, settings.quizDirection, conjugationOrder])

  // Same per-category split as StudySession: vocab/expressions use the
  // descriptive authored sentences, verbs get the short everyday phrases,
  // and conjugation gets phrases generated from the reviewed verbs' own
  // paradigm data.
  const sentencePool = useMemo(() => {
    if (category === 'conjugation') return buildConjugationPhrasePool(items)
    const lessonIds = [...new Set(entries.map((e) => e.lessonId))]
    if (category === 'verbs') {
      return lessonIds.flatMap((id) => {
        const lesson = lessons.find((l) => l.id === id)
        return (lesson?.verbPhrases || []).map((s) => ({ phrase: s.ar, meaning: s.en, _authored: true }))
      })
    }
    const authored = lessonIds.flatMap((id) => {
      const lesson = lessons.find((l) => l.id === id)
      return (lesson?.sentences || []).map((s) => ({ phrase: s.ar, meaning: s.en, _authored: true }))
    })
    return category === 'expressions' ? [...items, ...authored] : authored
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, items, category])

  const sentenceQuestions = useMemo(() => {
    if (!settings.sentenceEnabled || sentencePool.length === 0) return []
    return buildSentenceQuestions(sentencePool, settings.quizDirection, settings.sentenceLength)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentencePool, settings.sentenceEnabled, settings.quizDirection, settings.sentenceLength])
  const hasSentence = sentenceQuestions.length > 0

  function handleSentenceAnswer(poolIndex, correct) {
    const entry = sentencePool[poolIndex]
    if (entry && !entry._authored) {
      const orig = entries[poolIndex]
      if (orig) recordAnswer(orig.lessonId, category, orig.index, correct)
    }
  }

  const matchPairs = useMemo(() => {
    if (!hasMatch) return []
    const shuffled = shuffleArray(entries).slice(0, Math.min(settings.matchPairs, entries.length))
    return shuffled.map((e, i) => ({ id: i, left: textOf(e.item), right: e.item.meaning }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, hasMatch, settings.matchPairs])

  function chooseConjugationOrder(order) {
    playClick()
    setConjugationOrder(order)
    setPhase('quiz')
  }

  function handleQuizAnswer(index, correct) {
    const entry = entries[index]
    if (entry) recordAnswer(entry.lessonId, category, entry.index, correct)
  }

  function handleQuizDone(result) {
    setQuizResult(result)
    if (hasSentence) setPhase('sentence')
    else if (hasMatch) setPhase('match')
    else finishAll(result, null, null)
  }

  function handleSentenceDone(result) {
    setSentenceResult(result)
    if (hasMatch) setPhase('match')
    else finishAll(quizResult, result, null)
  }

  function handleMatchDone(result) {
    setMatchResult(result)
    finishAll(quizResult, sentenceResult, result)
  }

  function finishAll(qResult, sResult, mResult) {
    const totalCorrect = (qResult?.correctFirstTry || 0) + (sResult?.correctFirstTry || 0) + (mResult?.correctFirstTry || 0)
    const totalQ = (qResult?.total || 0) + (sResult?.total || 0) + (mResult?.total || 0)
    const accuracy = totalQ ? totalCorrect / totalQ : 1
    const xp =
      (qResult?.correctFirstTry || 0) * 8 + (sResult?.correctFirstTry || 0) * 10 + (mResult?.correctFirstTry || 0) * 6
    setFinalXp(xp)
    const lessonIds = [...new Set(entries.map((e) => e.lessonId))].sort((a, b) => a - b)
    logSession({ scope: 'review', lessonIds, category, accuracy, xp })
    addXp(xp)
    setPhase('summary')
  }

  if (phase === 'conjugationOrder') {
    return (
      <div className="session-shell">
        <div className="quiz-prompt">
          <div className="sub">Verb conjugation</div>
          <div className="word" style={{ fontSize: 22 }}>
            How do you want to be quizzed?
          </div>
        </div>
        <div className="scope-choice">
          <motion.button className="scope-card" onClick={() => chooseConjugationOrder('grouped')} whileTap={{ scale: 0.97 }}>
            <div className="scope-title">Present, then Past</div>
            <div className="scope-desc">All present-tense questions first, then all past-tense</div>
          </motion.button>
          <motion.button className="scope-card" onClick={() => chooseConjugationOrder('mixed')} whileTap={{ scale: 0.97 }}>
            <div className="scope-title">Mixed</div>
            <div className="scope-desc">Present and past tense questions shuffled together</div>
          </motion.button>
        </div>
      </div>
    )
  }

  if (phase === 'quiz') {
    return <QuizRound questions={quiz} onAnswer={handleQuizAnswer} onDone={handleQuizDone} />
  }
  if (phase === 'sentence') {
    return <SentenceBuild questions={sentenceQuestions} onAnswer={handleSentenceAnswer} onDone={handleSentenceDone} />
  }
  if (phase === 'match') {
    return <MatchGame pairs={matchPairs} onDone={handleMatchDone} />
  }

  const totalCorrect =
    (quizResult?.correctFirstTry || 0) + (sentenceResult?.correctFirstTry || 0) + (matchResult?.correctFirstTry || 0)
  const totalQ = (quizResult?.total || 0) + (sentenceResult?.total || 0) + (matchResult?.total || 0)
  const accuracy = totalQ ? totalCorrect / totalQ : 1

  return <SessionSummary accuracy={accuracy} xpEarned={finalXp} onContinue={onExit} />
}
