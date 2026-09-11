import { useState } from 'react'
import { X } from 'lucide-react'
import { HAFALAN_MODES, DEFAULT_TARGETS } from '../../lib/hafalan-storage'

export function SettingsPanel({ mode, targets, onSave, onClose }) {
  const t = targets[mode] || DEFAULT_TARGETS[mode]
  const [kotoba, setKotoba] = useState(t.kotoba)
  const [kanji, setKanji] = useState(t.kanji)
  const hasKanji = HAFALAN_MODES.find(m => m.key === mode)?.kanjiSrc != null

  return (
    <div className="hh-settings">
      <div className="hh-settings-head">
        <span>Target Harian — {HAFALAN_MODES.find(m => m.key === mode)?.label}</span>
        <button className="hh-close-btn" onClick={onClose}><X size={16} /></button>
      </div>
      <label className="hh-setting-row">
        <span>Kotoba per hari</span>
        <input type="number" min={1} max={200} value={kotoba} onChange={e => setKotoba(Math.max(1, +e.target.value || 1))} className="hh-input hh-input-sm" />
      </label>
      {hasKanji && (
        <label className="hh-setting-row">
          <span>Kanji per hari</span>
          <input type="number" min={1} max={100} value={kanji} onChange={e => setKanji(Math.max(1, +e.target.value || 1))} className="hh-input hh-input-sm" />
        </label>
      )}
      <button className="hh-add-submit" onClick={() => { onSave({ ...targets, [mode]: { kotoba, kanji: hasKanji ? kanji : 0 } }); onClose() }}>
        Simpan Target
      </button>
    </div>
  )
}
