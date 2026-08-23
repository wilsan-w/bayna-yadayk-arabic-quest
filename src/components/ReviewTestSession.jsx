import { useMemo, useState } from 'react'
import { useGameStore } from '../store/useGameStore'
import { useSettingsStore } from '../store/useSettingsStore'
import QuizRound from './QuizRound'
import MatchGame from './MatchGame'
import SessionSummary from './SessionSummary'
import { buildQuiz, shuffleArray } from '../utils/quiz'

function textOf(item) {
  return item.word || item.phrase || item.past
}

export default function ReviewTestSession({ category, entries, onExit }) {
  const recordAnswer = useGameStore((s) => s.recordAnswer)
  const addXp = useGameStore((s) => s.addXp)
  const settings = useSettingsStore()

  const [phase, setPhase] = useState('quiz')
  const [quizResult, setQuizResult] = useState(null)
  const [matchResult, setMatchResult] = useState(null)
  const [finalXp, setFinalXp] = useState(0)

  const items = useMemo(() => entries.map((e) => e.item), [entries])
  const hasMatch = category !== 'verbs' && items.length >= 4 && settings.matchEnabled

  const quiz = useMemo(() => {
    const count = settings.quizLength === 'all' ? items.length : settings.quizLength
    const getSource = category === 'verbs' ? (it) => it.past : (it) => it.word || it.phrase
    return buildQuiz(items, getSource, (it) => it.meaning, count, settings.quizDirection)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, category, settings.quizLength, settings.quizDirection])

  const matchPairs = useMemo(() => {
    if (!hasMatch) return []
    const shuffled = shuffleArray(entries).slice(0, Math.min(settings.matchPairs, entries.length))
    return shuffled.map((e, i) => ({ id: i, left: textOf(e.item), right: e.item.meaning }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, hasMatch, settings.matchPairs])

  function handleQuizAnswer(index, correct) {
    const entry = entries[index]
    if (entry) recordAnswer(entry.lessonId, category, entry.index, correct)
  }

  function handleQuizDone(result) {
    setQuizResult(result)
    if (hasMatch) setPhase('match')
    else finishAll(result, null)
  }

  function handleMatchDone(result) {
    setMatchResult(result)
    finishAll(quizResult, result)
  }

  function finishAll(qResult, mResult) {
    const totalCorrect = (qResult?.correctFirstTry || 0) + (mResult?.correctFirstTry || 0)
    const totalQ = (qResult?.total || 0) + (mResult?.total || 0)
    const accuracy = totalQ ? totalCorrect / totalQ : 1
    const xp = (qResult?.correctFirstTry || 0) * 8 + (mResult?.correctFirstTry || 0) * 6
    setFinalXp(xp)
    addXp(xp)
    setPhase('summary')
  }

  if (phase === 'quiz') {
    return <QuizRound questions={quiz} onAnswer={handleQuizAnswer} onDone={handleQuizDone} />
  }
  if (phase === 'match') {
    return <MatchGame pairs={matchPairs} onDone={handleMatchDone} />
  }

  const totalCorrect = (quizResult?.correctFirstTry || 0) + (matchResult?.correctFirstTry || 0)
  const totalQ = (quizResult?.total || 0) + (matchResult?.total || 0)
  const accuracy = totalQ ? totalCorrect / totalQ : 1

  return <SessionSummary accuracy={accuracy} xpEarned={finalXp} onContinue={onExit} />
}
