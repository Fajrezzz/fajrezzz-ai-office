# FAJREZZZ AI OFFICE

Fondasi aplikasi web **Cyberpunk 3D Virtual Office** interaktif yang dibangun menggunakan **Next.js, TypeScript, React Three Fiber, Three.js, dan Tailwind CSS**.

> **Catatan Transparansi Tahap 1:**  
> Tiga karakter robot di dalam kantor 3D (**NOVA-X**, **VEXA-9**, **KAIRO-7**) adalah **visual placeholder interaktif** dengan animasi prosedural (idle, kerja simulasi, berjalan mengikuti koridor). Tahap ini belum terhubung ke API AI nyata dan tidak mengklaim karakter placeholder sebagai agen AI aktif.

---

## Fitur Tahap Pertama

1. **Dashboard Utama**: Ringkasan metrik kantor (unit placeholder, progres task, okupansi workstation, status kesiapan integrasi) + viewport 3D interaktif + panel inspektor cepat.
2. **Virtual Office 3D Isometrik**:
   - Lantai kantor cyberpunk dark navy dengan grid & jalur neon electric blue / purple.
   - Arsitektur kaca futuristik transparan dengan bingkai LED neon.
   - 4 Workstation lengkap (meja cyber, PC tower, dual monitor menyala, keyboard, lampu meja, kursi ergonomis).
   - Dekorasi Holographic Command Hub (kristal wireframe & cincin data berputar), 2 Quantum Server Racks dengan LED berkedip, dan tanaman cyber bioluminescent.
3. **3 Karakter Robot AI (Placeholder Visual)**:
   - Geometri low-poly ringan tanpa unduhan aset berat.
   - Animasi **idle** (pernapasan & head-scan), **working** (simulasi mengetik di workstation), **walking** (ayunan kaki/tangan + pathfinding koridor BFS bebas tabrakan), dan **standby**.
   - Interaktif: klik robot atau meja di scene 3D untuk memilih dan mengarahkan pergerakan.
4. **Panel Agent Management**: Kontrol mode animasi, ubah workstation tugas, dan kirim robot ke zona tertentu (WS-01..WS-04, Holo Hub, Server Bay).
5. **Panel Task Manager**: Buat task baru, filter status (`Backlog`, `In Progress`, `Review`, `Done`), atur prioritas, tugaskan ke unit placeholder, dan hapus task.
6. **Panel Live Activity**: Aliran log simulasi real-time dengan filter kategori (`Robot Sim`, `Operator`, `System`), jeda/lanjut simulasi, dan reset log.
7. **Navigation Sidebar Responsif**: Sidebar desktop yang dapat diciutkan (*collapsible*), drawer slide-over mobile, serta bottom navigation bar ramah ibu jari untuk HP Android.

---

## Struktur Kantor 3 Lantai + Crown Sky Deck

Kantor 3D kembali ke **3 lantai** (L4 & L5 dihapus total), dengan atap fungsional di puncak L3:

| Lantai | Elevasi | Isi |
| --- | --- | --- |
| **L1 — Lobby & Coordination Hub** | `FLOOR_1_Y = 0.18` | Grand reception, hologram arrival portal, gym & arcade, kolam renang, parkir supercar |
| **L2 — Research, Script, Voice & QC** | `FLOOR_2_Y = 3.9` | 3 meja Research + 2 meja Script + **4 meja Voice/Subtitle/QC** (eks-lantai 5) + coffee bar & balkon |
| **L3 — Visual, Motion & Video Editing** | `FLOOR_3_Y = 7.8` | 3 meja Motion + **3 pod Editing/Render** (eks-lantai 4) + CEO suite, boardroom, lounge |
| **Atap — Crown Sky Deck** | `ROOF_Y = 11.8` | Helipad "H" + helikopter, lapangan badminton + 2 pemain, glass balustrade, neon signage, penthouse lift |

**15 karyawan tetap utuh** — semua dipindahkan ke L2 (9 meja) dan L3 (6 meja); tidak ada agen yatim
atau waypoint menggantung. Verifikasi otomatis: `tests/three-floor-layout.test.ts`
(cek lantai, kepemilikan meja, tabrakan meja, dan ketinggian atap).

---

## Optimasi Performa untuk HP Android

- **Low-Poly Procedural Geometry**: Seluruh furniture, arsitektur kaca, dan karakter robot dibuat dengan mesh low-poly ringan (tanpa file model eksternal berkapasitas besar).
- **Auto Android Eco Mode**: Secara otomatis mendeteksi viewport mobile / Android / CPU inti rendah untuk beralih ke mode **Eco** (`dpr: [1, 1.25]`, tanpa shadow map berat, antialias hemat GPU). Pengguna juga dapat mengganti mode (`Eco` / `Bal` / `High`) kapan saja lewat HUD 3D.
- **Tanpa Post-Processing Berat**: Efek neon cyberpunk dihasilkan menggunakan material emissive & translucent ring hemat GPU agar tetap halus di browser mobile.
- **Client-Only Dynamic Canvas**: Viewport 3D dimuat dengan `next/dynamic` (`ssr: false`) + deteksi WebGL & Error Boundary fallback.

