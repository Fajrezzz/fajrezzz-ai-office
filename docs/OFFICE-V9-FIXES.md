# v9 — Perbaikan Kantor 3D, Rally Badminton, RGB Fasad & Error AI

Ringkasan keluhan Bos → penyebab → perbaikan (bukan sekadar "disembunyikan").

## 1. L2 masih kosong di kiri & kanan
**Penyebab:** promenade L2 (Z +1.2…+3.6) dan sayap kiri/kanan memang tidak punya furnitur.
**Perbaikan:** `src/lib/office3d/interior-layout.ts` + `InteriorFurnishing.tsx`
- 2 pod kolaborasi (meja bundar + 4 kursi asli + laptop + cangkir + tanaman)
- meja standup + 2 stool, papan tulis kaca, rak buku, 2 planter besar, karpet
- tata letak divalidasi unit test anti-tabrakan dengan meja kerja, coffee bar, dan balkon

## 2. L3 ada yang duduk tanpa kursi & arah salah
**Penyebab:** 3 eksekutif (Bagas, Putri, Arman) punya waypoint duduk di lantai kosong
(X −4.5 / −2.7 / −6.3) — kursi hanya ada di boardroom (X 11.2–14.8).
**Perbaikan:** ketiganya dipindah tepat ke kursi boardroom yang nyata, dengan yaw sesuai
(0 = menghadap meja dari sisi utara, π = dari sisi selatan). Audit otomatis:
`tests/office-layout-v9.test.ts` memastikan **setiap** avatar `pose: seated` di L2/L3 punya kursi.

## 3. Meja kosong
**Perbaikan:** `WorkstationCluster.tsx` sekarang menambahkan pulpen dalam gelas keramik,
pot sukulen, buku spiral + pulpen, smartphone, dan sticky notes di setiap meja.

## 4. Badminton — kok tidak pernah kena raket
**Penyebab:** shuttlecock memakai fase `sin(t*1.45)` sendiri, raket memakai `sin(t*2.6)` —
dua fase berbeda, jadi mustahil bertemu.
**Perbaikan:** `src/lib/office3d/badminton-rally.ts` — satu fase untuk semua:
lintasan parabola dari titik kontak kiri (−1.95) ke kanan (+1.95) melewati net 1.55 m,
ayunan raket kontinu (backswing → strike → follow-through), kilatan impact saat kontak,
dan langkah kaki mengikuti posisi kok. Diuji: pada detik kontak, |x_kok − x_raket| < 3 cm.

## 5. Lampu RGB fasad depan kurang terang
**Perbaikan:** `InteriorActivityRooms.tsx` → `FacadeRgbLighting`
- strip 18 segmen per lantai (total 54) dengan chase hue RGB dinamis,
- emissive `toneMapped={false}` + halo additive 1 m → benar-benar menyala & kena bloom,
- intensitas siang 1.15 (dulu 0.32) dan malam 3.4 (dulu 2.0),
- 3 wash light RGB untuk menerangi dinding fasad, bukan cuma garis tipis.

## 6. "Semua provider AI gagal" terus
**Perbaikan berlapis (`llm-provider.ts`):**
1. **Live model discovery** — router membaca `/models` provider (Gemini/Groq/OpenRouter),
   jadi kalau nama model di-deprecate (HTTP 404) router otomatis memakai model hidup.
2. **Pesan error menyebut penyebab** per provider: `gemini[model]: HTTP 404 …` (dulu hanya
   "semua provider gagal").
3. **Deadline 24 s** + retry maksimal 1 → gagal cepat, tidak menabrak batas fungsi serverless.
4. **Diagnosis live**: buka `https://<domain>/api/ai/test-providers` (GET) atau klik
   "Tes live API key provider" di kartu divisi yang gagal.
5. Label durasi diperbaiki: dulu `44.5d` (terbaca 44,5 hari) → sekarang `44.5 dtk` / `1m 12s`.

## 7. Tujuh repo rujukan
Lihat `docs/SKILL-PACKS.md` — status jujur per repo (aktif sebagai pola / worker-required).

---

# v9.2 — Kursi L3, Pot Berserakan & Video yang Selalu Sama

