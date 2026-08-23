import { useRef, useState } from 'react'
import { exportCode, importCode } from '../utils/backup'
import { playClick, playCorrect, playWrong } from '../utils/sfx'

export default function BackupSection() {
  const [code, setCode] = useState('')
  const [copyMsg, setCopyMsg] = useState('')
  const [importValue, setImportValue] = useState('')
  const [importMsg, setImportMsg] = useState(null) // { ok: bool, text: string }
  const fileInputRef = useRef(null)

  function generate() {
    playClick()
    setCode(exportCode())
    setCopyMsg('')
  }

  async function copyToClipboard() {
    const value = code || exportCode()
    if (!code) setCode(value)
    try {
      await navigator.clipboard.writeText(value)
      setCopyMsg('Copied!')
    } catch {
      setCopyMsg('Could not auto-copy — select the text and copy manually.')
    }
    setTimeout(() => setCopyMsg(''), 2500)
  }

  function downloadFile() {
    const value = code || exportCode()
    if (!code) setCode(value)
    const blob = new Blob([value], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `arabic-quest-backup-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function doImport(raw) {
    try {
      const exportedAt = importCode(raw)
      playCorrect()
      setImportMsg({
        ok: true,
        text: exportedAt ? `Restored! (backed up ${new Date(exportedAt).toLocaleString()})` : 'Restored!',
      })
      setImportValue('')
    } catch (e) {
      playWrong()
      setImportMsg({ ok: false, text: e.message })
    }
  }

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => doImport(String(reader.result || ''))
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="settings-card">
      <h3 className="heading">Backup & restore</h3>
      <p className="settings-desc">
        No account needed. Generate a code (or file) that holds your XP, streak, and lesson progress, then paste or
        upload it on another device to restore it there. Nothing is sent anywhere — it stays on your device unless
        you share it yourself.
      </p>

      <div className="backup-block">
        <div className="settings-desc" style={{ fontWeight: 700, color: 'var(--text)' }}>
          Export
        </div>
        <textarea
          className="backup-textarea"
          readOnly
          placeholder="Click “Generate code” to create your backup…"
          value={code}
          onFocus={(e) => e.target.select()}
        />
        <div className="btn-row" style={{ justifyContent: 'flex-start' }}>
          <button className="btn secondary small" onClick={generate}>
            🔄 Generate code
          </button>
          <button className="btn secondary small" onClick={copyToClipboard}>
            📋 Copy
          </button>
          <button className="btn secondary small" onClick={downloadFile}>
            ⬇ Download file
          </button>
        </div>
        {copyMsg && <div className="settings-desc">{copyMsg}</div>}
      </div>

      <div className="backup-block">
        <div className="settings-desc" style={{ fontWeight: 700, color: 'var(--text)' }}>
          Restore
        </div>
        <textarea
          className="backup-textarea"
          placeholder="Paste your backup code here…"
          value={importValue}
          onChange={(e) => setImportValue(e.target.value)}
        />
        <div className="btn-row" style={{ justifyContent: 'flex-start' }}>
          <button className="btn small" disabled={!importValue.trim()} onClick={() => doImport(importValue)}>
            Restore from code
          </button>
          <button className="btn secondary small" onClick={() => fileInputRef.current?.click()}>
            ⬆ Upload file
          </button>
          <input ref={fileInputRef} type="file" accept=".txt" style={{ display: 'none' }} onChange={handleFile} />
        </div>
        {importMsg && (
          <div className="settings-desc" style={{ color: importMsg.ok ? 'var(--primary)' : 'var(--coral)' }}>
            {importMsg.text}
          </div>
        )}
      </div>
    </div>
  )
}
