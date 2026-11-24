# Video TikTok — Fajrezzz AI Office (2K 120fps, gaya terminal)

Reklame 30 detik untuk web **fajrezzz-ai-office.vercel.app** (kantor virtual 3D isometrik, 15 karyawan robot AI). Gaya visual: layar gelap + font monospace + teks diketik + centang per langkah + progress bar, **tanpa memakai logo resmi Claude/Anthropic**.

| Keluaran | File | Spesifikasi |
|---|---|---|
| Master | `fajrezzz-office-tiktok-master-2k120.mp4` | 1440×2560 · **120 fps** · H.264 High level 6.0 CBR · **25,4 Mbps** · 3600 frame · 30,0 s · audio AAC 48 kHz |
| Versi TikTok | `fajrezzz-office-tiktok-1080p60.mp4` | 1080×1920 · **60 fps** · 12,0 Mbps · 30,0 s |
| Caption + hashtag | `caption.md` | siap tempel |
| Laporan | `report.json` / `report.md` | hasil `ffprobe`, bukan angka manual |

> Master 90,8 MB **tidak di-commit** ke git (batas ukuran repo); dibuat ulang kapan saja dengan `npm run video:office-tiktok`. Versi 1080p60 (43 MB) yang di-commit dan sudah diunggah ke Drive.

## Struktur 30 detik

| Waktu | Bagian | Isi |
|---|---|---|
| 0,0–2,0 | Hook | ketik `> aku bikin kantor AI 3D...` + `100% GRATIS`, lalu judul **VIDEO INI JUGA DIBUAT AI** |
| 2,0–6,0 | Terminal | `> membuka fajrezzz-ai-office.vercel.app` → ✓ loaded → `> mulai merekam web ...` + progress bar & checklist |
| 6,0–16,0 | Web | 5 potongan × 2 s tangkapan layar asli: 3 lantai, Crown Sky Deck, agent + 7 divisi, lantai kerja, gedung malam |
| 16,0–21,0 | Stack | Gemini ✓ · Groq ✓ · OpenRouter ✓ · Vercel ✓ → **BIAYA BULANAN Rp0** |
| 21,0–27,0 | Reveal | panel terminal (naskah → frame → teks/audio → export) + kartu web + teks “Naskah, visual, render — semuanya dikerjakan agen.” |
| 27,0–30,0 | CTA | “Mau tau cara bikinnya?” + **KOMEN “KANTOR”** |

Label **“dibuat dengan AI”** tampil permanen di kanan atas (aturan TikTok) dan diulang di CTA.

## Yang jujur harus disebut

- **Bagian “web” memakai tangkapan layar asli** aplikasi `fajrezzz-ai-office.vercel.app` (dari HP Bos, di-crop ke area aplikasi tanpa address bar). Tidak ada UI/angka/fitur yang digambar ulang.
- **Bukan rekaman gerak.** Sandbox ini tidak punya browser/GPU dan tidak bisa mengakses `*.vercel.app`, jadi **tidak ada screen recording 120fps**. Gerakan kamera (zoom, pan, punch-in, tilt) dibuat di post frame-per-frame 120fps — hasilnya mulus, tapi bukan gerak asli robot berjalan. Kalau Bos punya rekaman layar, tinggal ganti sumber di `assets/shots/office/` atau tempel klipnya.
- Narasi = **TTS Arena** (voice-00) di `assets/voice/office-tiktok/`. Kalimat “rekam sendiri” di brief **diubah** jadi “naskah, visual, render” karena merekam layar belum benar-benar dikerjakan agen — biar tidak memalsukan.
- Musik lo-fi/cyber, klik keyboard, dan whoosh **disintesis sendiri** (`scripts/office-video/audio.mjs`) — tanpa sampel/lagu pihak ketiga.
- Angka di video hanya yang benar: 3 lantai, 15 agent (tab “Tim 15”), 7 divisi, dan stack gratis (Gemini/Groq/OpenRouter/Vercel free tier).
- **Belum dipublikasikan**; menunggu persetujuan manual.

## Render ulang

```bash
# sekali jalan: frame 3600 + audio + mix + versi 1080p60 + verifikasi
FFMPEG_PATH=/path/ffmpeg FFPROBE_PATH=/path/ffprobe npm run video:office-tiktok

# hanya mix + versi 1080p60 (pakai frame master yang sudah ada)
node scripts/office-video/build.mjs --reuse

# cek satu frame tanpa render penuh
RENDER_AT=25.6 node scripts/office-video/render.mjs    # → .video-work/office-stills/
```

Butuh: `ffmpeg` dengan libx264, `ffprobe`, dan paket `@napi-rs/canvas` (devDependency). Font monospace: `assets/fonts/DejaVuSansMono*.ttf`.

## Berkas kode

| File | Isi |
|---|---|
| `scripts/office-video/render.mjs` | renderer 1440×2560 @120fps (terminal, kartu screenshot, transisi) → pipa ke x264 |
| `scripts/office-video/audio.mjs` | sintesis musik 96 BPM, klik keyboard, whoosh, blip → WAV 48 kHz |
| `scripts/office-video/build.mjs` | orkestrasi: render → audio → mix (VO+musik+SFX, loudnorm −14 LUFS) → 1080p60 → verifikasi |
| `scripts/office-video/verify.mjs` | `ffprobe` kedua file → `report.json` / `report.md` |
| `assets/shots/office/*.jpg` | tangkapan layar asli (sudah di-crop) |

Tes otomatis: `node --experimental-strip-types --test tests/office-tiktok-video.test.ts`.
