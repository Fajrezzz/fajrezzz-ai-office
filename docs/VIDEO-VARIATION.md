# Variasi Visual per Episode (v9.2)

Keluhan Bos: **"hasil dari video itu selalu itu-itu aja, gua mau lu berfikir tiap video hasil beda"**.

Dulu `zine-style.ts` merender semua episode dengan urutan yang sama persis: kertas krem →
panel kolase 0,1,2,3 → slab hitam. Secara teknis "deterministik", tapi hasilnya terasa
seperti template: episode ke-31 dan episode ke-40 kelihatan sama di mata penonton.

Sekarang setiap episode punya **sidik jari visual** yang dihitung dari identitas episodenya.

## 1. Sumber variasi

`src/lib/pipeline/visual-variation.ts`

```ts
const v = buildVisualVariation(episode.title, episode.episodeNumber, episode.niche);
// { seed, paper, accent, layoutMode, typography, transition,
//   cardRotation, panelOffset, darkSceneEvery, label }
```

- `hashSeed()` = FNV‑1a 32‑bit (stabil, sama di browser & Node).
- Input: judul dinormalisasi + nomor episode + niche → `seed`.
- Semua pilihan diturunkan dari bit `seed` yang berbeda (`pick(list, seed, salt)`),
  jadi dua judul berbeda hampir tidak pernah jatuh ke kombinasi yang sama.

**Deterministik**: episode yang sama → look yang sama persis saat di-render ulang.
Ini penting supaya kalau ada yang perlu di-render ulang / QC, hasilnya identik.

## 2. Palette & sumbu variasi

| Sumbu | Nilai |
| --- | --- |
| `paper` | `cream` `#F1EBE0` · `newsprint` `#EDEDE6` · `bone` `#F6F1E7` · `charcoal` `#141416` (gelap) |
| `accent` | `vermilion` (merah/amber/biru) · `electric` (biru/merah/hijau) · `acid` (limau/hitam/hijau) · `sunset` (amber/merah/ungu) |
| `layoutMode` | `band_swap` · `full_bleed_art` · `stacked_cards` · `text_only` |
| `typography` | `slab` (blok tinta) · `outline` (stroke tebal) · `highlight` (satu baris berwarna aksen) |
| `transition` | `speedlines` · `flash` · `slice` (irisan tepi) · `page_wipe` (sapuan halaman) |
| `cardRotation` | −3.3°…+3.3° dari seed |
| `panelOffset` | 0–3, jadi panel kolase tidak selalu mulai dari panel 0 |
| `darkSceneEvery` | `0` (tidak ada scene gelap) atau `3` (tiap scene ke-3 dominan gelap) |

Aturan khusus: **episode kelipatan 5** memakai kertas `charcoal` penuh — episode "spesial"
yang kontras dengan episode lain di feed.

## 3. Rotasi di dalam satu episode

Supaya satu video pun tidak monoton, `layoutForScene()`, `typographyForScene()`, dan
`transitionForScene()` merotasi daftar dari titik awal milik episode:

```
episode look : stacked_cards / slab / flash
scene 1      : stacked_cards / slab / flash
scene 2      : text_only     / outline / slice
scene 3      : band_swap     / highlight / page_wipe
scene 4      : full_bleed_art/ slab / speedlines
```

Jadi 5 scene = 5 komposisi berbeda, tanpa keluar dari "bahasa visual" episode itu.

## 4. Tema turun sampai ke panel

`drawArtworkCard()` sekarang menerima `SceneTones` (kertas terang, tinta gelap, aksen
episode) sehingga panel kolase, duotone b‑roll, dan bayangan kartu ikut warna episode —
bukan selalu merah/amber bawaan.

Satu bug penting yang ikut diperbaiki: dulu blok jangkar `text_only` diwarnai **tinta**,
lalu headline juga diwarnai tinta → headline hitam di atas blok hitam (hilang sama sekali
di episode kertas gelap). Sekarang blok jangkar selalu warna aksen, jadi headline selalu
kontras, baik di kertas terang maupun `charcoal`.

## 5. Caption penjelas (video harus jelas untuk penonton awam)

Headline tetap `visualCue` 3–6 kata. Di bawahnya sekarang ada **caption** dari kalimat
narasi utuh (maks 3 baris, dibungkus tanpa memotong kata) dengan garis aksen pendek sebagai
penanda. Efeknya: penonton yang menonton tanpa suara tetap tahu konteks adegan — dan
adegan tidak lagi terasa seperti poster kosong dengan banyak ruang menganggur.

Caption dilewati otomatis kalau narasi sama dengan headline (tidak mengulang teks).

## 6. QC cepat tanpa render MP4

```bash
# 7 frame contoh untuk satu episode
npm run preview:zine -- "KANTOR AI INI KERJA SENDIRI TANPA MANUSIA"

# bandingkan dua episode berbeda
ZINE_EP=31 ZINE_OUT=.zine-preview/a npm run preview:zine -- "KANTOR AI INI KERJA SENDIRI"
ZINE_EP=32 ZINE_OUT=.zine-preview/b npm run preview:zine -- "BAGAIMANA AI MEMBACA GAMBAR"
```

`ZINE_EP` = nomor episode (memengaruhi pilihan visual), `ZINE_OUT` = folder output,
`ZINE_NARRATION` = narasi per scene dipisah `|` (untuk menguji caption).

## 7. Dijaga oleh unit test

`tests/visual-variation-v9.test.ts` (9 tes):

- hash stabil & unsigned,
- episode yang sama → look identik,
- **10 judul berbeda → minimal 8 look berbeda** (inti keluhan Bos),
- judul beda dengan nomor episode sama tetap bisa beda,
- semua warna aksen/kertas berupa hex final,
- episode kelipatan 5 = `charcoal`,
- layout berotasi 4 mode dan kembali di scene ke-4,
- tipografi berotasi 3 gaya, transisi 4 gaya,
- rotasi kartu ±3.4° dan `darkSceneEvery ∈ {0,3}` (tidak ada frame acak di luar batas aman).
