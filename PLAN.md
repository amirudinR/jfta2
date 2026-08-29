# PLAN — Desain Identik 暗記帳 (HTML Asli)

Status: disetujui user (Aug 2026). Target: UI React identik dengan desain HTML asli
(stage navy, kartu washi genkou-grid, flip 3D, hanko, dark mode, TTS, swipe, filter pelajaran),
data asli dipakai begitu file HTML tersedia.

## Keputusan terkunci
1. **Data**: diekstraksi otomatis dari file HTML asli (`design/original.html`) — 1355 kotoba,
   613 kanji, 81 bunpo, 104 hiragana, 126 katakana. Sementara memakai placeholder (skema sama),
   tinggal replace `src/data/*.js` tanpa ubah komponen.
2. **Kartu/Ulangi**: tetap SRS 4 tombol — Lupa · Berat · OK · Mudah (restyled ala asli).
   **Sprint**: pola asli (20 kartu + stopwatch) dengan Belum/Sudah hafal → grade `again`/`good`.
3. **Kuis & Ujian murni latihan** — salah TIDAK mengubah SRS (tidak masuk Ulangi).

## Storage (lokal)
- Key `hafalan-jft-a2-progress-v2`: `{ perMaterial, prefs, updated }`.
- `prefs`: `{ darkMode, showRomaji, direction, }` + `lessons` per materi (filter pelajaran).
- Migrasi dari v1 (`hafalan-jft-a2-progress-v1`): id numerik → `String(id)`,
  mastered → kartu interval 21, review → kartu learning due-now.
- Catatan: progres v2 lama ber-id `'h-1'` (placeholder) tidak terpetakan ke id numerik —
  app belum dirilis, diabaikan.

## Langkah
0. Simpan plan ini (file ini).
1. Parse `design/original.html` → generate `src/data/*.js` (PENDING file dari user).
2. `index.html`: Google Fonts (Shippori Mincho B1, Zen Maru Gothic, Inter, JetBrains Mono)
   + snippet anti-flash dark mode.
3. `lib/kana.js` (kanaToRomaji), `lib/tts.js` (speak ja-JP + deteksi dukungan).
4. `lib/storage.js`: prefs + perbaikan migrasi v1.
5. `styles/index.css`: port desain asli — token navy/washi/shu/kin/moss, stat chips,
   materi/mode bar + badge, controls (arah/romaji/chips/apply), kartu 3:4 flip 3D + genkou
   + hanko + speak, grade SRS, kuis, sprint meta, ujian intro/scene/summary, daftar + search
   + expand, kana-grid referensi, banner, footer reset, `html.dark-mode`, responsive ≤420px,
   reduced-motion, focus-visible, print.
6. Komponen: Topbar, Bars, Controls (baru), Kartu, Kuis, Sprint, Ujian, DaftarHafal,
   Referensi; hapus ProgressPanel.
7. `App.jsx`: prefs + lessons + deckVersion + banner + reset klik-dua-kali.
8. Verifikasi: `npm run build` + uji kanaToRomaji + migrasi.
9. Commit + push ke github.com/amirudinR/jfta2.

## Petunjuk swap data (saat file HTML asli sudah ada)
- Parse JSON di `<script id="vocab-data">` → tulis `src/data/{hiragana,katakana,kotoba,kanji,bunpo}.js`
  dengan id numerik-string per materi, field: `id, front, frontSub, backShort, backFull,
  group, groupLabel` (+ `reading` utk kanji/bunpo).
- Verifikasi jumlah: 104 / 126 / 1355 / 613 / 81.
