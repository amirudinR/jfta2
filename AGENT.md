# AGENT.md — Panduan Kerja Agen untuk `jfta2` (暗記帳 / Ankichou)

Dokumen ini adalah panduan wajib untuk agen AI (maupun kontributor) yang bekerja
di repositori ini. Bacalah sebelum mengubah kode.

---

## 1. Ringkasan Proyek

**jfta2** adalah aplikasi web hafalan bahasa Jepang (JLPT A2–N1) berbahasa
Indonesia, dengan desain bergaya "buku catatan hafalan" (washi + genkou grid +
hanko merah, navy stage). Fitur utama:

- **Hafalan Harian** — target kotoba/kanji/bunpou per hari + centang hafal.
- **Latihan** — Kartu (SRS 4 tombol), Kuis, Ulangi, Sprint.
- **Ujian** — ujian per level/kategori + Ujian Harian dari riwayat centang.
- **Recall** — antrian pengulangan item yang belum hafal.
- **Kemampuan** — statistik, heatmap, streak.
- **Sync cloud** — progres per-user via Firebase (Auth + Firestore), offline-first.

Level aktif: `a2`, `n3`, `n2`, `n1` (hanya A2 yang punya kanji + bunpou).

---

## 2. Stack & Perintah

| Hal | Detail |
|---|---|
| Build tool | Vite 5 (`@vitejs/plugin-react`) |
| UI | React 18 (function components + hooks), tanpa TypeScript |
| Ikon | `lucide-react` |
| Backend | Firebase 12 (Auth Google + Firestore) |
| Gaya | CSS murni, dipecah per file di `src/styles/` (diimpor lewat `index.css`) |
| State | React lokal + `localStorage` (sumber utama) + Firestore (mirror) |

```bash
npm install        # pasang dependensi
npm run dev        # dev server Vite (default http://localhost:5173)
npm run build      # build produksi → dist/
npm run preview    # pratinjau hasil build
```

**Verifikasi wajib sebelum commit:** `npm run build` harus lolos tanpa error.
(Tidak ada linter/test otomatis di repo ini — jangan mengarang perintah `npm test`.)

---

## 3. Arsitektur & Peta Direktori

```
src/
  App.jsx                 # root: auth gate, level, mode routing, scroll memory
  main.jsx                # entry
  components/             # semua komponen React
    HafalanHarian.jsx     # layar Hafalan Harian (target + centang + pemilih hari)
    DaftarMateri.jsx      # daftar materi per level
    Kartu.jsx Kuis.jsx Sprint.jsx UjianBaru.jsx
    Recall.jsx Kemampuan.jsx Referensi.jsx DaftarHafal.jsx KotobaLevel.jsx
    Bars.jsx LevelStrip.jsx BottomNav.jsx Sidebar.jsx Topbar.jsx Controls.jsx
    LoginGate.jsx Profil.jsx
    hafalan/              # sub-komponen Hafalan Harian
      DayStrip.jsx        #   pemilih hari (Kemarin/Hari Ini/Besok + date picker)
      DetailModal.jsx SettingsPanel.jsx AddForm.jsx Heatmap.jsx UjianHarian.jsx
    recall/               # RecallSetup / RecallSession / RecallSummary
    ujian/                # UjianSetup / UjianSession / UjianSummary
    ui/                   # ProgressBar, ProgressRing, StatBox, StatsBar
  hooks/
    useHafalan.js         # state+aksi layar Hafalan Harian
    useAuth.js useCloudSync.js useLiveSync.js useAppSettings.js
  lib/                    # logika murni (bisa dites tanpa React)
    hafalan-storage.js    # storage & konstanta Hafalan Harian ★
    hafalan-items.js      # builder item & rotasi harian ★
    ujian-harian.js       # rekonstruksi item yang dicentang per tanggal
    srs.js quiz.js stats.js recall-queue.js
    storage.js history.js exam-history.js
    firebase.js cloud-sync.js live-sync.js sync-registry.js sync-events.js
    nav.js ui.js tts.js kana.js fonts.js
  data/                   # data materi (lihat §5)
  styles/                 # CSS per-area
```

