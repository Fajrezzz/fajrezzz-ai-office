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
