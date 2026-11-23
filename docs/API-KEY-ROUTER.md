# Tutorial — Memasang API Key Central AI Router (Gratis Rp 0)

Dokumen ini menjelaskan **cara memasukkan API key** untuk *Central AI Router* FAJREZZZ AI OFFICE
(Gemini + Groq + OpenRouter + Mistral + fallback keyless Pollinations), baik di **Vercel**
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
| Bikin key Gemini / Groq / Mistral | <https://aistudio.google.com/apikey> · <https://console.groq.com/keys> · <https://console.mistral.ai/api-keys> |

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

Tanpa key sama sekali pun aplikasi tetap jalan lewat **Pollinations keyless fallback** (Rp 0),
hanya lebih lambat/terbatas. Key hanya meningkatkan kecepatan, kualitas, dan kuota.

---

## 2. Daftar variabel environment

| Nama variabel (harus sama) | Provider | Peran di router | Batas gratis kira-kira | Link ambil key |
| --- | --- | --- | --- | --- |
| `GEMINI_API_KEY` | Google Gemini | Reasoning, research, planning, strategy, keputusan agent (gemini-2.5-flash / flash-lite) | ~10–15 RPM, 250–1.500 request/hari | <https://aistudio.google.com/apikey> |
| `GROQ_API_KEY` | Groq Cloud | Tugas cepat: klasifikasi, ringkasan, text processing (llama-3.3-70b / 3.1-8b) | ~30 RPM, 1.000–14.400 request/hari | <https://console.groq.com/keys> |
| `OPENROUTER_API_KEY` | OpenRouter | Alternatif & fallback (hanya model `:free` by default) | ~20 RPM, 50 request/hari | <https://openrouter.ai/keys> |
| `MISTRAL_API_KEY` | Mistral AI | Opsional cadangan ke-4 (mistral-small-latest) | tergantung akun | <https://console.mistral.ai/api-keys> |
| `HINDSIGHT_API_KEY` | Hindsight | Memori jangka panjang agent (opsional) | – | sesuai dashboard Hindsight |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Simpan state cloud (opsional) | – | Supabase → Project Settings → API |

Key **tidak butuh kartu kredit** untuk Gemini, Groq, OpenRouter `:free`, dan Pollinations.

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
| `429` di sebagian request | Kuota free tier habis sementara | Normal — router otomatis fallback ke provider lain / Pollinations |
| Hanya Pollinations yang aktif | Tidak ada key terpasang | Tambahkan minimal satu key (Gemini paling mudah) |
| Preview beda perilaku dengan Production | Env Preview tidak dicentang | Edit variabel → centang **Preview** → redeploy preview |
| Key “bocor” di log | Tidak akan terjadi: `sanitizeErrorMessage()` meredaksi `Bearer`, `AIza…`, `gsk_…`, `sk-or-v1-…` | Tetap jangan pernah menaruh key di `NEXT_PUBLIC_*` |

**Keamanan:** kalau key pernah terlanjur di-share/di-commit — **revoke** di dashboard provider
lalu buat key baru. Jangan pakai prefix `NEXT_PUBLIC_` untuk key apa pun.

---

## 8. Urutan fallback yang dipakai router

1. Klasifikasi tugas (`reasoning` → Gemini, `fast` → Groq, dll.)
2. Kalau provider utama error / 429 / circuit OPEN → provider berikutnya
3. Terakhir: **Pollinations keyless** (tanpa API key, Rp 0)

Detail implementasi: `src/lib/ai/llm-provider.ts` (server-only).
Kebijakan & angka FPS/ketajaman render: `docs/VISUAL-QUALITY-FPS.md`.