**Prinsip pemisahan:** logika non-React masuk `src/lib/` (murni, mudah diuji),
state + efek masuk `src/hooks/`, rendering murni di `src/components/`.
Jaga pemisahan ini saat menambah fitur.

---

## 4. Model Data & Storage

### Kunci `localStorage` (prefix `hh2`)

| Kunci | Isi |
|---|---|
| `hh2-targets` | `{ [mode]: { kotoba, kanji, bunpou } }` target harian per level |
| `hh2-checked-{mode}` | `{ date, kotoba:{id:true}, kanji:{}, bunpou:{} }` centang **hari ini** |
| `hh2-hist-{mode}` | `{ 'YYYY-MM-DD': { kotoba, kanji, bunpou, done, items } }` riwayat |
| `hh2-custom-{mode}` | `{ kotoba:[], kanji:[], bunpou:[] }` item tambahan user |
| `hh2-mastered` | penanda hafal persisten lintas layar |
| `hh2-recall-queue` | antrian Recall |
| `ankichou-exam-history` | riwayat ujian |
| `hafalan-jft-a2-progress-v2` | progres SRS `{ perMaterial, prefs, updated }` |
| `ankichou-level` | level terakhir dipilih |

`mode` = salah satu dari `HAFALAN_MODES` (`a2`,`n3`,`n2`,`n1`) di `lib/hafalan-storage.js`.
Setiap mode punya 3 kategori sumber: `kotobaSrc`, `kanjiSrc`, `bunpouSrc` (semua
level kini lengkap — lihat §5).

### Item id
- Bawaan: `b-<idData>` (stabil terhadap indeks). Lihat `buildItems()`.
- Custom: `cc-<time36>-<seq>` (stabil, tidak bergeser saat item lain dihapus).

### Rotasi harian (penting)
`dailySlice(src, dayPage, count)` mengambil jendela `count` item mulai dari
`(dayPage*count) % len` — **modulo positif** agar `dayPage` negatif valid.
`dailySliceForDate(src, anchorDate, targetDate, count)` memakai
`diffDays(anchorDate, targetDate)` sebagai `dayPage`.
`anchorDate` = tanggal riwayat paling awal (atau hari ini bila belum ada),
sehingga tanggal kalender memetakan rotasi yang konsisten.

### Per-tanggal (fitur fleksibel)
- `getCheckedForDate(mode, date)` — hari ini → bucket live; selain itu → riwayat.
- `setCheckedForDate(mode, data)` — hari ini → live + `saveHistoryNow`; lainnya →
  tulis langsung ke `hh2-hist-{mode}` (boleh mengedit hari kemarin/besok).
- Tanggal **besok** sengaja boleh ditulis (mencicil).
- **Aturan backfill:** `isEditableDate(date)` membatasi mundur `MAX_BACKFILL_DAYS`
  (7) & maju `MAX_FORWARD_DAYS` (7). Guard ini dipanggil di `setCheckedForDate()`
  (layer storage) dan di `useHafalan` (`clampDate`) — jadi meski UI diakali, data
  di luar rentang tidak akan tersimpan. Streak (`computeStreak`) dihitung dari
  **tanggal asli**, bukan kapan dikerjakan, sehingga batas backfill mencegah
  "curang" mengisi semua tanggal jauh ke belakang.

### Bulk action (tandai/batal semua)
- `markAll(type)` / `uncheckAll(type)` di `useHafalan` — **dua langkah**: klik
  pertama set `confirmBulk='mark'|'clear'` (auto-reset 4 dtk), klik kedua eksekusi
  lewat `applyBulk()`. Tidak memakai `window.confirm`.

---

## 5. Data Materi (`src/data/`)

- `index.js` — menggabungkan semua sumber, menormalisasi (`id` → String), dan
  mengekspor `DATA`, `byMaterial(material)`, `groupListOf(entries)`.
