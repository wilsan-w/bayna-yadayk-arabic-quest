import { useState } from 'react'
import { useSettingsStore } from '../store/useSettingsStore'
import { useGameStore } from '../store/useGameStore'
import { playClick } from '../utils/sfx'
import BackupSection from './BackupSection'

function Segmented({ options, value, onChange }) {
  return (
    <div className="segmented">
      {options.map((opt) => (
        <button
          key={opt.value}
          className={`segmented-opt ${value === opt.value ? 'active' : ''}`}
          onClick={() => {
            playClick()
            onChange(opt.value)
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button className={`toggle ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}>
      <span className="toggle-knob" />
    </button>
  )
}

export default function SettingsPage({ onBack }) {
  const settings = useSettingsStore()
  const resetProgress = useGameStore((s) => s.reset)
  const [confirmingReset, setConfirmingReset] = useState(false)

  return (
    <div>
      <button className="icon-btn" onClick={onBack} style={{ marginBottom: 18 }}>
        ←
      </button>
      <div className="map-header" style={{ textAlign: 'left', marginBottom: 24 }}>
        <h1 className="heading" style={{ fontSize: 24 }}>
          Settings
        </h1>
        <p>Customize how sessions play</p>
      </div>

      <div className="settings-list">
        <div className="settings-card">
          <h3 className="heading">Quiz direction</h3>
          <p className="settings-desc">Which side is shown as the question</p>
          <Segmented
            value={settings.quizDirection}
            onChange={(v) => settings.setSetting('quizDirection', v)}
            options={[
              { value: 'source-target', label: 'Arabic → English' },
              { value: 'target-source', label: 'English → Arabic' },
              { value: 'mixed', label: 'Mixed' },
            ]}
          />
        </div>

        <div className="settings-card">
          <h3 className="heading">Questions per session</h3>
          <p className="settings-desc">How many quiz questions in each round</p>
          <Segmented
            value={settings.quizLength}
            onChange={(v) => settings.setSetting('quizLength', v)}
            options={[
              { value: 5, label: '5' },
              { value: 10, label: '10' },
              { value: 15, label: '15' },
              { value: 'all', label: 'All' },
            ]}
          />
        </div>

        <div className="settings-card">
          <div className="settings-row">
            <div>
              <h3 className="heading">Match round</h3>
              <p className="settings-desc">Bonus pair-matching game after the quiz</p>
            </div>
            <Toggle checked={settings.matchEnabled} onChange={(v) => settings.setSetting('matchEnabled', v)} />
          </div>
          {settings.matchEnabled && (
            <Segmented
              value={settings.matchPairs}
              onChange={(v) => settings.setSetting('matchPairs', v)}
              options={[
                { value: 4, label: '4 pairs' },
                { value: 6, label: '6 pairs' },
                { value: 8, label: '8 pairs' },
              ]}
            />
          )}
        </div>

        <div className="settings-card">
          <div className="settings-row">
            <div>
              <h3 className="heading">Sound effects</h3>
              <p className="settings-desc">Chimes for correct/wrong answers, flips & level-ups</p>
            </div>
            <Toggle checked={settings.soundEnabled} onChange={(v) => settings.setSetting('soundEnabled', v)} />
          </div>
        </div>

        <BackupSection />

        <div className="settings-card danger">
          <h3 className="heading">Reset progress</h3>
          <p className="settings-desc">Clears all XP, streak, and lesson mastery on this device. Cannot be undone.</p>
          {confirmingReset ? (
            <div className="btn-row" style={{ justifyContent: 'flex-start' }}>
              <button
                className="btn"
                style={{ background: 'var(--coral)', boxShadow: '0 5px 0 #b23f3f' }}
                onClick={() => {
                  resetProgress()
                  setConfirmingReset(false)
                }}
              >
                Yes, reset everything
              </button>
              <button className="btn secondary" onClick={() => setConfirmingReset(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <button className="btn secondary" onClick={() => setConfirmingReset(true)}>
              Reset all progress
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
