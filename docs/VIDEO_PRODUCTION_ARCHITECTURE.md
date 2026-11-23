# FAJREZZZ AI OFFICE — Advanced AI Skills & Cinematic Video Production Architecture

Dokumen ini menjelaskan hasil audit 11 repositori referensi, arsitektur modular produksi video vertikal **TikTok 9:16**, cara instalasi, konfigurasi Vercel vs Render Worker, guardrail hak cipta (`yt-dlp`), serta panduan pemeliharaan.

---

## 1. Hasil Audit 11 Repositori Referensi (Phase 1)

Semua repositori telah diaudit langsung (fungsi nyata, lisensi, bahasa, dependensi runtime, kompatibilitas Next.js 15 + React 19 + Vercel Serverless, risiko keamanan) sebelum memutuskan instalasi:

| # | Repositori | Versi / Tag | Lisensi | Kategori Keputusan | Alasan Teknis & Keamanan |
|---|---|---|---|---|---|
| 1 | `remotion-dev/remotion` | `4.0.546` | Remotion License | **Terpasang (`remotion`, `@remotion/player`)** | Kompatibel penuh dengan React 19.3 & Next.js 15 untuk komposisi video React 9:16 dan preview interaktif. `@remotion/renderer` (Chromium ~250MB) sengaja **tidak** dibundel ke Vercel Serverless Lambda. |
| 2 | `greensock/gsap-skills` + `gsap` | `3.15.1` | MIT (skills) / GSAP Standard No-Charge | **Terpasang (`gsap`) + Skill Aktif** | Semua plugin GSAP gratis; digunakan lewat `gsap.timeline({ paused: true })` deterministik untuk easing, stagger, parallax, dan light sweep tanpa drift waktu. |
| 3 | `FFmpeg/FFmpeg` | Native C CLI | LGPL / GPL | **Service Adapter Modular** | Tidak mungkin dijalankan sebagai library JS di Vercel Serverless. Disediakan `ffmpeg-adapter.ts` (`buildFfmpegExportArgs`, `parseFfprobeJson`) + runtime probe `/api/pipeline/capabilities`; di browser/Vercel memakai WebCodecs H.264 + `mp4-muxer`. |
| 4 | `ggml-org` (Organisasi) | — | MIT | **Audit Organisasi → Pilih `whisper.cpp`** | `ggml-org` adalah organisasi (bukan 1 paket). Proyek relevan: `whisper.cpp` (dipilih untuk adapter STT), sedangkan `llama.cpp` & `ggml` dicatat sebagai referensi (LLM berjalan via Groq/Gemini Rp 0 tanpa GPU lokal). |
| 5 | `ggml-org/whisper.cpp` | `v1.9.5` | MIT | **Service Adapter Modular** | Membutuhkan binary C++ `whisper-cli` + model GGML (~150MB–1.5GB). Disediakan `whisper-adapter.ts` untuk mem-parse output `-ojf` ke `WordTimingCue[]`; fallback otomatis ke syllable-weighted aligner saat `whisper-cli` belum terpasang. |
| 6 | `wyattblue/auto-editor` | `31.10.0` | Unlicense | **Engine TS Aktif + CLI Optional** | Binary Nim CLI tidak cocok untuk Serverless; algoritma deteksi sunyi RMS dB diimplementasikan langsung di TypeScript (`auto-editor-pacing.ts`) untuk memangkas jeda kosong audio sebelum penguncian timeline 0ms. |
| 7 | `yt-dlp/yt-dlp` | `2026.10.26` | Unlicense | **Referensi / Nonaktif (Policy Guard)** | **Dinonaktifkan secara ketat** di runtime produksi untuk kepatuhan hak cipta & ToS platform. Tidak pernah mengunduh atau memakai ulang video kreator lain tanpa izin eksplisit. |
| 8 | `vectorize-io/hindsight` | `v1.2.3` | MIT | **Adapter Opsional (Env-Var)** | Server Python eksternal. Diintegrasikan melalui `hindsight-memory.ts` hanya jika `HINDSIGHT_API_URL` dikonfigurasi; jika belum, sistem tetap aktif memakai memori persisten lokal tanpa memblokir produksi. |
| 9 | `obra/superpowers` | `v7.0.2` | MIT | **Skill Metodologi Agen** | Framework disiplin engineering (plan-first, TDD, verification-before-completion). Diterapkan ke alur agen tanpa menambah bloat npm. |
| 10 | `dietrichgebert/ponytail` | `v5.3.3` | MIT | **Skill Metodologi Agen** | Prinsip minimal diff, anti-over-engineering, dan modularitas kode. |
| 11 | `affaan-m/ecc` | `v2.2.3` | MIT | **Skill Metodologi Selektif** | Hanya mengadopsi praktik research-first & keamanan env/secret hygiene; seluruh harness/hooks eksternal sengaja tidak diimpor agar tidak bentrok dengan Next.js. |