- Material key:
  - kana: `hiragana`, `katakana`
  - kotoba: `kotoba` (A2), `kotoba-n3`, `kotoba-n2`, `kotoba-n1`
  - kanji: `kanji` (A2), `kanji-n3`, `kanji-n2`, `kanji-n1`
  - bunpo: `bunpo` (A2), `bunpo-n3`, `bunpo-n2`, `bunpo-n1`
- Bentuk entri: `{ id, front, frontSub, backShort, backFull, group, groupLabel,
  reading?, mnenonic?, material }`.
- `materials.js` — metadata material (`MATERIALS`, `MODES`, `materialOf`, `stampOf`).
  Material level (n3/n2/n1) diberi `standalone: true` agar tidak muncul di MaterialBar.
- Data ber-id numerik; **selalu bandingkan id sebagai String** (normalisasi di `index.js`).

### Status konten kanji/bunpo N3–N1
File `kanji-n3/n2/n1.js` & `bunpo-n3/n2/n1.js` sudah ada dengan **skema lengkap**
dan **konten SEED** (sebagian entri contoh) agar semua fitur jalan. Header tiap file
menandai `STATUS KONTEN: SEED / PENDING`. Untuk melengkapi: tambah/ganti entri
`E(...)` mengikuti skema A2 (`kanji.js` / `bunpo.js`) tanpa mengubah komponen.

Menambah materi baru: tambah entri `E(...)` di file level terkait (dengan `group`
numerik pelajaran), impor di `data/index.js`, dan daftarkan di `materials.js`
(bila standalone) + `HAFALAN_MODES` (bila jadi kategori hafalan harian).

Target harian default per level ada di `DEFAULT_TARGETS` (`lib/hafalan-storage.js`):
A2 `50/25/5`, N3 `40/20/5`, N2 `40/25/6`, N1 `45/30/6` (kotoba/kanji/bunpou),
bisa diubah user lewat `SettingsPanel`.

---

## 6. Navigasi

- `lib/nav.js` memuat **semua konstanta mode** — sumber kebenaran routing:
  `LATIHAN_TAB_MODES`, `PERMATERI_MODES`, `HIDE_LEVEL_STRIP_MODES`,
  `CONTROL_MODES`, `KOTOBA_MODES`.
- `App.jsx` `changeMode(key)` mengatur `mode` + mengingat posisi scroll per halaman
  (`sessionStorage` key `hh:scroll:*`).
- `LevelStrip` = satu-satunya pengubah level. Klik N3/N2/N1 membuka `KotobaLevel`.
- `BottomNav` punya 5 tab: Harian · Latihan · Ujian · Recall · Profil.
- `Sidebar` memuat daftar menu lengkap.

---

## 7. Sync Cloud (Firebase)

- Auth gate di `App.jsx`: **wajib login Google** sebelum masuk aplikasi.
- `lib/sync-registry.js` mendaftarkan setiap store `localStorage` yang disinkron
  ke `users/{uid}/hh/{...}` dengan strategi merge per-tipe
  (`lww`, `mergeChecked`, `mergeDays`, `mergeCustom`).
- Pola offline-first: tulis lokal dulu → publish event → engine live-sync kirim
  ke cloud bila online. **Jangan memblok UI untuk network.**
- `firestore.rules` membatasi tiap user hanya ke `users/{uid}` miliknya.
  Dokumen `hh/*` harus berbentuk `{ data, updated, syncedAt }`.
- Menambah store baru yang disinkron: daftarkan di `sync-registry.js` **dan**
  pastikan bentuk dokumen lolos `validHh()` di rules.

**Secret:** config Firebase ada di `src/lib/firebase.js` (kunci web publik —
aman di client). Jangan menambahkan secret server/service-account ke repo.

---

## 8. Konvensi Kode

- **Bahasa komentar**: Indonesia, ringkas, jelaskan *mengapa* bukan *apa*.
- **Penamaan**: komponen & tipe `PascalCase`; fungsi/variabel `camelCase`;
  konstanta `UPPER_SNAKE`. Label UI berbahasa Indonesia (+ aksen Jepang).
