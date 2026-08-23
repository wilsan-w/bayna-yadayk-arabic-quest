import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { lessons } from '../data/lessons'
import { useGameStore } from '../store/useGameStore'
import { useSettingsStore } from '../store/useSettingsStore'
import FlipCard from './FlipCard'
import QuizRound from './QuizRound'
import SentenceBuild from './SentenceBuild'
import MatchGame from './MatchGame'
import SessionSummary from './SessionSummary'
import { buildQuiz, shuffleArray } from '../utils/quiz'
import { buildSentenceQuestions } from '../utils/sentence'
import { speakArabic } from '../utils/speech'
import { playClick } from '../utils/sfx'

const VERB_FIELDS = [
  ['particle', 'Particle'],
  ['present', 'Present — المضارع'],
  ['imperative', 'Imperative — الأمر'],
  ['masdar', 'Maṣdar — المصدر'],
  ['activeParticiple', 'Active Participle'],
  ['passiveParticiple', 'Passive Participle'],
]

function VocabFace({ item, side }) {
  if (side === 'front') {
    return (
      <>
        <button
          className="speak-btn"
          onClick={(e) => {
            e.stopPropagation()
            speakArabic(item.word || item.phrase || item.past)
          }}
        >
          🔊
        </button>
        <div className="flip-word arabic">{item.word || item.phrase || item.past}</div>
      </>
    )
  }
  return (
    <>
      <div className="flip-meaning">{item.meaning}</div>
      <div className="flip-plurals">
        {item.plural1 && <span className="pill tag-plural arabic">جمع: {item.plural1}</span>}
        {item.plural2 && <span className="pill tag-plural arabic">جمع٢: {item.plural2}</span>}
        {item.synonym && <span className="pill tag-syn arabic">مرادف: {item.synonym}</span>}
        {item.antonym && <span className="pill tag-ant arabic">ضد: {item.antonym}</span>}
      </div>
    </>
  )
}

function VerbFace({ item, side }) {
  if (side === 'front') {
    return (
      <>
        <button
          className="speak-btn"
          onClick={(e) => {
            e.stopPropagation()
            speakArabic(item.past)
          }}
        >
          🔊
        </button>
        <div style={{ color: 'var(--text-faint)', fontSize: 12 }}>الماضي (past tense)</div>
        <div className="flip-word arabic">{item.past}</div>
      </>
    )
  }
  return (
    <>
      <div className="flip-meaning">{item.meaning}</div>
      <div className="verb-grid">
        {VERB_FIELDS.filter(([key]) => item[key]).map(([key, label]) => (
          <div className="verb-cell" key={key}>
            <span className="label">{label}</span>
            <span className="val arabic">{item[key]}</span>
          </div>
        ))}
      </div>
    </>
  )
}

function ExpressionFace({ item, side }) {
  if (side === 'front') {
    return (
      <>
        <button
          className="speak-btn"
          onClick={(e) => {
            e.stopPropagation()
            speakArabic(item.phrase)
          }}
        >
          🔊
        </button>
        <div className="flip-word arabic" style={{ fontSize: 32 }}>
          {item.phrase}
        </div>
      </>
    )
  }
  return <div className="flip-meaning">{item.meaning}</div>
}

const FACE_COMPONENTS = { vocabulary: VocabFace, verbs: VerbFace, expressions: ExpressionFace }