---

## 2. Arsitektur Modular Pipeline Video (TikTok 9:16 Only)

Seluruh pipeline dipisahkan ke modul independen (tanpa file monolitik):

1. **Research & 5-Factor Topic Ranking** (`src/lib/ai/trend-intelligence.ts`, `src/app/api/agents/trend-intelligence/route.ts`)
   - Mengambil rilis resmi GitHub & diskusi komunitas segar, lalu memberi skor transparan 0–100 dari 5 faktor: **Kebaruan (25)**, **Relevansi AI Agent/Claude Code (25)**, **Potensi Menarik Perhatian (20)**, **Kualitas Sumber (15)**, **Kemudahan Demo Nyata (15)**.
   - Tidak pernah mengarang angka views atau klaim viral palsu.
2. **Modular AI Skill Registry & Capability Probe** (`src/lib/ai/advanced-skill-registry.ts`, `src/app/api/pipeline/capabilities/route.ts`)
   - Memeriksa paket & binary nyata di runtime (`remotion`, `gsap`, `mp4-muxer`, `ffmpeg`, `ffprobe`, `whisper-cli`, `auto-editor`, `yt-dlp`, `HINDSIGHT_API_URL`).
   - Skill yang belum terpasang ditandai jujur sebagai `worker-required`, `standby`, atau `inactive`.
3. **Remotion + GSAP Choreography** (`src/remotion/TikTokAiComposition.tsx`, `src/components/kids/RemotionTikTokPreview.tsx`, `src/lib/pipeline/gsap-timeline-choreographer.ts`)
   - Komposisi React 9:16 live melalui `@remotion/player` dan frame scrubbing GSAP deterministik (`gsap.timeline({ paused: true })`).
4. **Audio Pacing & 0ms-Sync Subtitles** (`src/lib/pipeline/auto-editor-pacing.ts`, `src/lib/pipeline/whisper-adapter.ts`, `src/lib/pipeline/video-engine-v3.ts`)
   - Pemangkasan dead-air RMS (-40 dB) sebelum penguncian durasi scene dan sinkronisasi kata-per-kata 0ms.
5. **Encoding & Metadata Validation** (`src/lib/pipeline/video-engine-v3.ts`, `src/lib/pipeline/ffmpeg-adapter.ts`)
   - Browser/Vercel: WebCodecs H.264/AAC MP4 via `mp4-muxer` dengan ladder kualitas jujur (`ULTRA 4K 2160×3840` → `2K 1440×2560` → `FHD 1080×1920`).
   - Worker/Lokal: FFmpeg CLI (`libx264`/`libx265` + `aac`) + validasi metadata aktual lewat `ffprobe` (`parseFfprobeJson`).
6. **Production Control Center** (`src/components/kids/ProductionDashboardPanel.tsx`)
   - Terintegrasi ke `KidsStudioPanel.tsx` dengan Research Queue, Stage Telemetry, Remotion Player, Live 11-Repo Skill Registry, Production History, dan Error Logs.

---

## 3. Instalasi & Konfigurasi Lingkungan

### Instalasi Lokal (Web App)
```bash
npm install
npm run typecheck
npm run lint
npm test
npm run build
```