- **React**: function components, hooks. Hindari `setState` saat render;
  untuk transisi fase pakai `useEffect` (lihat `UjianHarian.jsx` sebagai contoh).
- **Aksesibilitas**: gunakan elemen semantik (`button`, `label`), sertakan
  `aria-label`/`aria-pressed` pada kontrol ikon, dan `role="dialog"` + focus trap
  pada modal (lihat `hafalan/DetailModal.jsx`).
- **Mobile-first**: uji layout ≤420px; hormati `env(safe-area-inset-bottom)`;
  sediakan `@media (prefers-reduced-motion)`.
- **Dark mode**: kelas `html.dark-mode`; gunakan token warna CSS
  (`var(--card-ink)`, `var(--kin)`, `var(--moss)`, `var(--panel-line)`, dst.),
  bukan warna hard-code baru.
- **Ikon**: hanya dari `lucide-react`.
- **Jangan menambah dependensi** tanpa alasan kuat; tanyakan dulu.

---

## 9. Alur Kerja Agen

1. **Eksplorasi dulu.** Baca `PLAN.md` dan file terkait sebelum mengedit.
   Gunakan pencarian simbol (`serena_*`) atau `grep`/`glob`.
2. **Rencanakan** perubahan multi-file dengan daftar todo.
3. **Ubah seminimal mungkin**, ikuti pola kode yang sudah ada.
4. **Verifikasi**: `npm run build` wajib lolos. Untuk logika murni
   (`dailySlice`, `srs`, `hafalan-storage`), uji cepat lewat node bila perlu.
5. **Commit** hanya jika diminta user. Pesan commit mengikuti gaya repo:
   `feat: ...`, `fix: ...`, `refactor: ...` (bahasa Indonesia, ringkas).
6. **Jangan** commit `node_modules/`, `dist/`, `*.log`, `.serena/`, `opencode.json`,
   `mcp_audit.db` (sudah ada di `.gitignore`).

### Cabang & deployment
- `master` = produksi. `origin/master` adalah branch utama.
- Untuk eksperimen/uji: gunakan branch `test` (`git checkout -b test`), lalu push.
- Deploy hosting via Firebase (`firebase.json` hanya konfigurasi Firestore rules;
  hosting diatur terpisah di Firebase Console).

---

## 10. Jebakan yang Sering Terjadi

- **Id numerik vs string** — selalu samakan tipe (`String(id)`) saat membanding/menyimpan.
- **Modulo negatif** — `-1 % 10` bernilai `-1` di JS; pakai modulo positif untuk rotasi.
- **Reset tengah malam** — `getChecked` memindahkan bucket hari lama ke riwayat
  saat tanggal berubah; jangan menimpa logika ini sembarangan.
- **Merge sync** — tipe data berbeda butuh strategi merge berbeda; salah pilih →
  progres hilang. Cek `sync-registry.js` sebelum menambah store.
- **Reset progres** — `resetDailyProgress()` (data harian) terpisah dari
  `resetProgress()` (SRS & prefs). Menghapus kunci `hh2-*` akan menghapus data harian.
- **Jangan pakai `window.confirm`** untuk aksi destruktif — pakai pola konfirmasi
  inline (klik dua kali), lihat `confirmDeleteKey` di `useHafalan.js`.
- **ErrorReference `uid`** pada path sync pernah jadi bug — path selalu fungsi dari `uid`.

---

## 11. Kontak & Referensi

- Repo: https://github.com/amirudinR/jfta2
- Desain & keputusan terkunci: lihat `PLAN.md`.
- Data asli diekstraksi dari `design/original.html` (dokumen internal). Jumlah entri
  saat ini: 104 hiragana · 126 katakana · 1355 kotoba A2 · 613 kanji · 81 bunpo ·
  1506 kotoba N3 · 2000 kotoba N2 · 2500 kotoba N1.
