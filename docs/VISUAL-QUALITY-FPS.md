# Visual Quality & FPS — Catatan Teknis (v7)

Dokumen ini menjelaskan **penyebab gambar burik**, **perubahan rendering yang dilakukan**, dan
**cara membaca angka FPS** setelah perbaikan. Semua angka FPS di UI adalah **hasil pengukuran
frame aktual** (`performance.now()`), bukan target.

---

## 1. Target & prinsip

| Item | Nilai |
| --- | --- |
| Target FPS | **120** (panel POCO X8 Pro Max 120 Hz) |
| Sumber angka "Aktual" | Rolling window ~1 detik dari timestamp frame nyata |
| Lantai pixel ratio | **1.0x** (tidak pernah upscaling → tidak pernah blur karena resolusi) |
| Batas pixel ratio | high 2.5x · balanced 2.0x · eco 1.5x |
| Anti-aliasing | Selalu aktif (MSAA) di semua tier |
| Bloom / post-processing | Hanya tier `high` (GPU kuat) |
| Shadow | high 2048 · balanced 1024 (refresh tiap 3 frame) · eco tanpa shadow |
| Textures | 512px canvas, mipmap trilinear, anisotropic 8x (sesuai max GPU) |

---

## 2. Penyebab gambar burik sebelum perbaikan

1. **Pixel ratio dipaksa rendah & diturunkan otomatis.**
   `AdaptivePerformanceController` memanggil `gl.setPixelRatio(0.9)`, `(0.82)`, dan `(1.25)`
   saat FPS turun. Buffer render lebih kecil dari canvas CSS → browser melakukan **upscaling**
   → semua objek & tekstur terlihat pecah/berbulu. Ini penyebab utama.
2. **Rentang DPR adaptif milik React Three Fiber.**
   `dpr={[1.0, 1.35]}` membuat R3F menurunkan resolusi saat terjadi regresi performa /
   interaksi kamera → muncul blur **mendadak** ketika zoom atau rotasi.
3. **Deteksi perangkat memaksa tier `eco` untuk semua Android**, sehingga:
   `antialias: false` (tepi bergerigi), tanpa shadow (kontak objek hilang), DPR 1.25.
4. **Shadow map 512px** untuk gedung ±40 m → shadow acne/noise di permukaan besar
   (terlihat seperti bintik “burik” saat kamera dekat).
5. **Anisotropy di-hardcode 8 tanpa dicek ke GPU**; pada permukaan miring (lantai, kaca, meja)
   mipmap tanpa anisotropy benar menghasilkan moiré/blur.
6. **Remount canvas saat tier berubah** (`key={performanceMode}`) → kamera reset, shader
   dikompilasi ulang, kedip blur.

## 3. Yang diubah

- **Pixel ratio:** dihitung dari DPR asli perangkat dengan batas per tier
  (`PIXEL_RATIO_CAPS`), lantai mutlak **1.0x**. Tidak ada lagi `0.82x`, `0.9x`, atau `1.25x`.
- **DPR statis (bukan array):** `Canvas dpr={initialDpr}` berupa angka → R3F tidak lagi
  menurunkan resolusi saat kamera bergerak/zoom. Penyesuaian hanya oleh controller,
  **step 0.1x + cooldown 5–7 detik**, jadi tidak ada lompatan resolusi mendadak.
- **Anti-aliasing selalu aktif**, `powerPreference: "high-performance"`, `stencil: false`.
- **Canvas tidak lagi di-remount** saat tier berubah → tidak ada reset kamera / kedip.
- **Tier berbasis kemampuan perangkat** (`recommendPerformanceMode`): flagship Android
  (8–12 core, RAM ≥ 6 GB) → `balanced` (tajam), bukan `eco` lagi. `eco` hanya untuk perangkat lemah.
- **Texture sharpness:** `applyTextureQuality()` memasang anisotropic filtering sesuai
  `gl.capabilities.getMaxAnisotropy()` (cap 8), mipmap trilinear `LinearMipmapLinearFilter`,
  `generateMipmaps` aktif. **Tidak ada penurunan resolusi tekstur berdasarkan zoom.**
- **Shadow:** 2048 (high) / 1024 (balanced) + refresh bertahap (`shadow-autoUpdate=false`,
  `needsUpdate` tiap 3 frame) → kualitas naik, biaya GPU turun, tidak panas.
