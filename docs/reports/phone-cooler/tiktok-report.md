# Video contoh — kenapa cooler HP bisa mengeluarkan air atau es

File: `docs/reports/phone-cooler/kenapa-cooler-hp-tiktok.mp4`
Dibuat: 2026-11-23T21:53:53.266Z

| Item | Nilai |
|---|---|
| Resolusi / fps | 1440×2560 · 30 fps |
| Codec | h264 (yuv420p) + aac |
| Durasi | 62.9 s |
| Bitrate / ukuran | 2532 kbps · 19 MB |
| Level audio | rata-rata -19 dB, puncak -1.5 dB |
| Decode | bersih |
| Cue subtitle | 23 |

## Timeline

| # | Scene | Mulai | Durasi | Narasi |
|---|---|---|---|---|
| 1 | hook | 0s | 8.63s | 8.09s |
| 2 | peltier | 8.63s | 11.73s | 11.18s |
| 3 | vapor | 20.37s | 11.4s | 10.85s |
| 4 | dewpoint | 31.77s | 12.7s | 12.14s |
| 5 | ice | 44.47s | 4.8s | 4.25s |
| 6 | power | 49.27s | 6.47s | 5.93s |
| 7 | outro | 55.73s | 7.17s | 6.62s |

## Yang harus dibaca sebelum menilai

- **Narasi.** Narasi = suara TTS yang dihasilkan di sesi ini (Arena voice), satu klip per scene; durasi scene diukur dari file audio, bukan diperkirakan.
- **Visual.** Visual digambar prosedural di Node (gradien, embun, kristal, partikel) lalu di-upscale ffmpeg; tidak memakai stok footage atau B-roll AI.
- **Audio.** Musik latar disintesis sendiri di Node (scripts/phone-cooler/music.ts, 84 BPM, progresi Am-F-C-G) lalu di-encode ke mp3 — bebas klaim lisensi pihak ketiga. Volume musik ±0,35 relatif suara, di-fade in/out.
- **Sumber.** Titik embun: rumus Magnus/Tetens (25°C/60% ≈ 16,7°C). Tetesan air: FAQ resmi ASUS AeroActive Cooler 6. Daya & sisi panas: datasheet TEC1-12706.