---

## Arsitektur Siap Integrasi (Supabase & AI API)

Struktur proyek dipisahkan secara bersih agar siap dikembangkan ke Tahap 2 tanpa merombak fondasi:

```text
src/
├── app/
│   ├── api/
│   │   ├── health/route.ts         # Cek status mode simulasi vs integrasi
│   │   ├── agents/route.ts         # Endpoint server-side unit agent
│   │   └── tasks/route.ts          # Endpoint server-side task manager
│   ├── globals.css                 # Tema cyberpunk navy / electric blue / purple neon
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── layout/                     # Sidebar responsif & TopHeader
│   ├── dashboard/                  # Dashboard Utama, Agent Management, Task Manager, Live Activity
│   └── office3d/                   # VirtualOfficeCanvas, OfficeScene, OfficeArchitecture, WorkstationCluster, RobotCharacter, SceneControlsHUD
├── lib/
│   ├── config/env.ts               # Pemisahan ketat config publik vs secret server-only
│   ├── data/initial-office-data.ts # Koordinat 3D, waypoint graph BFS, data awal simulasi
│   └── services/
│       ├── data-adapter.ts         # Interface repository (OfficeDataAdapter)
│       ├── local-office-adapter.ts # Implementasi simulasi lokal Tahap 1
│       ├── supabase-adapter.ts     # Kerangka adapter Supabase Tahap 2
│       └── ai-orchestrator.ts      # Gateway server-only AI API (nonaktif di Tahap 1)
├── store/OfficeContext.tsx         # State management aplikasi & simulasi patroli
└── types/office.ts                 # Kontrak TypeScript utama
```

### Keamanan API Key

