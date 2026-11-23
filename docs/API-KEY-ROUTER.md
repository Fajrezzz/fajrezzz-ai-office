# Tutorial — Memasang API Key Central AI Router (Gratis Rp 0)

Dokumen ini menjelaskan **cara memasukkan API key** untuk *Central AI Router* FAJREZZZ AI OFFICE
(Gemini + Groq + OpenRouter saja — Pollinations keyless sudah DIHAPUS), baik di **Vercel**
(Production & Preview) maupun untuk **development lokal**.

> **Penting:** Aplikasi ini **tidak punya kolom input API key di UI**. Itu disengaja.
> Key disimpan sebagai *Environment Variable* di server (Vercel), lalu dibaca oleh route
> handler `/api/ai/*`. Key **tidak pernah** dikirim ke browser, tidak masuk `localStorage`,
> dan tidak pernah muncul di log (semua error di-redaksi otomatis).

---

## 0. Link langsung (klik ini, tanpa cari menu)

| Keperluan | Link langsung |
| --- | --- |
| Bikin key OpenRouter (gratis, model `:free`) | <https://openrouter.ai/keys> |
| **Tempel key di Vercel** (project `fajrezzz-ai-office`) | <https://vercel.com/fajrezzz1/fajrezzz-ai-office/settings/environment-variables> |
| Cek status key di server | `/api/ai/status` (domain Vercel kamu, mis. `https://fajrezzz-ai-office.vercel.app/api/ai/status`) |
| Bikin key Gemini / Groq / OpenRouter | <https://aistudio.google.com/apikey> · <https://console.groq.com/keys> · <https://openrouter.ai/keys> |

Urutan cepat: **buka link 1 → copy key → buka link 2 → Add New → Name `OPENROUTER_API_KEY`,
Value = key → centang Production + Preview + Development → Save → Deployments → ⋯ → Redeploy.**
Shortcut yang sama juga ada di dalam aplikasi: panel **AI Router** (3 tombol di paling atas).

---

## 1. Ringkasan singkat (TL;DR)

