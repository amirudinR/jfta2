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
- **Nemonik Kanji** — belajar kanji A2 lewat gambar mnemonic (SRS terpisah, §11).
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

### 3.1 Peta repositori (lengkap)

```
jfta2/
├─ index.html               # HTML entry: #root, Google Fonts, anti-flash dark mode
├─ vite.config.js           # plugin React + manualChunks (vendor & data dipecah)
├─ firebase.json            # pointer ke firestore.rules (hosting diatur di Console)
├─ firestore.rules          # security rules per-user (users/{uid} saja)
├─ package.json             # scripts: dev / build / preview
├─ AGENT.md                 # ← dokumen ini
├─ PLAN.md                  # keputusan desain yang dikunci
│
├─ public/
│  ├─ favicon.svg
│  └─ nemonik/              # aset fitur Nemonik Kanji (§11) — disalin apa adanya ke dist/
│     ├─ data.json          # 361 kanji (655 KB) — sumber data nemonik
│     ├─ selesai_potong_opt/  # 361 webp — KARTU LENGKAP jadi (kanji+arti+kosakata)
│     ├─ kanji_nama_opt/      # 364 webp — ilustrasi mnemonic berwarna
│     └─ kanji_bersih_opt/    # 361 webp — kanji polos (background putih)
│
├─ scripts/                 # skrip utilitas node (bukan runtime app)
│  ├─ test-kana.mjs test-storage.mjs check-voice.mjs
│  ├─ clean-kanji.mjs renumber-kotoba.mjs
│
└─ src/
   ├─ main.jsx              # entry: createRoot → <App/> (import styles/index.css)
   ├─ App.jsx               # root: auth gate, level, mode routing, scroll memory
   │
   ├─ components/           # RENDERING murni (React)
   │  ├─ HafalanHarian.jsx  # layar Hafalan Harian (target + centang + pemilih hari)
   │  ├─ DaftarMateri.jsx   # daftar materi per level + pintu masuk Nemonik/KotobaLevel
   │  ├─ Kartu.jsx          # latihan SRS 4 tombol (Lupa/Berat/OK/Mudah)
   │  ├─ Kuis.jsx           # kuis murni latihan (tidak mengubah SRS)
   │  ├─ Sprint.jsx         # 20 kartu + stopwatch (Belum/Sudah hafal)
   │  ├─ UjianBaru.jsx      # ujian per level/kategori
   │  ├─ Recall.jsx         # antrian pengulangan item belum hafal
   │  ├─ Kemampuan.jsx      # statistik, heatmap, streak
   │  ├─ Referensi.jsx      # kana-grid referensi
   │  ├─ DaftarHafal.jsx    # daftar hafal (list + search + expand)
   │  ├─ KotobaLevel.jsx    # halaman standalone latihan kotoba N3/N2/N1
   │  ├─ Bars.jsx           # MaterialBar + ModeBar
   │  ├─ LevelStrip.jsx BottomNav.jsx Sidebar.jsx Topbar.jsx Controls.jsx
   │  ├─ LoginGate.jsx Profil.jsx GoogleIcon.jsx ReviewSalah.jsx
   │  ├─ hafalan/           # sub-komponen Hafalan Harian
   │  │  ├─ DayStrip.jsx    #   pemilih hari (Kemarin/Hari Ini/Besok + date picker)
   │  │  ├─ DetailModal.jsx #   modal detail item (role=dialog + focus trap)
   │  │  ├─ Kalender.jsx Heatmap.jsx SettingsPanel.jsx AddForm.jsx UjianHarian.jsx
   │  ├─ recall/            # RecallSetup / RecallSession / RecallSummary
   │  ├─ ujian/             # UjianSetup / UjianSession / UjianSummary
   │  ├─ nemonik/           # fitur Nemonik Kanji (§11)
   │  │  ├─ Nemonik.jsx         #   kontainer: fase dashboard|study|quiz
   │  │  ├─ NemonikDashboard.jsx#   statistik + 3 tombol masuk
   │  │  ├─ NemonikStudy.jsx    #   kartu 3-gambar + tombol Saya Tahu/Tidak Tahu
   │  │  └─ NemonikQuiz.jsx     #   kuis 10 soal (3 tipe soal)
   │  └─ ui/                # ProgressBar, ProgressRing, StatBox, StatsBar
   │
   ├─ hooks/                # STATE + EFEK React
   │  ├─ useHafalan.js      # state+aksi layar Hafalan Harian
   │  ├─ useAuth.js         # login Google + status user
   │  ├─ useCloudSync.js    # load/push progress ke Firestore (legacy progress/main)
   │  ├─ useLiveSync.js     # start/stop engine live-sync per-user
   │  └─ useAppSettings.js  # prefs aplikasi
   │
   ├─ lib/                  # LOGIKA MURNI (bisa dites tanpa React)
   │  ├─ hafalan-storage.js # storage & konstanta Hafalan Harian ★
   │  ├─ hafalan-items.js   # builder item & rotasi harian ★
   │  ├─ ujian-harian.js    # rekonstruksi item yang dicentang per tanggal
   │  ├─ srs.js             # SRS core Anki-style (again/hard/good/easy)
   │  ├─ quiz.js            # pembuat soal kuis
   │  ├─ stats.js recall-queue.js
   │  ├─ storage.js         # progres SRS (hafalan-jft-a2-progress-v2)
   │  ├─ history.js exam-history.js
   │  ├─ firebase.js        # init Firebase (config web publik)
   │  ├─ cloud-sync.js      # syncToCloud / loadFromCloud / mergeProgress
   │  ├─ live-sync.js       # engine live-sync (snapshot + push dirty)
   │  ├─ sync-registry.js   # daftar store yang disinkron + strategi merge ★
   │  ├─ sync-events.js     # pub/sub perubahan store (anti circular import)
   │  ├─ nemonik.js         # data/SRS/statistik Nemonik Kanji (§11)
   │  ├─ nav.js             # konstanta mode routing
   │  └─ ui.js tts.js kana.js fonts.js
   │
   ├─ data/                 # data materi (lihat §5)
   └─ styles/               # CSS per-area, diimpor lewat index.css
      ├─ index.css          #   entry @import semua file di bawah
      ├─ base.css           #   token warna & reset
      ├─ nemonik.css        #   style fitur Nemonik (§11)
      └─ … (topbar, bars, controls, kartu, quiz, list, kemampuan,
             hafalan, daftar-materi, level-ujian, sidebar, transitions,
             login-recall, mobile-extras, responsive)
```