- **Tidak ada API key di frontend.** Key hanya dibaca di server (Route Handlers) dan tidak pernah dikirim ke browser.
- Variabel sensitif (`GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) **tidak boleh** memakai prefix `NEXT_PUBLIC_`.
- Error/log otomatis di-redaksi (`sanitizeErrorMessage`) supaya key tidak bocor ke telemetri.

### Penjaga API Publik (v11)

Semua `/api/*` bersifat publik, jadi `src/middleware.ts` memasang dua lapis pengaman:

- **Rate limit per IP**: endpoint mahal (AI, TTS, render, studio, pipeline) maks **20 request/menit**, endpoint ringan maks **120/menit**. Lewat batas → HTTP 429 + header `Retry-After`.
- **Blokir tulis lintas-situs**: POST/PUT/PATCH/DELETE dari situs lain lewat browser ditolak (403).
- `/api/sim-save` menolak payload > 500 KB atau yang bukan objek JSON.

> Keterbatasan jujur: penghitung disimpan di memori per instance serverless, jadi ini *best effort* untuk menahan spam/skrip sederhana, **bukan pengganti autentikasi**. Kalau aplikasi dibuka ke publik luas, tambahkan login operator (lihat Roadmap).

### Cara Memasang API Key Central AI Router (Gemini + Groq + OpenRouter)

Ringkasnya (tutorial lengkap: **[`docs/API-KEY-ROUTER.md`](docs/API-KEY-ROUTER.md)**):

1. Ambil key gratis: <https://aistudio.google.com/apikey> · <https://console.groq.com/keys> · <https://openrouter.ai/keys>
2. Vercel → Project → **Settings → Environment Variables** → tambahkan `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY` (centang Production + Preview + Development).
3. **Redeploy** project (env baru hanya aktif di deployment baru).
4. Verifikasi: buka `/api/ai/status` atau panel **AI Router** → tombol **Tes Live Provider**.

Lokal: `cp .env.example .env.local`, isi key, lalu `npm run dev`.
Tanpa API key, fitur AI **berhenti dengan pesan jelas** (`NO_PROVIDER_CONFIGURED`) — tidak ada fallback keyless; pasang key di Vercel Environment Variables.

### Kualitas Visual & FPS (Target 120 FPS)

- Target render **120 FPS** (panel POCO X8 Pro Max 120 Hz); angka **Aktual** di UI selalu hasil pengukuran frame time nyata, bukan target.
- Pixel ratio tidak pernah di bawah **1.0x** (tidak ada upscaling blur), anti-aliasing selalu aktif, tekstur memakai mipmap trilinear + anisotropic filtering.
- Detail penyebab & perubahan: **[`docs/VISUAL-QUALITY-FPS.md`](docs/VISUAL-QUALITY-FPS.md)**.

---

## Cara Menjalankan Project

### Prasyarat

- **Node.js** versi 20+ (direkomendasikan Node 22 LTS)
- **npm** versi 10+

### 1. Instalasi Dependensi

```bash
npm install
```

### 2. Jalankan Mode Development

```bash
npm run dev
```

Buka browser dan akses:

```text
http://localhost:3000
```

> Untuk menguji langsung dari HP Android dalam jaringan Wi-Fi lokal yang sama, buka `http://<IP-KOMPUTER-ANDA>:3000` (server dev sudah bind ke `0.0.0.0`).

### 3. Build Produksi & Typecheck

```bash
npm run lint
npm run typecheck
npm test          # termasuk test kebijakan render/ketajaman (v7) & penjaga API (v11)
npm run build
npm run start
```

---

CI GitHub Actions (`.github/workflows/ci.yml`) menjalankan lint, typecheck, test, dan build otomatis di setiap push ke `main` dan setiap pull request.

## Video Contoh (Pipeline Render di Repo)

Repo ini menyimpan pipeline video vertikal yang **benar-benar dirender di sini**, bukan storyboard atau mockup. Semua angkanya dibaca dari file hasil render, bukan diketik manual.

| Berkas | Isi |
|---|---|
| `scripts/phone-cooler/scenes.ts` | naskah 10 scene seri sains (cooler HP) + data audio narasi |
| `scripts/phone-cooler/scenes-tiktok.ts` | naskah 7 scene cut TikTok (layout aman UI TikTok) |
| `scripts/phone-cooler/scenes-agent.ts` | naskah 8 scene "kenapa gua harus capek buat AI agent" (di balik layar Fajrezzz AI Office) |
| `scripts/phone-cooler/visuals.ts` | renderer visual prosedural (embun, bunga es, termometer, kartu agent, rantai keputusan, brankas kunci, meter kuota, terminal) — kanvas supersample 1440×2560 |
| `scripts/phone-cooler/render.ts` | timeline dari durasi audio, teks beranimasi, subtitle ter-burn, mix musik, verifikasi `ffprobe` |
| `scripts/phone-cooler/music.ts` | sintesis musik latar sendiri (tanpa sampel pihak ketiga) |
| `docs/reports/phone-cooler/` | MP4 seri sains (**1440×2560 / 2K vertikal**), subtitle `.ass`, `render-report.json` & `tiktok-report.json`, README rinci |
| `docs/reports/agent-office/` | MP4 "kenapa gua harus capek buat AI agent" (2K) + `agent-report.json` |
| `scripts/office-video/` | pipeline TikTok gaya terminal untuk web office: renderer 2K **120 fps**, musik + SFX sintesis, mix VO, build 1080p60, verifikasi `ffprobe` |
| `docs/reports/office-tiktok/` | video TikTok 30 s (**1440×2560 @120 fps** master + **1080×1920 @60 fps**), caption, laporan |

```bash
# butuh ffmpeg + ffprobe di mesin sendiri (tidak jalan di serverless Vercel)
FFMPEG_PATH=/path/ffmpeg FFPROBE_PATH=/path/ffprobe npm run video:phone-cooler   # 1440x2560
FFMPEG_PATH=/path/ffmpeg FFPROBE_PATH=/path/ffprobe npm run video:tiktok         # cut 62,9 s + musik
FFMPEG_PATH=/path/ffmpeg FFPROBE_PATH=/path/ffprobe npm run video:agent           # video AI agent
npm run video:phone-cooler:1080   # varian 1080x1920 (FHD) dari naskah yang sama
FFMPEG_PATH=/path/ffmpeg FFPROBE_PATH=/path/ffprobe npm run video:office-tiktok  # TikTok office 2K/120fps + 1080p60
```

Detail alur, sumber klaim, dan batasan (narasi TTS, visual prosedural, musik disintesis, publikasi masih manual) ada di [`docs/reports/phone-cooler/README.md`](docs/reports/phone-cooler/README.md) dan [`docs/reports/agent-office/README.md`](docs/reports/agent-office/README.md), plus [`docs/reports/office-tiktok/README.md`](docs/reports/office-tiktok/README.md) untuk video TikTok office (sumber visual = tangkapan layar asli, gerakan kamera dibuat di post).

## Roadmap Tahap Selanjutnya

- [ ] Hubungkan `SupabaseOfficeAdapter` ke database PostgreSQL & Supabase Realtime.
- [ ] Implementasikan autentikasi operator dengan Supabase Auth & Row Level Security (RLS).
- [ ] Aktifkan `ai-orchestrator.ts` di sisi server (Next.js Route Handlers) untuk menghubungkan slot model agent ke penyedia AI API secara aman.
