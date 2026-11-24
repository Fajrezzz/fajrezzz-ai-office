# Video — kenapa gua harus capek buat AI agent di Fajrezzz AI Office

File: `docs/reports/agent-office/kenapa-gua-capek-untuk-ai-agent.mp4`
Dibuat: 2026-11-24T03:22:07.571Z

| Item | Nilai |
|---|---|
| Resolusi / fps | 1440×2560 · 30 fps |
| Codec | h264 (yuv420p) + aac |
| Durasi | 83.93 s |
| Bitrate / ukuran | 2523 kbps · 25.2 MB |
| Level audio | rata-rata -19.7 dB, puncak -1.5 dB |
| Decode | bersih |
| Cue subtitle | 27 |

## Timeline

| # | Scene | Mulai | Durasi | Narasi |
|---|---|---|---|---|
| 1 | hook | 0s | 9.4s | 8.86s |
| 2 | chain | 9.4s | 11.37s | 10.82s |
| 3 | keys | 20.77s | 11.97s | 11.42s |
| 4 | cost | 32.73s | 9.33s | 8.78s |
| 5 | fallback | 42.07s | 11.77s | 11.21s |
| 6 | verify | 53.83s | 9.47s | 8.9s |
| 7 | why | 63.3s | 9.97s | 9.41s |
| 8 | outro | 73.27s | 10.67s | 10.1s |

## Yang harus dibaca sebelum menilai

- **Narasi.** Narasi = suara TTS yang dihasilkan di sesi ini (Arena voice), satu klip per scene; durasi scene diukur dari file audio, bukan diperkirakan.
- **Visual.** Visual digambar prosedural di Node (grid kartu agent, rantai keputusan, brankas kunci, meter kuota, jendela verifikasi) di kanvas 2K; tidak memakai stok footage atau B-roll AI.
- **Audio.** Tanpa musik latar. Hanya narasi + whoosh tipis yang disintesis ffmpeg di setiap potongan.
- **Sumber.** Isi video merujuk ke repo ini sendiri: tiga provider + fallback (src/lib/ai), penjaga /api/* (src/middleware.ts — 20 req/menit endpoint mahal, 120/menit ringan, blokir tulis lintas-situs), secret scan (src/lib/security/secret-scan.ts), dan verifikasi render lewat ffprobe + report + tes.