**Prinsip pemisahan (WAJIB dijaga):** logika non-React masuk `src/lib/` (murni,
mudah diuji), state + efek masuk `src/hooks/`, rendering murni di `src/components/`.
Aset statis besar (gambar) taruh di `public/` — **jangan** diimpor sebagai module
agar tidak membebani bundle JS.

### 3.2 Konfigurasi build (`vite.config.js`)

`base: './'` (path relatif) + `build.rollupOptions.output.manualChunks` memecah
bundle: `vendor-react`, `vendor-firebase`, `vendor-icons`, `data-kotoba-n1/n2/n3`,
`data-mnemonic`, `data-core`. Tujuannya granularitas caching — **bukan** lazy-load
(semua tetap di-preload). `chunkSizeWarningLimit: 700`.

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
| `hh2-nemonik-srs` | SRS Nemonik Kanji `{ [no]: {status,nextReview,interval,ease} }` |
| `hh2-nemonik-streak` | streak belajar Nemonik (angka) |
| `hh2-nemonik-last-login` | tanggal login terakhir Nemonik (`YYYY-MM-DD`) |

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

> **Catatan:** data Nemonik Kanji **tidak** lewat `src/data/` — ia memakai
> `public/nemonik/data.json` sendiri dengan skema berbeda (lihat §11).

