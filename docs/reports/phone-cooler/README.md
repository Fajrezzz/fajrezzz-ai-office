# Video contoh — kenapa cooler HP bisa mengeluarkan air atau es

File utama: **`kenapa-cooler-hp-keluarkan-air.mp4`** (1080×1920, 30 fps, H.264 + AAC, 130,07 s, ±17 MB).

Ini video contoh yang benar-benar dirender (bukan storyboard): narasi suara asli, subtitle ter-burn, visual digambar per frame, dan metadata diverifikasi `ffprobe`. Angka di laporan tidak diketik manual — semuanya dibaca dari file hasil render (`render-report.json`).

## Alur video

| # | Scene | Durasi | Isi |
|---|---|---|---|
| 1 | hook | 9,5 s | HP + lempeng dingin, tetes air muncul; pertanyaan pembuka |
| 2 | peltier | 17,5 s | diagram chip Peltier: sisi panas (oranye) vs sisi dingin (sian), partikel panas dipompa naik |
| 3 | vapor | 13,7 s | uap air di udara menempel & berubah jadi tetes di pelat dingin |
| 4 | dewpoint | 18,2 s | termometer 30°C → 0°C, garis titik embun 17°C, tetes mulai jatuh setelah lewat garis |
| 5 | glass | 9,6 s | analogi gelas es teh berembun |
| 6 | ice | 15,1 s | bunga es hanya tumbuh kalau permukaan < 0°C |
| 7 | power | 16,0 s | heatsink + pelat panas; "30 W" = daya masuk, bukan panas yang dibuang |
| 8 | risk | 11,6 s | air merembes ke ventilasi & area kamera |
| 9 | tips | 9,8 s | tiga aturan pakai aman |
| 10 | outro | 9,2 s | kesimpulan + sumber |

Durasi tiap scene diambil dari **durasi file narasi hasil ukur ffprobe** (bukan estimasi kata), jadi subtitle dan visual mengikuti suara.

## Yang jujur harus disebut

- **Narasi = suara TTS**, dibuat di sesi ini lewat Arena voice (satu klip per scene di `assets/voice/phone-cooler/`). Bukan suara manusia, bukan hasil rekaman.
- **Visual = prosedural.** Semua gambar (embun, bunga es, partikel panas, termometer) digambar per frame di Node (`scripts/phone-cooler/visuals.ts`), lalu di-upscale ffmpeg ke 1080×1920. Tidak memakai stok footage, B-roll AI, atau aset berhak cipta.
- **Tanpa musik latar.** Hanya narasi + whoosh tipis yang disintesis ffmpeg di setiap potongan (`anoisesrc` + filter).
- **Tidak dipublikasikan otomatis.** File ini menunggu persetujuan manual sebelum diunggah ke platform mana pun.

## Sumber klaim

| Klaim di video | Sumber |
|---|---|
| Titik embun 25 °C / 60% RH ≈ 16,7 °C (dibulatkan "sekitar 17 derajat") | rumus Magnus/Tetens, dihitung di sesi ini; konsisten dengan perhitungan aplikasi pendingin termoelektrik |
| Tetesan air pada cooler peltier = kondensasi, diakui produsen sebagai fenomena normal | FAQ resmi ASUS AeroActive Cooler 6 — https://www.asus.com/support/faq/1048907/ |
| Watt di kemasan = daya listrik yang dikonsumsi, bukan panas yang dipindahkan; sisi panas wajib dibuang | datasheet TEC1-12706 (12 V / 6 A / 60 W, Qcmax ±50 W, ΔTmax ±60–68 °C) + pembahasan termoelektrik |
| Prinsip Peltier: arus DC memompa panas antar sisi | efek Peltier (1834), modul TEC |

## Cara render ulang

Butuh `ffmpeg` + `ffprobe` (tidak ada di serverless Vercel; render di mesin/CI yang punya ffmpeg).

```bash
FFMPEG_PATH=/path/ffmpeg FFPROBE_PATH=/path/ffprobe npm run video:phone-cooler
# opsi: --reuse-base  → pakai lagi video scene yang sudah ada (hanya render pass akhir)
```

Cek visual cepat tanpa audio:

```bash
FFMPEG_PATH=/path/ffmpeg npm run video:phone-cooler:stills -- --at 0.7
```

Keluaran:

- `kenapa-cooler-hp-keluarkan-air.mp4` — video final
- `kenapa-cooler-hp-keluarkan-air.ass` — subtitle (ter-burn, tetap disimpan agar bisa diaudit)
- `render-report.json` / `render-report.md` — metadata ffprobe, level audio, timeline
- `frames/frame-*.png` — 6 frame sampel untuk pemeriksaan cepat

Tes otomatis: `node --experimental-strip-types --test tests/phone-cooler-video.test.ts` (metadata, audio bersuara, timeline narasi, subtitle & sumber).

## Struktur kode

| File | Isi |
|---|---|
| `scripts/phone-cooler/scenes.ts` | naskah per scene, judul/label, warna, jalur audio |
| `scripts/phone-cooler/visuals.ts` | renderer visual prosedural (gradien, embun, kristal, partikel, termometer) |
| `scripts/phone-cooler/render.ts` | timeline dari audio, encode per scene, teks beranimasi, subtitle, mix audio, verifikasi ffprobe |
| `scripts/phone-cooler/stills.ts` | render still per scene untuk cek komposisi |
| `assets/fonts/` | Inter (SIL OFL, lisensi disertakan) untuk tipografi video |
