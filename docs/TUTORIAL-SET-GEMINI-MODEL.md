# Tutor Lengkap — Mengunci Model Gemini lewat `GEMINI_MODEL` di Vercel

Panduan ini khusus untuk project **fajrezzz-ai-office** (team `fajrezzz`), dan ditulis
untuk bisa dikerjakan dari HP maupun laptop. Tidak perlu mengubah kode dan tidak perlu
deploy dari laptop.

Tujuan: setelah selesai, router **langsung memakai `gemma-4-31b-it`** untuk Gemini —
tidak lagi mengetes model satu per satu di setiap request.

---

## 0. Ringkasan cepat (kalau tidak mau baca detail)

1. Vercel → project **fajrezzz-ai-office** → **Settings** → **Environment Variables**
2. **Add New**:
   - Key: `GEMINI_MODEL`
   - Value: `gemma-4-31b-it,gemini-flash-latest`
   - Environment: centang **Production** + **Preview**
3. **Save**
4. **Deployments** → deployment paling atas → `⋯` → **Redeploy**
5. Cek: buka `/api/ai/model-catalog?provider=gemini` → kotak *Kandidat router sekarang*
   harus mulai dengan `gemma-4-31b-it`

Sisanya di bawah ini adalah penjelasan, verifikasi, troubleshooting, dan cara membatalkan.

---

## 1. Apa yang sebenarnya terjadi sebelum & sesudah

| | Sebelum ada `GEMINI_MODEL` | Sesudah ada `GEMINI_MODEL` |
| --- | --- | --- |
| Sumber daftar model | hasil `GET /models` + daftar cadangan di kode | **hanya** isi env var |
| Model pertama yang dicoba | ditentukan skor prioritas di kode | `gemma-4-31b-it` (yang Bos tulis) |
| Kalau model pertama mati | router lanjut mengetes kandidat berikutnya | lanjut ke model kedua di env var, lalu provider lain |

Jadi `GEMINI_MODEL` = **keputusan Bos mengalahkan tebakan kode**. Itu sebabnya
disarankan menyertakan satu model cadangan, bukan satu model saja.

---

## 2. Nilai yang disarankan

**Minimal (sesuai permintaan):**

```
GEMINI_MODEL=gemma-4-31b-it
```

**Disarankan (ada cadangan kalau Gemma kena limit/penuh):**

```
GEMINI_MODEL=gemma-4-31b-it,gemini-flash-latest
```

**Cadangan tambahan yang terbukti ada di katalog key Bos:**

```
GEMINI_MODEL=gemma-4-31b-it,gemini-flash-latest,gemma-4-26b-a4b-it
```

Aturan penulisan:

- Nama env **huruf besar semua**: `GEMINI_MODEL` (bukan `Gemini_Model`).
- Pemisah antar model: **koma**, tanpa spasi. Kalaupun ada spasi, kode akan `trim`,
  tapi biasakan tanpa spasi.
- **Tanpa tanda kutip** (`"..."` atau `'...'` akan dianggap bagian dari nama model).
- Jangan menulis `models/gemma-4-31b-it` — cukup `gemma-4-31b-it`.
  (Jalur native memang membersihkan prefix itu, tapi jalur compat tidak.)
- Huruf besar/kecil pada nama model **harus sama** dengan yang ada di katalog.

Nama env yang sama juga berlaku untuk provider lain:

| Provider | Env var | Contoh isi |
| --- | --- | --- |
| Google Gemini | `GEMINI_MODEL` | `gemma-4-31b-it,gemini-flash-latest` |
| Groq | `GROQ_MODEL` | `openai/gpt-oss-120b,qwen/qwen3.8-27b` |
| OpenRouter | `OPENROUTER_MODEL` | `nama-model:free` (hanya `:free` yang dipakai) |

---

## 3. Langkah di dashboard Vercel — dari HP (Android)

1. Buka **vercel.com** di Chrome, login dengan akun `fajrezzz1`
   (`fajrezzz22@gmail.com`).
2. Kalau muncul pilihan scope/team, pilih team **fajrezzz**.
3. Buka project **fajrezzz-ai-office**.
4. Ketuk tab **Settings** (di bagian atas, kadang harus digeser).
5. Di sidebar Settings, ketuk **Environment Variables**.
6. Ketuk tombol **Create New** (di layar HP muncul sebagai tombol biru mengambang
   di kanan bawah, atau tulisan **Add New** di atas daftar).