Target harian default per level ada di `DEFAULT_TARGETS` (`lib/hafalan-storage.js`):
A2 `50/25/5`, N3 `40/20/5`, N2 `40/25/6`, N1 `45/30/6` (kotoba/kanji/bunpou),
bisa diubah user lewat `SettingsPanel`.

---

## 6. Navigasi

- `lib/nav.js` memuat **semua konstanta mode** — sumber kebenaran routing:
  `LATIHAN_TAB_MODES`, `PERMATERI_MODES`, `HIDE_LEVEL_STRIP_MODES`,
  `CONTROL_MODES`, `KOTOBA_MODES`.
- `App.jsx` `changeMode(key)` mengatur `mode` + mengingat posisi scroll per halaman
  (`sessionStorage` key `hh:scroll:*`). Daftar mode: `harian`, `materi`, `kartu`,
  `kuis`, `ulangi`, `sprint`, `ujian-baru`, `recall`, `daftar`, `kemampuan`,
  `referensi`, `kotoba-n3/n2/n1`, `nemonik`, `profil`.

### Dua konsep yang WAJIB dipisah (jangan dicampur)
1. **Level aktif** (`level`: `a2|n3|n2|n1`) — diubah `LevelStrip` lewat
   `handleLevelChange`. Dikonsumsi `HafalanHarian`, `DaftarMateri`, `UjianBaru`,
   `Recall`. **Ganti level TIDAK boleh mengubah `mode`/halaman.** Kalau di
   `harian`, tetap `harian` — hanya datanya berganti.
2. **Mode halaman** (`mode`: `harian|materi|kartu|kotoba-n3|profil|…`) — navigasi.
   Hanya berubah lewat `changeMode()` (BottomNav/Sidebar/ModeBar/aksi eksplisit).

`HafalanHarian` menerima prop `level`; hook `useHafalan` memuat ulang data tiap
`activeMode` (= level) berubah, jadi target/progress ikut level baru **tanpa refresh**.
`pageKey` mengunci scroll `harian:${level}` per level.

Halaman standalone `KotobaLevel` (mode `kotoba-n3/n2/n1`) menyembunyikan
`LevelStrip`, jadi **hanya** dibuka sengaja via `openKotobaLevel()` (tombol di
`DaftarMateri`) dan **selalu** punya tombol "Kembali" (`onBack`). **Jangan**
mengarahkan ke sana sebagai efek samping ganti level — itu bug lama yang membuat
user terjebak tanpa switcher.

Halaman standalone `Nemonik` (mode `nemonik`, §11) juga menyembunyikan
`LevelStrip`; dibuka via tombol di `DaftarMateri` (hanya level A2) atau menu
`Sidebar`, dan selalu punya tombol kembali (`onBack` → `materi`).

- `BottomNav` punya 5 tab: Harian · Latihan · Ujian · Recall · Profil.
  Mode `nemonik` dihitung "aktif di tab Latihan" agar konteks navigasi tetap jelas.
- `Sidebar` memuat daftar menu lengkap (termasuk `Nemonik Kanji`).

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
- **Kontrak merge (KRUSIAL):** `store.merge(local, cloud)` dipanggil `live-sync.js`
  dengan `local = { data, updated }` & `cloud = { data, updated }`, dan **WAJIB**
  mengembalikan `{ data, updated }` — live-sync membaca hasilnya via `.data`.
  Gunakan helper `unwrap`/`wrap` di `sync-registry.js`. Mengembalikan bentuk mentah
  (mis. `{ kotoba, kanji }`) akan merusak kontrak → data tertimpa `undefined`.
- Menambah store baru yang disinkron: daftarkan di `sync-registry.js` **dan**
  pastikan bentuk dokumen lolos `validHh()` di rules. Contoh terbaru: store
  `hh2-nemonik-*` (§11).

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
- **Nemonik: jangan crop gambar.** Pakai `width:100%; height:auto; object-fit:contain`.
  `max-height`/`min-height` tetap menyebabkan gambar terpotong (bug lama).
