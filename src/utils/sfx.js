import { useSettingsStore } from '../store/useSettingsStore'

function soundOn() {
  return useSettingsStore.getState().soundEnabled
}

let ctx
function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  return ctx
}

function tone(freq, start, duration, type = 'sine', gainPeak = 0.18) {
  const c = getCtx()
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, c.currentTime + start)
  gain.gain.linearRampToValueAtTime(gainPeak, c.currentTime + start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + duration)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(c.currentTime + start)
  osc.stop(c.currentTime + start + duration + 0.05)
}

export function playCorrect() {
  if (!soundOn()) return
  try {
    tone(880, 0, 0.12)
    tone(1318.5, 0.09, 0.18)
  } catch {}
}

export function playWrong() {
  if (!soundOn()) return
  try {
    tone(220, 0, 0.18, 'sawtooth', 0.12)
    tone(160, 0.08, 0.22, 'sawtooth', 0.1)
  } catch {}
}

export function playLevelUp() {
  if (!soundOn()) return
  try {
    ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.09, 0.22, 'triangle', 0.15))
  } catch {}
}

export function playFlip() {
  if (!soundOn()) return
  try {
    tone(440, 0, 0.06, 'sine', 0.08)
  } catch {}
}

export function playClick() {
  if (!soundOn()) return
  try {
    tone(600, 0, 0.05, 'square', 0.05)
  } catch {}
}
