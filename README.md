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
npm run typecheck
npm test          # termasuk test kebijakan render/ketajaman (v7)
npm run build
npm run start
```

---

## Roadmap Tahap Selanjutnya

- [ ] Hubungkan `SupabaseOfficeAdapter` ke database PostgreSQL & Supabase Realtime.
- [ ] Implementasikan autentikasi operator dengan Supabase Auth & Row Level Security (RLS).
- [ ] Aktifkan `ai-orchestrator.ts` di sisi server (Next.js Route Handlers) untuk menghubungkan slot model agent ke penyedia AI API secara aman.