- **Nemonik: jangan generate ulang teks.** Semua info ada di gambar `selesai_potong`.
- **Nemonik: SRS terpisah** dari SRS utama A2 — jangan disatukan paksa.
- **Nemonik: `img_kanji_nama` boleh null** — selalu sediakan fallback.
- **Nemonik: path aset relatif** dari `public/nemonik/`; `base: './'` di Vite.

---

## 11. Fitur Nemonik Kanji

Halaman belajar kanji **berbasis gambar** (mnemonic visual), di-port dari aplikasi
mandiri HTML/CSS/JS lama ke React. Pintu masuk: tombol di **`DaftarMateri`** (hanya
saat level `a2`) + menu **`Nemonik Kanji`** di `Sidebar`.

### Struktur file
- Aset: `public/nemonik/` — `data.json` (361 kanji) + 3 folder webp (§3.1).
  Path di `data.json` **relatif** (mis. `selesai_potong_opt/001_字_ジ_Karakter.webp`).
- Logika: `src/lib/nemonik.js` — `loadNemonik`, `imgUrl`, `getNemonikSrs`,
  `ensureSrs`, `gradeNemonik`, `penalizeNemonik`, `nemonikStats`,
  `checkNemonikStreak`, `getNemonikStreak`.
- Komponen: `src/components/nemonik/{Nemonik,NemonikDashboard,NemonikStudy,NemonikQuiz}.jsx`.
- Style: `src/styles/nemonik.css` (diimpor di `styles/index.css`).

### Bentuk entri `data.json`
`{ no, kanji, arti, baca_utama, onyomi, kunyomi, kosakata_onyomi[], kosakata_kunyomi[],
img_selesai_potong, img_kanji_nama, img_kanji_bersih }`.

### Tiga gambar per kanji (PENTING)
| Field | Folder | Isi |
|---|---|---|
| `img_kanji_bersih` | `kanji_bersih_opt/` | kanji polos (background putih) — rasio 1:1 |
| `img_kanji_nama` | `kanji_nama_opt/` | ilustrasi mnemonic berwarna — rasio 1:1 |
| `img_selesai_potong` | `selesai_potong_opt/` | **KARTU LENGKAP** (kanji+arti+onyomi+kunyomi+kosakata) dalam SATU gambar — rasio ~1.65 |

**Aturan tampilan kartu (jangan diubah tanpa alasan):**
- Baris atas: `kanji_bersih` (kiri) + `kanji_nama` (kanan) **side-by-side**.
- Baris bawah: `selesai_potong` **full-width**, ditampilkan **apa adanya sebagai `<img>`**.
- **JANGAN** men-generate ulang teks arti/onyomi/kunyomi/kosakata di React — semua
  info sudah ada di gambar `selesai_potong`.
- Gambar **WAJIB utuh** (tidak terpotong): pakai `width:100%; height:auto;
  object-fit:contain`. **JANGAN** pakai `max-height`/`min-height` tetap yang memaksa
  crop (pernah jadi bug: teks mnemonic terpotong).
- Tombol aksi di paling bawah: **"Saya Tidak Tahu"** (rating 1) / **"Saya Tahu"** (rating 3).
- Beberapa entri **tidak punya** `img_kanji_nama` (mis. kanji 漢) → tampilkan
  fallback "Mnemonic tidak tersedia", jangan crash.

### SRS Nemonik (TERPISAH dari SRS utama A2)
Model data berbeda: `{ status: 'baru'|'belajar'|'hafal'|'ulang', nextReview, interval, ease }`
(vs SRS utama `{ reps, ease, interval, due, lapses }`). **Sengaja tidak dijembatani.**
- Rating: `1` Lupa → `ulang` (interval 1, ease −0.2) · `2` Sulit → `belajar`
  (interval ×1.2, ease −0.15) · `3` Tahu → `hafal` (interval ×ease, ease +0.15).
