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

- **Tidak ada API key di frontend.**
- Salin `.env.example` menjadi `.env.local` saat mulai mengintegrasikan Supabase atau AI API di Tahap 2.
- Variabel sensitif (`SUPABASE_SERVICE_ROLE_KEY`, `AI_PROVIDER_API_KEY`) **tidak boleh** memakai prefix `NEXT_PUBLIC_` dan hanya dibaca pada sisi server (`src/lib/config/env.ts` & Route Handlers).

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
npm run build
npm run start
```

---

## Roadmap Tahap Selanjutnya

- [ ] Hubungkan `SupabaseOfficeAdapter` ke database PostgreSQL & Supabase Realtime.
- [ ] Implementasikan autentikasi operator dengan Supabase Auth & Row Level Security (RLS).
- [ ] Aktifkan `ai-orchestrator.ts` di sisi server (Next.js Route Handlers) untuk menghubungkan slot model agent ke penyedia AI API secara aman.