export default function StudySession({ lessonId, category, onExit }) {
  const lesson = lessons.find((l) => l.id === lessonId)
  const items = lesson[category]
  const recordAnswer = useGameStore((s) => s.recordAnswer)
  const finishSession = useGameStore((s) => s.finishSession)
  const settings = useSettingsStore()

  const [phase, setPhase] = useState('learn')
  const [order, setOrder] = useState(() => items.map((_, i) => i))
  const [learnIndex, setLearnIndex] = useState(0)
  const [quizResult, setQuizResult] = useState(null)
  const [sentenceResult, setSentenceResult] = useState(null)
  const [matchResult, setMatchResult] = useState(null)
  const [finalXp, setFinalXp] = useState(0)
  const [sentenceScope, setSentenceScope] = useState('current') // 'current' | 'all'

  const hasMatch = category !== 'verbs' && items.length >= 4 && settings.matchEnabled

  const quiz = useMemo(() => {
    const count = settings.quizLength === 'all' ? items.length : settings.quizLength
    if (category === 'verbs') {
      return buildQuiz(items, (it) => it.past, (it) => it.meaning, count, settings.quizDirection)
    }
    const getWord = (it) => it.word || it.phrase
    return buildQuiz(items, getWord, (it) => it.meaning, count, settings.quizDirection)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, category, settings.quizLength, settings.quizDirection])

  const priorLessons = useMemo(() => lessons.filter((l) => l.id <= lessonId), [lessonId])

  function sentencePoolFor(sourceLessons) {
    const authored = sourceLessons.flatMap((l) =>
      (l.sentences || []).map((s) => ({ phrase: s.ar, meaning: s.en, _authored: true }))
    )
    if (category !== 'expressions') return authored
    const exprItems = sourceLessons.flatMap((l) =>
      l.expressions.map((it, idx) => ({ ...it, _lessonId: l.id, _origIndex: idx }))
    )
    return [...exprItems, ...authored]
  }

  const sentencePoolCurrent = useMemo(() => sentencePoolFor([lesson]), [items, category, lesson])
  const sentencePoolAll = useMemo(() => sentencePoolFor(priorLessons), [priorLessons, category, lesson])
  const hasSentenceChoice = settings.sentenceEnabled && sentencePoolAll.length > sentencePoolCurrent.length
  const hasSentence = settings.sentenceEnabled && sentencePoolCurrent.length > 0

  const sentencePool = sentenceScope === 'all' ? sentencePoolAll : sentencePoolCurrent

  const sentenceQuestions = useMemo(() => {
    if (!settings.sentenceEnabled || sentencePool.length === 0) return []
    return buildSentenceQuestions(sentencePool, settings.quizDirection, 'all')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentencePool, settings.sentenceEnabled, settings.quizDirection])

  // Sentence questions built from authored full-sentence content don't map to a
  // single vocab/verb/expression item, so only record per-item mastery for the
  // subset that came straight from a lesson's real expression entries.
  function handleSentenceAnswer(poolIndex, correct) {
    const entry = sentencePool[poolIndex]
    if (entry && !entry._authored) {
      recordAnswer(entry._lessonId, category, entry._origIndex, correct)
    }
  }

  const matchPairs = useMemo(() => {
    if (!hasMatch) return []
    const shuffled = shuffleArray(items).slice(0, Math.min(settings.matchPairs, items.length))
    return shuffled.map((it, i) => ({ id: i, left: it.word || it.phrase, right: it.meaning }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, hasMatch, settings.matchPairs])

  const Face = FACE_COMPONENTS[category]

  function finishLearn() {
    setPhase('quiz')
  }

  function handleQuizAnswer(index, correct) {
    recordAnswer(lessonId, category, index, correct)
  }

  function handleQuizDone(result) {
    setQuizResult(result)
    if (hasSentenceChoice) setPhase('sentenceChoice')
    else if (hasSentence) setPhase('sentence')
    else if (hasMatch) setPhase('match')
    else finishAll(result, null, null)
  }

  function chooseSentenceScope(scope) {
    playClick()
    setSentenceScope(scope)
    setPhase('sentence')
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
      items.length +
      (qResult?.correctFirstTry || 0) * 8 +
      (sResult?.correctFirstTry || 0) * 10 +
      (mResult?.correctFirstTry || 0) * 6
    setFinalXp(xp)
    finishSession(lessonId, category, accuracy, xp)
    setPhase('summary')
  }

  if (phase === 'learn') {
    const item = items[order[learnIndex]]
    return (
      <div className="session-shell">
        <div className="session-progress-bg">
          <div className="session-progress-fill" style={{ width: `${(learnIndex / items.length) * 100}%` }} />
        </div>
        <div className="learn-toolbar">
          <button
            className="btn secondary small"
            onClick={() => {
              playClick()
              setOrder(shuffleArray(items.map((_, i) => i)))
              setLearnIndex(0)
            }}
          >
            🔀 Shuffle
          </button>
          <button
            className="btn secondary small"
            onClick={() => {
              playClick()
              finishLearn()
            }}
          >
            Skip to Quiz ⏭
          </button>
        </div>
        <div className="card-stage">
          <FlipCard
            cardKey={learnIndex}
            front={<Face item={item} side="front" />}
            back={<Face item={item} side="back" />}
          />
        </div>
        <div className="btn-row">
          <button className="btn secondary" onClick={onExit}>
            Exit
          </button>
          <button
            className="btn"
            onClick={() => {
              if (learnIndex + 1 >= items.length) finishLearn()
              else setLearnIndex((i) => i + 1)
            }}
          >
            {learnIndex + 1 >= items.length ? 'Start Quiz →' : 'Next Card →'}
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'quiz') {
    return <QuizRound questions={quiz} onAnswer={handleQuizAnswer} onDone={handleQuizDone} />
  }

  if (phase === 'sentenceChoice') {
    return (
      <div className="session-shell">
        <div className="quiz-prompt">
          <div className="sub">Sentence practice</div>
          <div className="word" style={{ fontSize: 22 }}>
            Which sentences do you want to build?
          </div>
        </div>
        <div className="scope-choice">
          <motion.button className="scope-card" onClick={() => chooseSentenceScope('current')} whileTap={{ scale: 0.97 }}>
            <div className="scope-title">This lesson only</div>
            <div className="scope-desc">
              {sentencePoolCurrent.length} sentence{sentencePoolCurrent.length === 1 ? '' : 's'} from Lesson {lessonId}
            </div>
          </motion.button>
          <motion.button className="scope-card" onClick={() => chooseSentenceScope('all')} whileTap={{ scale: 0.97 }}>
            <div className="scope-title">All lessons so far</div>
            <div className="scope-desc">
              {sentencePoolAll.length} sentences from Lessons 1–{lessonId}
            </div>
          </motion.button>
        </div>
      </div>
    )
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