- Salah saat kuis → `penalizeNemonik` (hanya bila status `hafal`/`belajar`).

### Sync
Store `hh2-nemonik-srs`, `hh2-nemonik-streak`, `hh2-nemonik-last-login` didaftarkan
di `sync-registry.js` dengan merge `lww` → path `users/{uid}/hh/nemonik-*`.
Prefix `hh2-` membuatnya ikut terhapus oleh `resetDailyProgress()`.

### Catatan operasional
- `loadNemonik()` mem-fetch `nemonik/data.json` **sekali** lalu di-cache in-module
  (promise gagal di-reset agar bisa retry).
- Aset gambar 1.086 webp (~25,5 MB) **ikut git** (disetujui). Hindari mengganti-ganti
  aset karena riwayat git bersifat permanen.

---

## 12. Riwayat Perubahan Penting

Catat di sini perubahan arsitektural/behavioral besar agar agen berikutnya tahu
"mengapa" sesuatu seperti sekarang.

### Aug 2026 — Perbaikan bug sync & stabilitas
- **`sync-registry.js` — kontrak merge diperbaiki.** Dulu `mergeCustom`/`mergeChecked`/
  `mergeDays` menerima/mengembalikan objek mentah, padahal `live-sync.js` memanggil
  `store.merge({data,updated},{data,updated})` dan membaca `.data` → item custom bisa
  tertimpa `undefined` (data hilang). Kini semua merge memakai helper `unwrap`/`wrap`
  dengan kontrak seragam `{ data, updated }`.
- **`live-sync.js` — guard `uid`.** `pushStore` menolak jalan bila `!running || !uid`
  (mencegah push ke path `users/null/...` saat logout di sela debounce).
- **`hafalan-storage.js` — `resetDailyProgress`** kini juga menghapus `ankichou-level`
  (key `hh2-*` sudah ikut via prefix) agar meta sync tidak stale setelah reset.
- **`hafalan-storage.js` — `computeStreak`** disamakan basis tanggalnya
  (`todayStr`/`addDays`) agar tidak beda 1 hari di sekitar tengah malam.

### Aug 2026 — Optimasi build
- **`vite.config.js` — manualChunks.** Vendor (react/firebase/icons) & data besar
  dipecah jadi chunk terpisah untuk caching. Total byte muat awal tidak berubah
  (bukan lazy-load).

### Aug 2026 — Fitur Nemonik Kanji
- Port app mandiri `nemonik/` → React. Aset dipindah ke `public/nemonik/`, folder
  `nemonik/` lama **dihapus**. Lihat §11.
- **Layout kartu diperbaiki** jadi 3 gambar: `kanji_bersih` (kiri) + `kanji_nama`
  (kanan) side-by-side, lalu `selesai_potong` full-width di bawah. Generate ulang
  teks (onyomi/kunyomi/kosakata) **dihapus** — semua info sudah ada di gambar.
- **Bug crop gambar diperbaiki:** hilangkan `max-height`/`min-height` tetap yang
  memotong gambar; ganti `width:100%; height:auto; object-fit:contain` agar gambar
  tampil utuh (bug: teks mnemonic "せいちょう" terpotong).
- Tombol aksi study jadi **"Saya Tidak Tahu" / "Saya Tahu"**.

---

## 13. Kontak & Referensi

- Repo: https://github.com/amirudinR/jfta2
- Desain & keputusan terkunci: lihat `PLAN.md`.
- Data asli diekstraksi dari `design/original.html` (dokumen internal). Jumlah entri
  saat ini: 104 hiragana · 126 katakana · 1355 kotoba A2 · 613 kanji · 81 bunpo ·
  1506 kotoba N3 · 2000 kotoba N2 · 2500 kotoba N1.
- Nemonik Kanji: **361 kanji** (`public/nemonik/data.json`) + 1.086 gambar webp
  (lihat §11).
- Memory sesi Serena: `.serena/memories/features/nemonik-kanji.md`.