## 8. Kursi L3 terlihat seperti balok & arahnya salah
**Penyebab:** `SimpleChair` v9 hanya kotak dudukan + sandaran tipis tanpa kaki, jadi dari
kamera HP (layar 722×1600) bentuknya terbaca sebagai balok mengambang.
**Perbaikan:** `src/components/office3d/InteriorFurnishing.tsx`
- `SimpleChair` ditulis ulang: 4 kaki kayu meruncing, dudukan berlapis bantalan,
  sandaran miring 10° dengan 2 tiang, dan armrest — arah hadap = sumbu −Z lokal,
  jadi `rotationY` sekarang benar-benar menentukan arah kursi.
- `PotPlant` ditulis ulang: tatakan + pot keramik (silinder menyempit) + tanah +
  batang + 5 gumpal daun, dengan prop `scale` (bukan `height`).
- `LoungeSofaSet` L3: sofa 3 dudukan menyatu + armchair + meja kopi + lampu lantai.

## 9. Pot bunga berserakan di tengah lantai
**Penyebab:** posisi planter L2/L3 ada di jalur promenade (z 1.6–2.9) sehingga terlihat
seperti pot yang jatuh berhamburan dari kamera atas.
**Perbaikan:** `src/lib/office3d/interior-layout.ts` — semua planter menempel dinding:
L2 `[±17.2, 3.4]`, L3 `[-17.2, 1.1]` dan `[14.2, 3.9]`; sofa L3 `[8.6, 2.7]` rotY 0
menghadap ruang tengah. Diverifikasi `tests/office-layout-v9.test.ts` (11 tes).

## 10. Output video selalu itu-itu saja
**Penyebab:** urutan visual zine hard-coded — kertas krem → panel 0..3 → slab hitam,
di semua episode, di semua scene.
**Perbaikan:** `src/lib/pipeline/visual-variation.ts` (baru) + `zine-style.ts`:
lihat `docs/VIDEO-VARIATION.md`. Ringkasnya, setiap episode punya tone kertas, set aksen,
mode layout, gaya tipografi, gaya transisi, rotasi kartu, dan offset panel sendiri —
deterministik dari judul + nomor episode, jadi QC tetap bisa mengulang hasil yang sama.

## 11. Video belum menjelaskan AI ke penonton awam
**Perbaikan:** prompt Divisi Naskah (`/api/pipeline/[division]`) menambah aturan wajib:
setiap istilah teknis diberi analogi sehari-hari, alur "apa itu → kenapa penting → contoh →
kesimpulan", larangan mengarang angka. Di sisi render, frame zine kini menambahkan
**caption penjelas** (kalimat narasi utuh) di bawah headline, jadi penonton yang mematikan
suara tetap paham konteks adegan.

---

# v9.3 — Lift yang benar-benar bisa dipakai

**Keluhan Bos:** "lift nya bisa dipakai ya".

**Penyebab:** lift panoramik sebelumnya hanya animasi 20 detik yang berulang sendiri
(`cycle = t % 20`). Tombol panggil di dinding cuma hiasan, tidak ada hubungan ke kamera
atau ke lantai mana pun.

**Perbaikan:**

1. `src/lib/office3d/elevator-controller.ts` — state machine murni:
   `idle → doors_opening → dwell → doors_closing → moving → (arrive)`.
   Berisi antrean lantai (FIFO, duplikat dibuang), ETA, arah, interpolasi posisi kabin
   (smoothstep), dan mode ambient yang hanya jalan kalau tidak ada permintaan Bos.
2. `OfficeArchitecture.tsx` → `PanoramicGlassElevator` sekarang:
   - membaca permintaan dari `liftRequestRef` (tombol HUD / tombol 3D),
   - menggerakkan kabin & pintu dari state machine (bukan hitungan detik hard-coded),
   - saat tiba di lantai tujuan: **kamera ikut pindah lantai** (`setActiveFloor`) dan
     mencatat aktivitas "Lift tiba di L2",
   - mempublikasikan status ke HUD ~10×/detik (tidak memicu re-render tiap frame).
3. Tombol panggil lift di dinding 3D (per lantai) sekarang **bisa diketuk**
   (`onClick` → `requestFloor`), ukuran panel 0.3 × 0.46 m supaya mudah di HP.
4. `src/components/office3d/LiftRideHUD.tsx` — panel lift di pojok kiri bawah:
   tombol L1/L2/L3 (44 px, sesuai audit `ui-ux-pro-max`), indikator arah ▲▼, label status
   ("Naik ke L3 · 2,4 dtk"), dan tombol nonaktif untuk lantai yang disembunyikan cutaway.