- **Post-processing:** composer/Bloom hanya tier `high` dan selalu **full-resolution**
  (tidak memakai `resolutionScale` yang akan menurunkan resolusi seluruh frame).
- **Bloom hanya high** → tier `balanced` (Android flagship) memakai render path langsung
  tanpa pass tambahan, jadi tepi objek tetap tajam.
- **Zero per-frame allocation** di `RobotCharacter` (scratch Vector3) → GC hitch berkurang.
- **Environment PMREM:** 256 (high) / 128 (balanced) / 64 (eco).
- **Camera:** `near 0.4`, `far 360`, jarak zoom `1.4–85` — objek tetap utuh saat zoom paling dekat
  dan tidak ada clipping; zoom tidak mengubah resolusi/tekstur apa pun.

---

## 4. Kenapa dulu tampil angka 28 FPS

- UI lama menampilkan `adaptiveFps` dari controller yang hanya memperbarui **1 kali per 2 detik**
  dan sebelumnya diinisialisasi `60`, serta dipakai untuk memicu penurunan DPR.
- Ambang internal controller `avgFps < 28` + label “Target 30+ FPS HP” membuat aplikasi
  **berhenti mengejar performa** setelah menyentuh ~28–30 FPS (tier sudah `eco`, DPR 0.82x),
  sehingga terlihat seolah perangkat hanya mampu 28 FPS.
- Tidak ada pengukuran frame time, jadi angka tidak bisa diverifikasi.

## 5. Sistem pengukuran FPS sekarang

`AdaptivePerformanceController`:

1. Mengumpulkan `deltaMs = now - frameSebelumnya` untuk **setiap** frame.
2. Frame hitch > 250 ms (tab switch / context restore) dibuang agar tidak merusak rata-rata.
3. Window dipublikasikan ~1x/detik: `fps = jumlahFrame × 1000 / totalMs`, `frameTime = totalMs / jumlahFrame`,
   plus deviasi (jitter) untuk menentukan apakah lambat karena **batas refresh** atau **bottleneck**.
4. Nilai ditampilkan memakai EMA (62% lama / 38% baru) supaya stabil, tidak melonjak.
5. Target **120** hanya ditampilkan di kolom “Target”. Kolom “Aktual” murni hasil ukur.

Kalau browser/panel membatasi ke 60 Hz, UI menampilkan kira-kira:

```
Target 120 · Aktual 60 fps · 16.7 ms · 786×1746 @2.00x · DPR 2.00x · 412 calls
⚠ Kemungkinan dibatasi ~60 Hz oleh browser/refresh layar (bukan target 120).
```

Kalau GPU/CPU yang menjadi bottleneck (frame time berjitter), catatan berubah menjadi
“bottleneck GPU/CPU, bukan batas refresh layar” — aplikasi tidak akan mengklaim 120 FPS.

---

## 6. Indikator di UI

Panel kecil di HUD kontrol 3D (bukan overlay besar):

`Render Monitor · [status] · Target 120 · Aktual <fps> fps · <ms> · <buffer> · DPR <x> · <draw calls> · <tier>`

Arti status:

| Status | Rentang FPS aktual |
| --- | --- |
| `Smooth 120-class` | ≥ 105 |
| `Smooth 90-class` | 85–104 |
| `Smooth 60-class` | 50–84 |
| `Terbatas` | 28–49 |
| `Berat` | < 28 |

---

## 7. Cara verifikasi di POCO X8 Pro Max

1. Buka aplikasi → tab **Kantor 3D**.
2. Pastikan Chrome tidak dalam mode hemat baterai (mode ini sering mengunci rAF ke 60 Hz).
3. Uji A–J: zoom terjauh, zoom terdekat, zoom jauh↔dekat berulang, rotasi, pan,
   pindah lantai, aktifkan semua agent, kondisi ramai, viewport mobile, desktop.
4. Baca panel **Render Monitor**: target harus tetap 120, aktual mengikuti hasil ukur.
5. Cek ketajaman: tepi gedung, garis kaca, teks signage, tekstur lantai kayu/marmer
   harus tetap tajam di semua tingkat zoom (tidak ada blur/pecah mendadak).

> Catatan jujur: lingkungan build/CI hanya bisa memverifikasi tipe, lint, build, dan
> unit test kebijakan (10 test). Angka FPS **aktual** wajib dibaca dari perangkat fisik
> lewat Render Monitor — tidak ada klaim 120 FPS tanpa pengukuran di perangkat.