| Langkah | Yang dilakukan |
| --- | --- |
| 1 | Ambil key gratis dari Gemini / Groq / OpenRouter (cukup salah satu untuk mulai) |
| 2 | Vercel → Project → **Settings → Environment Variables** (<https://vercel.com/fajrezzz1/fajrezzz-ai-office/settings/environment-variables>) |
| 3 | Tambahkan nama variabel **persis** seperti tabel di bawah, tempel key, centang **Production + Preview + Development** |
| 4 | **Redeploy** (env baru hanya terbaca setelah deployment baru) |
| 5 | Verifikasi: buka `/api/ai/status` atau panel **AI Router** → tombol **Tes Live Provider** |

**Tanpa API key, fitur AI berhenti dengan pesan jelas** (tidak ada lagi fallback keyless).
Router mengembalikan kode `NO_PROVIDER_CONFIGURED` + link Vercel, jadi tidak ada lagi log
"server antre 502" yang menyesatkan dan tidak ada retry sia-sia.

---

## 2. Daftar variabel environment

| Nama variabel (harus sama) | Provider | Peran di router | Batas gratis kira-kira | Link ambil key |
| --- | --- | --- | --- | --- |
| `GEMINI_API_KEY` | Google Gemini | Reasoning, research, planning, strategy, keputusan agent (gemini-2.5-flash / flash-lite) | ~10–15 RPM, 250–1.500 request/hari | <https://aistudio.google.com/apikey> |
| `GROQ_API_KEY` | Groq Cloud | Tugas cepat: klasifikasi, ringkasan, text processing (llama-3.3-70b / 3.1-8b) | ~30 RPM, 1.000–14.400 request/hari | <https://console.groq.com/keys> |
| `OPENROUTER_API_KEY` | OpenRouter | Alternatif & fallback (hanya model `:free` by default) | ~20 RPM, 50 request/hari | <https://openrouter.ai/keys> |
| `GEMINI_MODEL` *(opsional)* | Google Gemini | Ganti model tanpa deploy, contoh `gemini-flash-latest` atau `gemini-3-flash,gemini-2.5-flash` | – | lihat bagian 9 |
| `GROQ_MODEL` *(opsional)* | Groq | Ganti model Groq, contoh `llama-3.3-70b-versatile` | – | lihat bagian 9 |
| `OPENROUTER_MODEL` *(opsional)* | OpenRouter | Ganti model `:free` (model non-`:free` tetap ditolak router) | – | lihat bagian 9 |
| `GEMINI_IMAGE_MODEL` *(opsional)* | Google Gemini | Model gambar B-Roll; boleh daftar dipisah koma | – | lihat bagian 9 |
| `HINDSIGHT_API_KEY` | Hindsight | Memori jangka panjang agent (opsional) | – | sesuai dashboard Hindsight |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Simpan state cloud (opsional) | – | Supabase → Project Settings → API |

Key **tidak butuh kartu kredit** untuk Gemini, Groq, dan OpenRouter `:free`.

---

## 3. Ambil key (contoh: Gemini)

1. Buka <https://aistudio.google.com/apikey> → login akun Google.
2. Klik **Create API key** → pilih project (atau biarkan dibuatkan otomatis).
3. Copy key (bentuknya diawali `AIza...`).
4. Jangan tempel key ke chat, screenshot, atau file yang di-commit.

**Groq:** <https://console.groq.com/keys> → **Create API Key** (diawali `gsk_...`).
**OpenRouter:** <https://openrouter.ai/keys> → **Create Key** (diawali `sk-or-v1-...`).

---

## 4. Pasang di Vercel (Production & Preview)

1. Buka dashboard Vercel → project **fajrezzz-ai-office**:
   <https://vercel.com/fajrezzz1/fajrezzz-ai-office/settings/environment-variables>
2. Klik **Add New** (atau **Create New**).
3. Isi:
   - **Key** = `GEMINI_API_KEY` (persis, huruf besar, pakai underscore)
   - **Value** = key yang tadi di-copy (tanpa spasi/tanda kutip)
   - **Environments** = centang **Production**, **Preview**, dan **Development**
4. Klik **Save**.
5. Ulangi untuk `GROQ_API_KEY`, `OPENROUTER_API_KEY` (dan `MISTRAL_API_KEY` bila mau).
6. **Redeploy** — env baru hanya aktif pada deployment baru:
   - Tab **Deployments** → deployment terakhir → menu `⋯` → **Redeploy**, atau
   - push commit baru ke branch (deployment otomatis dibuat).

> Kalau hanya butuh mencoba di preview: setelah preview deployment selesai, env Preview
> otomatis terpakai di URL `fajrezzz-ai-office-git-<branch>-....vercel.app`.

---

## 5. Pasang di lokal (development)

```bash
cp .env.example .env.local
```

Lalu isi `.env.local`:

```dotenv
GEMINI_API_KEY=AIza...
GROQ_API_KEY=gsk_...
OPENROUTER_API_KEY=sk-or-v1-...
MISTRAL_API_KEY=          # opsional
```

Jalankan:

```bash
npm run dev
```

`.env.local` **sudah di-ignore** oleh `.gitignore` — jangan pernah meng-commit-nya.

---

## 6. Verifikasi bahwa key benar-benar terbaca

Tiga cara, dari paling cepat:

1. **Endpoint status** — buka di browser:
   `https://<domain-anda>/api/ai/status`
   Cari `"primaryTriad": { "gemini": true, "groq": true, "openrouter": true }`
   dan `"activeLabel": "GEMINI + GROQ + OPENROUTER"`.
2. **Panel AI Router** di dashboard → kartu provider. Kalau env belum ada, badge
   menampilkan **`ENV BELUM ADA`** dan nama variabel yang harus dipasang.
3. **Tes Live Provider** (tombol di panel) → mengirim 1 request minimal ke Gemini/Groq/OpenRouter.
   Hasil per provider: `OK · <ms>` / `NOT CONFIGURED` / `FAILED`.
   Tombol ini dibatasi 1 kali per 8 detik agar kuota gratis tidak terbakar.

---

## 7. Troubleshooting

| Gejala | Penyebab umum | Solusi |
| --- | --- | --- |
| Badge tetap `ENV BELUM ADA` | Variabel belum ada / salah nama / deployment lama | Pastikan nama persis, centang environment yang dipakai, lalu **Redeploy** |
| `FAILED` dengan `401` / `invalid api key` | Key salah copy, sudah di-revoke, atau ada spasi | Copy ulang key, hapus spasi di awal/akhir |
| `429` di sebagian request | Kuota free tier habis sementara | Normal — router otomatis retry lalu pindah ke provider lain |
| `NO_PROVIDER_CONFIGURED` | Tidak ada key terpasang | Tambahkan minimal satu key (Gemini paling mudah) lalu Redeploy |
| Preview beda perilaku dengan Production | Env Preview tidak dicentang | Edit variabel → centang **Preview** → redeploy preview |
| Key “bocor” di log | Tidak akan terjadi: `sanitizeErrorMessage()` meredaksi `Bearer`, `AIza…`, `gsk_…`, `sk-or-v1-…` | Tetap jangan pernah menaruh key di `NEXT_PUBLIC_*` |

**Keamanan:** kalau key pernah terlanjur di-share/di-commit — **revoke** di dashboard provider
lalu buat key baru. Jangan pakai prefix `NEXT_PUBLIC_` untuk key apa pun.

---

## 8. Urutan fallback yang dipakai router

1. Klasifikasi tugas (`reasoning` → Gemini, `fast` → Groq, dll.)
2. Kalau provider utama error / 429 / circuit OPEN → provider berikutnya
3. Tidak ada fallback keyless lagi — key wajib ada

Detail implementasi: `src/lib/ai/llm-provider.ts` (server-only).
Kebijakan & angka FPS/ketajaman render: `docs/VISUAL-QUALITY-FPS.md`.

---

## 9. Kalau muncul `HTTP 404 · This model ... is not found`

Ini bukan berarti key-nya salah. Artinya **nama model di kode sudah tidak ada** di akun/API
Google (deprecate), atau endpoint kompatibilitas OpenAI tidak mengekspos model itu.

Router v9.4 menangani ini berlapis, tanpa perlu ubah kode:

1. **Alias stabil lebih dulu** — urutan model Gemini sekarang
   `gemini-flash-latest` → `gemini-2.5-flash` → `gemini-2.5-flash-lite`.
   Alias `-latest` selalu menunjuk model flash terbaru, jadi tidak ikut pensiun.
2. **Penyelamat native** — kalau endpoint compat membalas 404 padahal `/v1beta/models`
   menyebut model itu hidup, router otomatis mengulang lewat
   `:generateContent` (endpoint native). Model yang berhasil lewat jalur ini ditandai
   `(native)` di telemetry.
3. **Memo model mati** — model yang tetap 404 tidak dicoba lagi selama 15 menit
   (menghemat kuota & waktu). Daftarnya tampil di panel sebagai *Model 404 / pensiun*.
4. **Ganti model tanpa deploy** — set salah satu variabel berikut di Vercel lalu Redeploy:

   | Variabel | Contoh isi |
   | --- | --- |
   | `GEMINI_MODEL` | `gemini-flash-latest` |
   | `GEMINI_MODEL` (beberapa) | `gemini-3-flash,gemini-2.5-flash` |
   | `GROQ_MODEL` | `llama-3.3-70b-versatile` |
   | `OPENROUTER_MODEL` | `meta-llama/llama-3.3-70b-instruct:free` |
   | `GEMINI_IMAGE_MODEL` | `gemini-2.5-flash-image` |

5. **Model image** — `GEMINI_IMAGE_MODEL` boleh berisi beberapa nama dipisah koma; endpoint
   B-Roll mencoba berurutan dan hanya lanjut ke kandidat berikutnya kalau errornya 404.

Cara cek cepat: buka panel **Telemetry → AI Router**, lihat kartu provider. Kalau ada
tulisan *Model 404 / pensiun*, nama model itulah yang harus diganti lewat env di atas.
Dijaga `tests/ai-model-recovery-v94.test.ts` (11 tes).

---

## 10. "Error Rate 100%" belum tentu API key rusak

Panel telemetry bisa terlihat merah padahal key sehat. Baca **kelas error**-nya, bukan angkanya:

| Kelas | Arti | Perlu apa? |
| --- | --- | --- |
| `KEY_INVALID` (401/403) | Key ditolak provider | Copy ulang key / revoke lalu buat baru |
| `OVERLOADED` (5xx, mis. `503 high demand`) | Server provider kelebihan beban | **Tidak ada.** Router pindah ke provider lain |
| `RATE_LIMIT` (429) | Kuota gratis habis sementara | Tunggu / pasang key kedua |
| `MODEL_GONE` (404) | Nama model sudah dipensiunkan | Router ganti model otomatis; bisa set `GEMINI_MODEL` / `GROQ_MODEL` |
| `TIMEOUT` | Provider tidak menjawab tepat waktu | Coba lagi |

Kartu provider sekarang punya badge **API KEY SEHAT** / **KEY DITOLAK** dan kalimat penjelas,
jadi tidak lagi menyimpulkan "semua API key mati" hanya karena satu provider sibuk.

Tambahan v9.4b:
- `Error rate (total)` diberi label supaya jelas itu angka kumulatif sejak server hidup.
- Circuit breaker membedakan penyebab: provider sibuk hanya dikunci **8 detik**
  (dulu 45 detik), key ditolak dikunci 5 menit, nama model mati 12 detik.
- HTTP 503 / 5xx tidak lagi mengulang model yang sama (langsung pindah model/provider),
  sehingga request tidak menunggu dua kali timeout.
- Hasil **Tes Live Provider** kini menyertakan kelas error + saran perbaikan di bawah nama model.

Dijaga `tests/ai-model-recovery-v94.test.ts` (16 tes).

---

## 11. Kuota gratis HARIAN habis (429 `free-models-per-day`) — v9.4c

Screenshot 23:31 menunjukkan OpenRouter `0/9` dengan dua sebab yang **berbeda**:

1. **Nama model basi (404)** — `meta-llama/llama-3.3-70b-instruct:free`,
   `google/gemma-3-27b-it:free`, `qwen/qwen3-coder:free` sudah di-delist OpenRouter,
   dan `openrouter/free` memang **bukan ID model** (selalu 404). ID palsu itu sudah dibuang.
2. **Kuota harian habis (429)** —
   `Rate limit exceeded: free-models-per-day. Add 10 credits to unlock 1000 free model requests per day`.

Kuota gratis OpenRouter dihitung **per hari per akun**, bukan per detik dan bukan per model:
kalau habis, semua model `:free` ikut kena sampai reset (00:00 UTC). Menambah kredit ≥10 USD
menaikkan jatah menjadi 1.000 request/hari. **Ini bukan kerusakan API key.**

### Yang diubah di kode (v9.4c)

| Sebelum | Sesudah |
| --- | --- |
| Kandidat model: daftar statis dulu, hasil `/models` ditambahkan di belakang | **Hasil `/models` (live) didahulukan**, daftar statis hanya cadangan |
| `openrouter/free` ikut dikirim → selalu 404 | ID palsu dibuang (`isKnownBogusModel`) |
| 429 kuota harian diperlakukan seperti rate limit biasa → dicoba ke semua model | Begitu kena, provider **dihentikan** (kuota milik akun, bukan model) |
| Cooldown 8 detik untuk semua 429 | Kuota harian → cooldown **30 menit**; gangguan sesaat tetap 8 detik |
| Panel menulis "kuota sementara habis" | Badge **KUOTA HARIAN HABIS** + saran reset 00:00 UTC / 10 kredit |
| Saran env di panel selalu `gemini-flash-latest` (juga untuk OpenRouter) | Contoh per provider (`modelEnvExample`) |

Provider yang circuit-nya terbuka karena kuota harian **tidak dikunci sehari penuh** — 30 menit,
supaya otomatis pulih setelah kuota reset tanpa perlu redeploy.

Dijaga `tests/ai-model-recovery-v94.test.ts` (24 tes, 8 di antaranya v9.4c).

---

## 12. Gemini "masih sama aja" — diagnosa, bukan tebakan (v9.4d)

Kalau `gemini-2.5-flash` dibalas

> `This model models/gemini-2.5-flash-lite is no longer available to new users`

itu artinya Google **menutup model lama untuk project/akun baru** (modelnya masih terdaftar,
tapi tidak dibuka untuk key baru). Mengetik ulang nama model yang sama tidak akan menolong.

### Cara membaca keadaan sebenarnya

1. **Telemetry → AI Router → kartu Gemini → "Cek katalog model gemini"** (atau buka
   `/api/ai/model-catalog?provider=gemini`). Halaman itu menampilkan:
   - daftar model yang **benar-benar** dikembalikan `GET /v1beta/models` untuk key tersebut,
   - hasil uji per model lewat jalur **native** (`:generateContent`) dan **compat**
     (`/v1beta/openai/chat/completions`),
   - status router sesaat (circuit, kelas error terakhir, kuota harian).
   API key **tidak pernah** ditampilkan di halaman ini.
2. **Tes Live Provider** sekarang menampilkan *raw error* (sudah disanitasi) di bawah saran
   perbaikan, jadi sebab aslinya kelihatan, bukan cuma kesimpulan.

### Yang diubah di kode

| Sebelum | Sesudah |
| --- | --- |
| Compat OpenAI dulu; native hanya penyelamat setelah compat 404 | **Native `:generateContent` dulu**, compat cadangan kalau request native ditolak (400 dsb) |
| Semua 404 dianggap "nama model salah ketik" | Pesan `no longer available to new users` dapat penjelasan sendiri: model ditutup untuk project baru |
| Sebab asli error tidak terlihat di panel | `rawError` ditampilkan (disanitasi) |
| Tidak ada cara melihat daftar model yang terbuka | Halaman `/api/ai/model-catalog?provider=gemini\|groq\|openrouter` |

Setelah daftar model terlihat, ganti permanen tanpa deploy lewat env:

```
GEMINI_MODEL=gemini-…      # salah satu id dari tabel 1 pada halaman katalog
GROQ_MODEL=openai/gpt-oss-120b
OPENROUTER_MODEL=nama-model:free
```

Dijaga `tests/ai-model-recovery-v94.test.ts` (28 tes; 4 di antaranya v9.4d).
