# Video — kenapa gua harus capek buat AI agent di Fajrezzz AI Office

File utama: **`kenapa-gua-capek-untuk-ai-agent.mp4`** (1440×2560 — 2K vertikal, 30 fps, H.264 + AAC, 83,93 s, 25,2 MB, 2.523 kbps).

Video ini bukan iklan produk, tapi **penjelasan kerja yang nggak kelihatan** di balik agent di repo ini. Semua yang disebut nyata dan bisa dibuka di kode:

| Disebut di video | Bukti di repo |
|---|---|
| tiga provider + fallback (Gemini/Groq/OpenRouter) | `src/lib/ai/*` (central AI router) |
| pembatas request: 20/menit endpoint mahal, 120/menit endpoint ringan | `src/lib/security/rate-limit.ts` + `src/middleware.ts` |
| blokir tulis lintas-situs | `src/middleware.ts` (`CROSS_ORIGIN_BLOCKED`) |
| kunci API nggak boleh hardcoded | `src/lib/security/secret-scan.ts`, dites di `tests/ai-resilience-v9.test.ts` |
| "nggak percaya kata selesai" — harus ada file, angka, tes | `scripts/phone-cooler/render.ts` (ffprobe + report) dan seluruh `tests/` |

## Alur 8 scene

| # | Scene | Visual | Mulai | Durasi |
|---|---|---|---|---|
| 1 | hook | grid kartu agent, satu disorot | 0 s | 9,34 s |
| 2 | chain | rantai keputusan 4 node + pulsa | 9,4 s | 11,37 s |
| 3 | keys | brankas kunci API + 3 kartu kunci | 20,77 s | 11,96 s |
| 4 | cost | meter kuota + garis ambang + rincian | 32,73 s | 9,34 s |
| 5 | fallback | node gagal (oranye) → jalur cadangan (hijau) | 42,07 s | 11,77 s |
| 6 | verify | jendela terminal, baris + centang + progres | 53,83 s | 9,44 s |
| 7 | why | grid agent, satu kartu tetap menyala | 63,3 s | 9,97 s |
| 8 | outro | cincin mengembang + kesimpulan | 73,27 s | 10,66 s |

Durasi tiap scene diambil dari **durasi file narasi hasil ukur ffprobe** (ditambah jeda 0,55 s), jadi subtitle dan visual mengikuti suara.

## Yang jujur harus disebut

- **Narasi = suara TTS** (Arena voice, satu klip per scene di `assets/voice/agent-office/`). Bukan rekaman manusia.
- **Visual = prosedural.** Semua gambar digambar per frame di Node (`scripts/phone-cooler/visuals.ts`) di kanvas 1440×2560 — 2K asli, bukan upscale. Tidak ada stok footage/B-roll AI.
- **Tanpa musik latar** (sama seperti seri panjang; hanya whoosh tipis di potongan scene).
- **Angka di laporan** (resolusi, bitrate, level audio, timeline) dibaca dari `ffprobe`, bukan diketik manual.
- **Belum dipublikasikan** ke platform mana pun; menunggu persetujuan manual.

## Cara render ulang

```bash
# butuh ffmpeg + ffprobe di mesin sendiri (tidak jalan di serverless Vercel)
FFMPEG_PATH=/path/ffmpeg FFPROBE_PATH=/path/ffprobe npm run video:agent

# varian 1080x1920
FFMPEG_PATH=/path/ffmpeg FFPROBE_PATH=/path/ffprobe npm run video:agent:1080

# cek visual per scene tanpa audio
FFMPEG_PATH=/path/ffmpeg npm run video:phone-cooler:stills -- --agent --at 0.75
```

Keluaran:

- `kenapa-gua-capek-untuk-ai-agent.mp4` — video final
- `kenapa-gua-capek-untuk-ai-agent.ass` — subtitle ter-burn (disimpan agar bisa diaudit)
- `agent-report.json` / `agent-report.md` — metadata ffprobe, level audio, timeline, catatan jujur
- `frames/frame-*.png` — frame sampel untuk pemeriksaan cepat

Tes: `node --experimental-strip-types --test tests/agent-video.test.ts` (resolusi ≥1080×1920 & rasio 9:16, audio bersuara tanpa clipping, 8 scene dengan padding 0,55 s, subtitle ada, dan sumber yang disebut harus merujuk kode repo).
