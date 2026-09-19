import { useState, useMemo } from 'react'
import { X, Volume2 } from 'lucide-react'
import { HAFALAN_MODES, DEFAULT_TARGETS } from '../../lib/hafalan-storage'
import { byMaterial } from '../../data'

function estDays(total, target) {
  if (!target || target <= 0) return null
  return Math.ceil(total / target)
}

export function SettingsPanel({
  mode, targets, onSave, onClose,
  audioEnabled = false, audioSupported = true, onToggleAudio,
}) {
  const t = targets[mode] || DEFAULT_TARGETS[mode]
  const modeInfo = HAFALAN_MODES.find(m => m.key === mode)
  const hasKanji = modeInfo?.kanjiSrc != null
  const hasBunpou = modeInfo?.bunpouSrc != null

  const [kotoba, setKotoba] = useState(t.kotoba)
  const [kanji, setKanji] = useState(t.kanji || 0)
  const [bunpou, setBunpou] = useState(t.bunpou || 0)

  // Total items from real data
  const totals = useMemo(() => ({
    kotoba: modeInfo ? byMaterial(modeInfo.kotobaSrc).length : 0,
    kanji: modeInfo?.kanjiSrc ? byMaterial(modeInfo.kanjiSrc).length : 0,
    bunpou: modeInfo?.bunpouSrc ? byMaterial(modeInfo.bunpouSrc).length : 0,
  }), [mode])

  // Live estimations
  const estKotoba = estDays(totals.kotoba, kotoba)
  const estKanji = hasKanji ? estDays(totals.kanji, kanji) : null
  const estBunpou = hasBunpou ? estDays(totals.bunpou, bunpou) : null

  const estimates = [estKotoba, estKanji, estBunpou].filter(v => v != null)
  const maxEst = estimates.length ? Math.max(...estimates) : null

  const save = () => {
    onSave({
      ...targets,
      [mode]: {
        kotoba,
        kanji: hasKanji ? kanji : 0,
        bunpou: hasBunpou ? bunpou : 0,
      },
    })
    onClose()
  }

  return (
    <div className="hh-settings">
      <div className="hh-settings-head">
        <span>Target Harian — {modeInfo?.label}</span>
        <button className="hh-close-btn" onClick={onClose}><X size={16} /></button>
      </div>

      {/* Total info */}
      <div className="hh-settings-info">
        Tersedia: {totals.kotoba.toLocaleString()} Kotoba
        {hasKanji ? ` · ${totals.kanji.toLocaleString()} Kanji` : ''}
        {hasBunpou ? ` · ${totals.bunpou} Bunpou` : ''}
      </div>

      {/* Kotoba */}
      <label className="hh-setting-row">
        <div className="hh-setting-left">
          <span>Kotoba per hari</span>
          {estKotoba != null && <span className="hh-setting-est">selesai ± {estKotoba} hari</span>}
        </div>
        <input type="number" min={1} max={200} value={kotoba}
          onChange={e => setKotoba(Math.max(1, +e.target.value || 1))}
          className="hh-input hh-input-sm" />
      </label>

      {/* Kanji */}
      {hasKanji && (
        <label className="hh-setting-row">
          <div className="hh-setting-left">
            <span>Kanji per hari</span>
            {estKanji != null && <span className="hh-setting-est">selesai ± {estKanji} hari</span>}
          </div>
          <input type="number" min={1} max={100} value={kanji}
            onChange={e => setKanji(Math.max(1, +e.target.value || 1))}
            className="hh-input hh-input-sm" />
        </label>
      )}

      {/* Bunpou */}
      {hasBunpou && (
        <label className="hh-setting-row">
          <div className="hh-setting-left">
            <span>Bunpou per hari</span>
            {estBunpou != null && <span className="hh-setting-est">selesai ± {estBunpou} hari</span>}
          </div>
          <input type="number" min={1} max={50} value={bunpou}
            onChange={e => setBunpou(Math.max(1, +e.target.value || 1))}
            className="hh-input hh-input-sm" />
        </label>
      )}

      {/* Summary */}
      {maxEst != null && (
        <div className="hh-settings-summary">
          Dengan target ini, seluruh materi {modeInfo?.label} selesai dalam kurang lebih <strong>{maxEst} hari</strong>
        </div>
      )}

      {/* Tampilan: tombol audio di baris daftar */}
      <div className="hh-setting-row hh-setting-toggle">
        <div className="hh-setting-left">
          <span className="hh-setting-toggle-title">
            <Volume2 size={15} /> Tombol audio di daftar
          </span>
          <span className="hh-setting-est">
            {audioSupported
              ? 'Matikan bila suara dirasa mengganggu saat menghafal.'
              : 'Browser ini tidak mendukung suara (TTS).'}
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={audioEnabled}
          aria-label="Tampilkan tombol audio di daftar hafalan"
          disabled={!audioSupported}
          className={`hh-switch ${audioEnabled ? 'on' : ''}`}
          onClick={() => audioSupported && onToggleAudio?.(!audioEnabled)}
        >
          <span className="hh-switch-knob" />
        </button>
      </div>

      <button className="hh-add-submit" onClick={save}>
        Simpan Target
      </button>
    </div>
  )
}
