# Render MP4 v10 — bukti metadata

Dibuat: 2026-11-23T19:35:34.152Z

Toolchain: ffmpeg version n9.0.2-17-g2a571b6068-20260930 Copyright (c) 2000-2026 the FFmpeg developers · ffprobe version 4.0.2-static https://johnvansickle.com/ffmpeg/  Copyright (c) 2007-2018 the FFmpeg developers

| Ep | Judul | Ukuran | fps | Codec | Pixel | Audio | Durasi | Bitrate | Decode |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Supermoon 24 November 2026: kenapa bulan terli | 1080×1920 | 30 | h264 | yuv420p | aac | 43.9s | 1664 kbps | bersih |
| 2 | Pengangguran turun jadi 4,75 persen, tapi kena | 1080×1920 | 30 | h264 | yuv420p | aac | 53.5s | 1716 kbps | bersih |
| 3 | IPM Indonesia 76,59: angka ini sebenarnya meng | 1080×1920 | 30 | h264 | yuv420p | aac | 49.9s | 1747 kbps | bersih |

Validasi sesuai target (1080×1920, 30 fps, h264/yuv420p, decode bersih, > 10 s): **LULUS**

## Yang harus dibaca sebelum menilai

- **Audio senyap.** Track audio = AAC senyap (anullsrc). Narasi TTS TIDAK dibuat karena butuh jaringan layanan suara. (terukur: -91 dB / -91 dB / -91 dB mean volume, praktis senyap).
- **Subtitle.** Subtitle di-burn ke video (libass) memakai timing kata dari computeWordTimings, disinkronkan ke timeline naskah — bukan ke waveform suara karena belum ada narasi.
- **Aset visual.** Latar digenerate di Node dari palet blueprint (gradasi + berkas aksen + grain); B-roll AI tidak dipakai karena butuh API key.
- **Publikasi.** Tidak ada unggah/publikasi otomatis. Video menunggu persetujuan manual Bos.

Metadata mentah per episode ada di `render-report.json` (keluaran ffprobe, bukan rekaan).