5. Ambient tetap hidup: kalau tidak ada permintaan, lift naik-turun sendiri seperti dulu
   (hanya di lantai yang tersedia), lalu berhenti saat Bos menekan tombol.

Dijaga `tests/elevator-controller-v9.test.ts` (11 tes): perjalanan 1 lantai = 2,6 dtk,
antrean berurutan, pintu 0→1→0 tanpa lompatan, kabin tidak pernah keluar batas lantai,
ETA menurun saat bergerak, ambient tidak menabrak cutaway, dan dt besar (HP nge-lag)
tidak merusak state.

---

## v9.4 — Koreksi layout dari 10 screenshot HP

Semua keluhan diambil dari screenshot Bos (22:12–22:14). Prinsip: **kalau objek
terlihat melayang / berdiri di tengah ruang, objek itu yang dipindah atau dibuang**,
bukan diberi bantalan baru supaya "kelihatan rapi".

| # | Screenshot | Keluhan | Perbaikan |
|---|------------|---------|-----------|
| 1 | 22:12 L1 | Area kebugaran (treadmill, barbell, bench) kosong-melompong | **Dihapus total** dari `InteriorActivityRooms.tsx`. Sayap timur L1 sekarang hanya rig simulator balap, dengan platform + rangka + triple monitor yang menapak lantai |
| 2 | 22:13 L2 | Meja/tempat ngopi mengambang di tengah ruang | Coffee bar barat & timur digeser dari `x=±12.2` → `x=±17.6` (menempel dinding samping). Zona terlarang `coffee-bar-west/east` ikut dipindah, dan 6 waypoint duduk (`wp-seat-01..03`, `06..08`) + `wp-f2-lounge-w/e` ikut bergeser supaya agen tidak duduk di udara |
| 3 | 22:13 L2 | Pod ngopi/idle masih di tengah promenade | Pod kolaborasi digeser `±5.4` → `±13.8` (menempel sisi), dan `INTERIOR_SEATS` ikut disesuaikan |
| 4 | 22:13 L2 | Pot di ujung berpasangan | Pot IndoorPlanter L2: 3 → 1 (dua pot yang tadinya berdiri di area pod dihapus, satu di ujung dipertahankan) |
| 5 | 22:14 L3 | Kursi dek "kayak mau jatuh" | 6 armchair dengan celah 0,3 m antara base dan dudukan → diganti **pouf modular kuning–abu** yang alasnya menapak lantai. Armchair balkon L2 [-1.6, 4.5] juga disambung tiang penyangga penuh |
| 6 | 22:14 L3 | Meja lounge diganti model sofa modular (referensi produk) | `LoungeSofaSet` ditulis ulang: sectional bentuk L (3 modul punggung + 2 modul sayap), aksen kuning, **dua meja kopi bulat kecil**, pouf kuning/abu, lampu lantai. Armchair melayang & tanaman sudut dihapus |
| 7 | 22:14 L3 | Pot di jalur dek | `IndoorPlanter` L3 (2 buah) dihapus; `planter` layout dipindah dari [-17.2, 1.1] ke sudut mati [-17.4, -8.4], pot kedua di [14.2, 3.9] dihapus |
| 8 | 22:14 Atap | Kursi di atap | Grup lounge atap (sofa + meja) di `CrownSkyDeck.tsx` dihapus; dek hanya helipad, helikopter, lapangan badminton, signage |
| 9 | 22:12 L1 | Label "Gym & Arcade" | Teleport, nama lokasi, dan narasi agen diganti "Arcade & Racing Sim" |

Dijaga `tests/office-layout-v94.test.ts` (8 tes): grep sumber untuk memastikan geometri gym
benar-benar hilang, posisi bar/pod/pot/sofa sesuai tabel di atas, dan
`auditFurnitureLayout` tetap bersih (tidak ada furnitur keluar gedung atau menabrak zona).

Tes total setelah v9.4: **15 suite / 125 tes / 0 gagal**.

Catatan jujur: agent tidak bisa melihat hasil render 3D. Verifikasi visual (warna, proporsi,
apakah masih ada yang terlihat menggantung dari sudut kamera HP) tetap harus dilakukan Bos
di preview Vercel.