### Environment Variables
- `GROQ_API_KEY` — Provider LLM utama Rp 0 (Production & Preview Vercel).
- `GEMINI_API_KEY` — Provider LLM pendamping Rp 0 (Production & Preview Vercel).
- `HINDSIGHT_API_URL` *(opsional)* — Endpoint server `vectorize-io/hindsight` untuk memori jangka panjang eksternal.
- `HINDSIGHT_API_KEY` *(opsional)* — Token autentikasi jika server Hindsight memerlukannya.

### Setup Opsional Dedicated Render Worker (Ubuntu/Debian Linux)
Untuk mengaktifkan encoding FFmpeg server-side dan transkripsi `whisper.cpp` lokal di luar Vercel Serverless:
```bash
# 1. FFmpeg + ffprobe
sudo apt-get update && sudo apt-get install -y ffmpeg

# 2. whisper.cpp (build C++ CLI + unduh model base/small)
git clone https://github.com/ggml-org/whisper.cpp.git
cd whisper.cpp && cmake -B build && cmake --build build -j
./models/download-ggml-model.sh base
# Pastikan binary `whisper-cli` tersedia di PATH
```
Setelah binary tersedia di worker, `GET /api/pipeline/capabilities` otomatis mendeteksi dan mengubah status skill dari `worker-required` menjadi `active`.

---

## 4. Guardrail Hak Cipta & Keamanan

- **Rahasia & Kredensial**: Tidak ada API key di kode sumber; seluruh kredensial dibaca dari environment variables.
- **`yt-dlp` Policy Guard**: Dinonaktifkan secara default (`inactive`). Jika diaktifkan pada worker khusus di masa depan, hanya boleh memproses aset berlisensi terbuka atau milik sendiri dengan persetujuan eksplisit.
- **Kejujuran Spesifikasi**: Sistem dilarang mengklaim 4K/120 FPS atau skor viral yang tidak benar-benar dihasilkan. Semua laporan QC harus berasal dari pengukuran aktual (`ActualVideoQcTelemetry` / `ffprobe`).

---

## 5. Gaya Visual `zine_glitch` (Look Signature Channel)

Gaya default renderer sekarang **`zine_glitch`** — hasil studi 7 frame referensi video
yang dikirim Bos (folder Drive `VIDEO AI`): kolase kertas + tipografi kinetik ekstrem.

| Elemen | Implementasi (`src/lib/pipeline/zine-style.ts`) |
|---|---|
| Latar | kertas krem (`#F1EBE0`) + fiber/grain bergerak, tanpa gradient UI |
| Tipografi | huruf kapital 900 (Helvetica/Inter-like), auto-fit ke lebar & tinggi band, slab hitam miring yang **menempel di teks** (boleh bleeding keluar frame) |
| Artwork | B-roll `/api/ai/scene-image` diperlakukan sebagai potongan kertas: kartu miring, border putih, duotone merah/amber, halftone |
| Tanpa B-roll | 4 varian panel kolase bergilir: ink blot merah, setengah lingkaran halftone, bola prisma RGB, strip diagonal + nomor scene |
| Aksen | RGB channel split (cyan/magenta) di awal/akhir scene, speed-lines ala manga saat cut, stiker bola prisma + chip `EP xx · nn/mm` |
| Ritme | band headline & band artwork bertukar posisi tiap scene; punch-in 1.10 → 1.0 + zoom drift 5,5% + tilt ±0,5° |
| Safe zone | blok teks dibatasi di dalam band aman TikTok 9:16 (0,10h–0,905h) |

Pemilihan gaya:
- Pipeline memakai `resolveVisualStyle()`; **tanpa instruksi eksplisit = `zine_glitch`**.
- Agen/prompt tetap bisa memaksa gaya lain lewat `Style: dark_ai_cinematic | cyberpunk_dev | …`.
- Preset baru `zine_glitch_editorial` (cut 1,9 s, FPS 60) dipilih otomatis untuk brief
  yang mengandung kata `zine`, `collage`, `glitch`, `kinetic`, atau `typography`.

Preview cepat tanpa browser (memakai `@napi-rs/canvas`):

```bash
npm run preview:zine -- "KANTOR AI INI KERJA SENDIRI"
# → .zine-preview/*.png (7 frame: hook, transisi, artwork, scene hitam, CTA)
```
