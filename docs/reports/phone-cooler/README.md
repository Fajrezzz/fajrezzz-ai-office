# Video contoh — kenapa cooler HP bisa mengeluarkan air atau es

File utama: **`kenapa-cooler-hp-keluarkan-air.mp4`** (1440×2560 — 2K vertikal, 30 fps, H.264 + AAC, 130,07 s, 37 MB, 2.388 kbps). Varian 1080×1920 tetap bisa dirender dari naskah yang sama.

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
- **Visual = prosedural.** Semua gambar (embun, bunga es, partikel panas, termometer) digambar per frame di Node (`scripts/phone-cooler/visuals.ts`) di kanvas supersample 1440×2560 — jadi 2K-nya asli, bukan hasil upscale. Tidak memakai stok footage, B-roll AI, atau aset berhak cipta.
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

Tes otomatis: `node --experimental-strip-types --test tests/phone-cooler-video.test.ts` (metadata, resolusi ≥1080×1920 & kanvas ≥2K, audio bersuara, timeline narasi, subtitle & sumber).

## Resolusi: 2K default, 1080 FHD opsional

| Mode | Perintah | Keluaran | Kanvas gambar |
|---|---|---|---|
| 2K (default) | `npm run video:phone-cooler` / `video:tiktok` | 1440×2560 | 1440×2560 (`VISUAL_SS=4`, gambar penuh tanpa upscale) |
| 1080 FHD | `npm run video:phone-cooler:1080` / `video:tiktok:1080` | 1080×1920 | 1080×1920 (`OUTPUT_WIDTH=1080 VISUAL_SS=3`) |
| Eksperimen | `OUTPUT_WIDTH=2160 VISUAL_SS=6 npm run video:tiktok` | 2160×3840 | 2160×3840 |

Cara kerjanya: naskah & visual memakai ruang desain 360×640, lalu digambar `VISUAL_SS` kali lebih rapat (`SS` di `visuals.ts`) dan teks/subtitle memakai `U = OUTPUT_WIDTH / 1080` sebagai faktor skala — jadi ukuran judul, label, teks bawah, dan posisi bar progres ikut menyesuaikan tanpa mengubah naskah. Batas bitrate akhir juga diskalakan (`8 MBit × U²`).

Biaya render 2K di mesin 2 core: TikTok 7 scene ±6 menit, versi panjang 10 scene ±12 menit (1080 ±2–3 menit). Semua angka di laporan tetap dibaca dari hasil `ffprobe`, bukan diketik manual.

## Cut TikTok (dengan musik latar)

File: **`kenapa-cooler-hp-tiktok.mp4`** — 1440×2560, 30 fps, 62,9 s, 19 MB, 2.532 kbps, 7 scene.

Bedanya dengan versi panjang:

- Naskah ditulis ulang jadi 7 kalimat utuh (bukan potongan), jadi tidak ada kalimat menggantung.
- **Musik latar disintesis sendiri** (`scripts/phone-cooler/music.ts`): 84 BPM, progresi Am–F–C–G, pad + bass + kick + hi-hat, lalu dikompresi dan di-encode ke mp3. Tidak memakai lagu pihak ketiga → aman dari klaim hak cipta TikTok.
- Musik ditaruh di bawah narasi (volume ±0,35 relatif suara, fade in/out) dan diukur ulang: di jeda antar scene ±−19…−21 dB, narasi ±−19 dB — jadi jeda tidak terasa kosong, tapi musik tidak menutupi suara.
- Subtitle dinaikkan sedikit supaya tidak menabrak UI TikTok di bawah.

Render ulang:

```bash
node --experimental-strip-types scripts/phone-cooler/music.ts   # menghasilkan WAV
ffmpeg -i assets/music/tiktok-bed.wav -c:a libmp3lame -b:a 192k assets/music/tiktok-bed.mp3
FFMPEG_PATH=/path/ffmpeg FFPROBE_PATH=/path/ffprobe npm run video:tiktok
# varian FHD: npm run video:tiktok:1080
```

## Struktur kode

| File | Isi |
|---|---|
| `scripts/phone-cooler/scenes.ts` | naskah per scene, judul/label, warna, jalur audio |
| `scripts/phone-cooler/visuals.ts` | renderer visual prosedural (gradien, embun, kristal, partikel, termometer) |
| `scripts/phone-cooler/render.ts` | timeline dari audio, encode per scene, teks beranimasi, subtitle, mix audio, verifikasi ffprobe |
| `scripts/phone-cooler/scenes-tiktok.ts` | naskah cut TikTok (7 scene, layout khusus UI TikTok) |
| `scripts/phone-cooler/music.ts` | sintesis musik latar (WAV 48 kHz) tanpa sampel pihak ketiga |
| `scripts/phone-cooler/stills.ts` | render still per scene untuk cek komposisi (`--tiktok` untuk cut TikTok, skala 2K) |
| `assets/fonts/` | Inter (SIL OFL, lisensi disertakan) untuk tipografi video |
