# Render MP4 v10 — cara membaca bukti

Folder ini berisi hasil render nyata (bukan mockup):

| File | Isi |
|---|---|
| `episode-1.mp4`, `episode-2.mp4`, `episode-3.mp4` | Video 1080×1920, 30 fps, H.264 + AAC, subtitle ter-burn |
| `episode-*.ass` | Naskah subtitle + timing kata yang dipakai renderer |
| `render-report.json` | Keluaran mentah `ffprobe` per episode + decode check + level audio |
| `render-report.md` | Ringkasan tabel metadata + daftar keterbatasan |
| `frames/*.png` | Frame sampel (1 s, ~35%, ~70%) untuk cek visual cepat |

## Batasan yang harus dibaca lebih dulu
1. **Belum ada suara narasi.** TTS butuh jaringan layanan suara; sandbox hanya boleh npm/github/pypi.
   Track audio = AAC senyap (terukur **-91 dB**), jadi subtitle belum bisa diklaim sinkron dengan suara.
2. **B-roll AI tidak dipakai.** Latar digenerate dari palet blueprint (gradasi + berkas aksen + grain).
3. **Belum ada publikasi otomatis.** Video menunggu persetujuan manual Bos.

## Cara render ulang
```bash
export FFMPEG_PATH=/path/ke/ffmpeg
export FFPROBE_PATH=/path/ke/ffprobe
npm run studio:render            # default 3 episode
```
Renderer menolak mengaku sukses: kalau metadata tidak sesuai target
(1080×1920, 30 fps, h264/yuv420p, decode bersih, > 10 s), proses keluar dengan kode 1.
