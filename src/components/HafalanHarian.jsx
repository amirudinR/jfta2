import { useEffect, useState } from 'react'
import {
  CheckSquare, Square, Plus, ChevronDown, ChevronUp,
  Trash2, Settings, Flame, BookText, ListChecks, History,
  CheckCheck, Eraser, Volume2, Focus, Languages,
} from 'lucide-react'
import { useHafalan } from '../hooks/useHafalan'
import { speak, ttsSupported } from '../lib/tts'
import { kanaToRomaji } from '../lib/kana'
import { Heatmap } from './hafalan/Heatmap'
import { ProgressBar } from './ui/ProgressBar'
import { DetailModal } from './hafalan/DetailModal'
import { SettingsPanel } from './hafalan/SettingsPanel'
import { AddForm } from './hafalan/AddForm'
import { UjianHarian } from './hafalan/UjianHarian'
import { DayStrip, dayLabel } from './hafalan/DayStrip'

export default function HafalanHarian({ onGoMateri, onGoRecall, level = 'a2', showRomaji = false, onToggleRomaji = () => {} }) {
  const {
    hasKanji, hasBunpou, t,
    tab, setTab,
    selectedDate, setDate,
    today, isToday, isPast, isFuture,
    showSettings, setShowSettings, showForm, setShowForm,
    showHeatmap, setShowHeatmap, detailItem, setDetailItem,
    audioRows, setAudioRows,
    showExam, setShowExam, confirmDeleteKey, confirmBulk,
    kotobaCheckedCount, kanjiCheckedCount, bunpouCheckedCount,
    kotobaDone, kanjiDone, bunpouDone, allDone,
    history, streak, showReminder, reminderParts,
    totalMap, items, checkedMap, tabLabel,
    toggle, markAll, uncheckAll, addCustom, removeCustom, saveTargets, targets,
  } = useHafalan({ level })

  // Apakah TTS tersedia di browser ini (tombol audio hanya tampil bila ada).
  const canSpeak = ttsSupported()

  // ── Mode Fokus (khusus desktop) ────────────────────────────
  // Toggle preferensi hafalan desktop: card lebih lega (2 kolom),
  // nomor & checkbox disembunyikan sampai hover. Default OFF agar
  // tampilan mobile/tablet tidak terpengaruh (mode ini hanya aktif
  // lewat CSS @media ≥1024px).
  const [focusMode, setFocusMode] = useState(() => {
    try { return localStorage.getItem('hh:focusMode') === '1' } catch { return false }
  })
  useEffect(() => {
    try { localStorage.setItem('hh:focusMode', focusMode ? '1' : '0') } catch {}
  }, [focusMode])

  // Scroll-reveal: tambah .is-in saat baris masuk viewport (IntersectionObserver).
  // Hanya berdampak visual di desktop (lihat CSS), mobile tidak berubah.
  useEffect(() => {
    const list = document.querySelector('.hh-list')
    if (!list || typeof IntersectionObserver === 'undefined') return
    const rows = list.querySelectorAll('.hh-row:not(.is-in)')
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) {
            en.target.classList.add('is-in')
            io.unobserve(en.target)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )
    rows.forEach((r) => io.observe(r))
    return () => io.disconnect()
  }, [tab, items.length, focusMode, selectedDate])

  // Berapa item yang sudah dicentang per tanggal (untuk badge strip & quick).
  const dayMeta = (date) => history[date]?.kotoba != null
    ? (history[date].kotoba + history[date].kanji + history[date].bunpou)
    : null

  // Jumlah item tercentang di tab & tanggal aktif (untuk tombol Hafal/Batal semua).
  const tabSlice = { kotoba: t.kotoba, kanji: t.kanji, bunpou: t.bunpou }[tab] || 0
  const tabChecked = { kotoba: kotobaCheckedCount, kanji: kanjiCheckedCount, bunpou: bunpouCheckedCount }[tab] || 0
  const tabDone = { kotoba: kotobaDone, kanji: kanjiDone, bunpou: bunpouDone }[tab] ?? true
  const canMarkAll = tabSlice > 0 && tabChecked < tabSlice

  return (
    <div className="hh-root">
      {showExam ? (
        <UjianHarian onBack={() => setShowExam(false)} />
      ) : (
      <>
      {/* Pemilih hari — fleksibel: kemarin (melengkapi), hari ini, besok (cicil). */}
      <DayStrip
        selectedDate={selectedDate}
        onChange={setDate}
        meta={dayMeta}
      />

      {isPast && !allDone && (
        <div className="hh-fill-banner">
          Melengkapi {dayLabel(selectedDate, today)} — masih ada bagian belum hafal.
          Bisa dicicil sekarang.
        </div>
      )}

      {isFuture && (
        <div className="hh-cicil-banner">
          Mencicil {dayLabel(selectedDate, today)} — centang lebih awal tidak masalah.
        </div>
      )}

      {showReminder && (
        <div className="hh-reminder">
          Target belum tercapai! {reminderParts.join(', ')}
        </div>
      )}

      {allDone && (
        <div className="hh-done-banner">
          {isToday ? 'Target hari ini tercapai! すごい！'
            : isPast ? `Target ${dayLabel(selectedDate, today)} lengkap! よかった！`
            : `Sudah dicicil semua untuk ${dayLabel(selectedDate, today)}! はやい！`}
        </div>
      )}

      {/* Streak + settings */}
      <div className="hh-header">
        <div className="hh-streak">
          <Flame size={18} className={streak > 0 ? 'hh-flame-on' : ''} />
          <span className="hh-streak-num">{streak}</span>
          <span className="hh-streak-label">hari berturut</span>
        </div>
        <div className="hh-header-actions">
          <button className="hh-settings-btn" onClick={() => setShowExam(true)} title="Ujian Harian">
            <ListChecks size={16} /> <span className="hh-exam-btn-label">Ujian Harian</span>
          </button>
          {onGoRecall && (
            <button className="hh-settings-btn" onClick={onGoRecall} title="Recall materi lama">
              <History size={16} /> <span className="hh-exam-btn-label">Recall</span>
            </button>
          )}
          <button className="hh-settings-btn" onClick={() => setShowSettings(v => !v)}>
            <Settings size={16} />
          </button>
        </div>
      </div>

      {showSettings && (
        <SettingsPanel
          mode={level}
          targets={targets}
          onSave={saveTargets}
          onClose={() => setShowSettings(false)}
          audioEnabled={canSpeak ? audioRows : false}
          audioSupported={canSpeak}
          onToggleAudio={setAudioRows}
        />
      )}

      {/* Progress */}
      <div className="hh-stats">
        <ProgressBar current={kotobaCheckedCount} target={t.kotoba} label="Kotoba" />
        {hasKanji && <ProgressBar current={kanjiCheckedCount} target={t.kanji} label="Kanji" />}
        {hasBunpou && t.bunpou > 0 && <ProgressBar current={bunpouCheckedCount} target={t.bunpou} label="Bunpou" />}
      </div>

      {/* Heatmap */}
      <button className="hh-heatmap-toggle" onClick={() => setShowHeatmap(v => !v)}>
        Riwayat {showHeatmap ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {showHeatmap && <Heatmap history={history} targets={t} />}

      {/* Tabs */}
      <div className="hh-tabs">
        <button className={`hh-tab ${tab === 'kotoba' ? 'active' : ''}`} onClick={() => setTab('kotoba')}>
          ことば
          <span className="hh-tab-badge">{kotobaCheckedCount}/{t.kotoba}</span>
        </button>
        {hasKanji && (
          <button className={`hh-tab ${tab === 'kanji' ? 'active' : ''}`} onClick={() => setTab('kanji')}>
            漢字
            <span className="hh-tab-badge">{kanjiCheckedCount}/{t.kanji}</span>
          </button>
        )}
        {hasBunpou && t.bunpou > 0 && (
          <button className={`hh-tab ${tab === 'bunpou' ? 'active' : ''}`} onClick={() => setTab('bunpou')}>
            文法
            <span className="hh-tab-badge">{bunpouCheckedCount}/{t.bunpou}</span>
          </button>
        )}
      </div>

      {/* Aksi cepat: tandai hafal semua / bersihkan — per tab & tanggal aktif.
          Dua langkah: klik pertama minta konfirmasi, klik kedua eksekusi. */}
      {tabSlice > 0 && (
        <div className="hh-bulk">
          <button
            className={`hh-bulk-btn mark ${canMarkAll ? '' : 'done'} ${confirmBulk === 'mark' ? 'confirming' : ''}`}
            onClick={() => markAll(tab)}
            disabled={!canMarkAll}
            title={`Tandai semua ${tabLabel} pada ${dayLabel(selectedDate, today)} sebagai hafal`}
          >
            <CheckCheck size={16} />
            {confirmBulk === 'mark'
              ? `Yakin tandai ${tabSlice} item? Klik lagi`
              : tabDone ? `${tabLabel} Sudah Hafal Semua` : `Hafal Semua (${tabSlice})`}
          </button>
          {tabChecked > 0 && (
            <button
              className={`hh-bulk-btn clear ${confirmBulk === 'clear' ? 'confirming' : ''}`}
              onClick={() => uncheckAll(tab)}
              title={`Bersihkan centang ${tabLabel} pada ${dayLabel(selectedDate, today)}`}
            >
              <Eraser size={15} /> {confirmBulk === 'clear' ? 'Yakin? Klik lagi' : 'Batal Semua'}
            </button>
          )}
        </div>
      )}

      {/* Kontrol tampilan hafalan desktop — Mode Fokus card lega.
          Tombol disembunyikan di mobile/tablet via CSS (.hh-focus-toggle). */}
      <div className="hh-viewbar no-print">
        <span className="hh-viewbar-count">{items.length} kata</span>
        <button
          type="button"
          className={`hh-romaji-toggle ${showRomaji ? 'on' : ''}`}
          onClick={onToggleRomaji}
          aria-pressed={showRomaji}
          title={showRomaji ? 'Sembunyikan romaji' : 'Tampilkan romaji'}
        >
          <Languages size={15} />
          <span>Romaji</span>
        </button>
        <button
          type="button"
          className={`hh-focus-toggle ${focusMode ? 'on' : ''}`}
          onClick={() => setFocusMode((v) => !v)}
          aria-pressed={focusMode}
          title={focusMode ? 'Matikan Mode Fokus' : 'Aktifkan Mode Fokus (card lebih lega)'}
        >
          <Focus size={15} />
          <span>Mode Fokus</span>
        </button>
      </div>

      {/* Item List */}
      <div
        className={`hh-list ${focusMode ? 'has-focus' : ''}`}
        data-stagger
      >
        {items.map((item) => {
          const isChecked = !!checkedMap?.[item.id]
          // Kanji multi-item (mis. "北 / 南 / 東 / 西") → font lebih kecil
          // supaya tidak makan banyak baris & tinggi card tetap rata.
          const manyKanji = /[\/・、,]/.test(item.front) || [...(item.front || '')].filter((ch) => !/\s|[・\/、,]/.test(ch)).length > 3
          return (
            <div
              key={item.id}
              className={`hh-row ${manyKanji ? 'hh-row--many' : ''} ${isChecked ? 'checked' : ''}`}
            >
              <span className="hh-num">{item.num}</span>
              {/* E2 fix: div → button agar keyboard accessible */}
              <button
                className="hh-content"
                onClick={() => setDetailItem(item)}
                aria-label={`Lihat detail ${item.front}`}
              >
                <div className="hh-front">
                  <span className="hh-jp">{item.front}</span>
                  {item.reading && <span className="hh-reading">{item.reading}</span>}
                </div>
                <div className="hh-meaning">{item.meaning}</div>
                {showRomaji && (
                  <div className="hh-romaji">{kanaToRomaji(item.reading || item.front)}</div>
                )}
              </button>
              {/* Grup kontrol: dipisah agar bisa dipasang nempel di dasar
                  card desktop (margin-top:auto) — posisi konsisten antar
                  card, sejajar horizontal dalam satu baris grid. */}
              <div className="hh-row-actions">
                {canSpeak && audioRows && (
                  <button
                    className="hh-tts-btn"
                    onClick={() => speak(item.reading || item.front)}
                    title="Dengarkan"
                    aria-label={`Dengarkan ${item.front}`}
                  >
                    <Volume2 size={18} />
                  </button>
                )}
                <button className={`hh-check-btn ${isChecked ? 'checked' : ''}`} onClick={() => toggle(tab, item.id)}>
                  {isChecked ? <CheckSquare size={28} /> : <Square size={28} />}
                </button>
              </div>
              {item.custom && (() => {
                const key = `${tab}-${item.customIdx}`
                const isConfirming = confirmDeleteKey?.key === key
                return (
                  <button
                    className={`hh-del-custom ${isConfirming ? 'confirming' : ''}`}
                    onClick={() => removeCustom(tab, item.customIdx)}
                    title={isConfirming ? 'Klik lagi untuk hapus' : 'Hapus'}
                  >
                    <Trash2 size={14} />
                    {isConfirming && <span style={{ fontSize: 10, marginLeft: 2 }}>Yakin?</span>}
                  </button>
                )
              })()}
            </div>
          )
        })}
        {items.length === 0 && (
          <div className="hh-empty">Tidak ada data untuk mode ini.</div>
        )}
      </div>

      {/* Add Form */}
      {showForm === tab ? (
        <AddForm type={tab} onAdd={(item) => addCustom(tab, item)} onClose={() => setShowForm(null)} />
      ) : (
        <button className="hh-add-btn" onClick={() => setShowForm(tab)}>
          <Plus size={16} /> Tambah {tabLabel} Baru
        </button>
      )}

      {onGoMateri && (
        <button className="hh-add-btn" onClick={onGoMateri} style={{ marginTop: 4 }}>
          <BookText size={16} /> Lihat Semua Materi
        </button>
      )}

      <div className="hh-info">
        {isToday ? 'Hari Ini' : `${dayLabel(selectedDate, today)}`} · Target: {t.kotoba} kotoba
        {hasKanji ? ` + ${t.kanji} kanji` : ''}
        {hasBunpou && t.bunpou > 0 ? ` + ${t.bunpou} bunpou` : ''}
        {' '}/ hari · Reset 00:00 ·
        Total: {(totalMap[tab] || []).length} item
      </div>

      <DetailModal
        item={detailItem}
        isChecked={!!(detailItem && checkedMap?.[detailItem.id])}
        onToggle={() => detailItem && toggle(tab, detailItem.id)}
        onClose={() => setDetailItem(null)}
      />
      </>
      )}
    </div>
  )
}