7. Isi formulir:
   - **Key** → `GEMINI_MODEL`
   - **Value** → `gemma-4-31b-it,gemini-flash-latest`
   - **Environments** → centang **Production** dan **Preview**
     (centang **Development** hanya kalau Bos juga menjalankan project di laptop
     dengan `.env.local`; kalau tidak, tidak perlu)
8. Biarkan tipe var apa adanya (**Plain**/**Encrypted**). **Jangan** pilih **Sensitive**
   — var sensitive tidak bisa dibaca ulang valuenya, dan model bukan rahasia.
9. Ketuk **Save**.
10. **Wajib:** redeploy (lihat bagian 4). Tanpa ini, deployment yang sedang jalan
    tetap memakai env lama.

### Dari laptop (desktop)

Sama saja: **Project → Settings → Environment Variables → Add New**, isi Key/Value,
centang Production + Preview, **Save**.

---

## 4. Redeploy — langkah yang paling sering terlupa

Vercel menempelkan environment variable **saat deployment dibuat**. Deployment lama
tidak akan tahu ada env baru sampai dibuat deployment baru.

**Cara A — tombol Redeploy (paling gampang, dari HP):**

1. Buka project **fajrezzz-ai-office** → tab **Deployments**.
2. Baris paling atas biasanya yang **Production** (ada label *Production* / domain
   `fajrezzz-ai-office.vercel.app`).
3. Ketuk `⋯` (titik tiga) di kanan baris itu → **Redeploy** → konfirmasi **Redeploy**.
4. Tunggu status **Ready** (±1 menit). Boleh tidak mengubah apa pun di dialog.

**Cara B — lewat git (kalau nanti ada perubahan kode):**

Setiap `git push` ke `main` otomatis membuat deployment production baru, dan env
akan ikut. Jadi setelah PR berikutnya di-merge, tidak perlu Redeploy manual.

**Cara C — CLI di laptop:**

```bash
vercel env add GEMINI_MODEL production   # lalu tempel: gemma-4-31b-it,gemini-flash-latest
vercel env add GEMINI_MODEL preview
vercel --prod                            # deploy production baru (env ikut)
```

CLI butuh `npm i -g vercel` dan `vercel login`. Kalau dashboard sudah cukup, cara ini
tidak perlu.

---

## 5. Verifikasi — 4 cara, dari paling cepat

### Cara 1 (paling jelas): halaman katalog model

Buka:

```
https://fajrezzz-ai-office.vercel.app/api/ai/model-catalog?provider=gemini
```

Lihat kotak **“Kandidat router sekarang (urut percobaan):”**.

- ✅ **Berhasil** kalau barisnya mulai dengan `gemma-4-31b-it → …`
- ❌ **Belum berhasil** kalau masih `gemini-2.5-flash → …` → berarti env belum
  terbaca (salah environment, salah project, atau belum redeploy).

Di halaman yang sama ada kotak **“✅ LULUS uji: …”** yang menunjukkan model mana yang
benar-benar bisa menjawab untuk key Bos.

### Cara 2: endpoint status

```
https://fajrezzz-ai-office.vercel.app/api/ai/status
```

Cari bagian `providers` → objek dengan `"id": "gemini"`:

```json
{
  "id": "gemini",
  "envVar": "GEMINI_API_KEY",
  "modelEnvVar": "GEMINI_MODEL",
  "preferredModels": ["gemma-4-31b-it", "gemini-flash-latest", "..."]
}
```

`preferredModels[0]` **harus** `gemma-4-31b-it`.

### Cara 3: panel Telemetry di aplikasi

Buka aplikasi → **Telemetry** → kartu **Google Gemini**:

- Baris **Model:** menampilkan model yang benar-benar dipakai pada request terakhir.
  Setelah satu request sukses, baris ini berubah menjadi `gemma-4-31b-it`
  (atau `gemma-4-31b-it (native)` bila lewat jalur native).
- Kalau muncul catatan **Model 404 / pensiun**, namanya model yang ditolak — bukan
  env-nya.

### Cara 4: Tes Live Provider

Telemetry → tombol **Tes Live Provider**:

- ✅ `GEMINI · OK · xxxms` dengan nama `gemma-4-31b-it` → selesai.
- ❌ `FAILED` → lihat kotak saran + baris **raw error** di bawahnya
  (sejak v9.4d sebab asli dari Google ditampilkan, bukan kesimpulan otomatis).

---

## 6. Kalau masih gagal — tabel penyebab

| Gejala | Penyebab | Tindakan |
| --- | --- | --- |
| Katalog masih mulai `gemini-2.5-flash` | Env belum terbaca | Pastikan Key `GEMINI_MODEL`, environment **Production** dicentang, lalu **Redeploy** |
| Katalog berubah tapi Tes Live Provider `FAILED` 404 | Nama model salah/tidak tersedia untuk key ini | Salin persis dari tabel 1 katalog (yang ada tanda ✅) |
| `FAILED` 401/403 | API key ditolak Google | Key perlu diganti — **bukan** soal model |
| `FAILED` 429 | Kuota gratis Gemini habis sementara | Tunggu; router otomatis pindah ke Groq |
| `FAILED` 503 `high demand` | Server Google sibuk | Tidak perlu apa-apa, router pindah provider |
| Kartu Gemini menampilkan **ENV BELUM ADA** | Itu soal `GEMINI_API_KEY`, bukan `GEMINI_MODEL` | Pasang key-nya dulu |
| Env berubah tapi hanya di Preview, production tetap lama | Hanya Preview yang dicentang | Edit var → centang Production → Save → Redeploy production |

Catatan perilaku router: kalau Gemini gagal, urutan fallback otomatis
**gemini → groq → openrouter**. Jadi aplikasi tidak ikut mati; hanya Gemini yang merah.

---

## 7. Mengganti, menambah cadangan, atau membatalkan

Semua perubahan nilai env tetap butuh **Redeploy** setelah disimpan.

- **Ganti model**: Environment Variables → klik `GEMINI_MODEL` → Edit → ubah Value → Save → Redeploy.
- **Tambah cadangan**: ubah Value jadi `gemma-4-31b-it,gemini-flash-latest` (pisah koma).
- **Kembali ke otomatis (rekomendasi kode)**: hapus var `GEMINI_MODEL`
  (tombol `⋯` → Delete) → Save → Redeploy. Router kembali memakai hasil discovery
  `/models` + daftar prioritas di kode.

Env var bisa dihapus kapan saja tanpa mengganggu `GEMINI_API_KEY` — keduanya terpisah.

---

## 8. Hal yang perlu diingat

1. **Env override = pengganti penuh.** Hanya model di env yang dicoba. Kalau env berisi
   satu model dan model itu pensiun, Gemini akan gagal sampai env diubah. Karena itu
   sertakan minimal satu cadangan.
2. **Model yang dibalas 404 diingat 15 menit** dan dilewati, jadi percobaan ulang
   berikutnya tidak menghabiskan kuota.
3. **Tidak perlu deploy kode** untuk mengganti model — cukup env + Redeploy.
4. **Jangan simpan API key di sini.** `GEMINI_MODEL` hanya berisi nama model, bukan rahasia.
5. Nama model **berubah dari waktu ke waktu** (Google menutup model lama untuk project
   baru). Kalau suatu hari Gemini merah lagi, buka katalog lebih dulu, jangan menebak.
6. Halaman katalog dan `/api/ai/status` **tidak pernah** menampilkan nilai API key.

---

## 9. FAQ singkat

**Perlu ubah kode?** Tidak.
**Perlu redeploy setiap ganti model?** Ya — sekali per perubahan env.
**Perlu centang Development?** Hanya kalau menjalankan project di laptop.
**Boleh pakai model selain Gemma?** Boleh, asal namanya ada di tabel 1 katalog dengan ✅.
**Kenapa disarankan dua model, bukan satu?** Supaya Gemini tidak langsung mati total
kalau model pertama kena limit/pensiun.
**Apakah ini memengaruhi Groq/OpenRouter?** Tidak. Mereka punya env sendiri
(`GROQ_MODEL`, `OPENROUTER_MODEL`).
