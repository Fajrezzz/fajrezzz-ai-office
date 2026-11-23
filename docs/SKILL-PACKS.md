# 7 Repo Rujukan (Skill Packs v9) — Status Jujur

Bos mengirim 7 repo GitHub untuk "dibuat lebih pintar". Repo ini **tidak** menelan semuanya
mentah-mentah; setiap repo diaudit lalu diadopsi sesuai batasan runtime (Next.js 15 + Vercel
Serverless, Rp 0).

| # | Repo | Status di aplikasi | Yang benar-benar dipakai |
|---|---|---|---|
| 1 | `rohitg00/agentmemory` | **Aktif (adapter)** | `buildMemoryRecall()` — recall berbobot (kata kunci + kebaruan + jenis memori) sebelum agen menulis naskah. Daemon/MCP bawaannya tidak dipasang (butuh proses Node terpisah). |
| 2 | `volcengine/OpenViking` | **Worker-required** | Butuh server + PostgreSQL/QueueFS di luar Vercel. Belum diaktifkan; arsitektur knowledge-RAG-nya dicatat untuk worker khusus. |
| 3 | `browser-use/browser-use` | **Worker-required** | Python + Chromium headless (±400 MB) tidak muat di Vercel Serverless. Riset tren saat ini memakai GitHub API resmi; guardrail `yt-dlp` tetap nonaktif. |
| 4 | `ai-boost/awesome-harness-engineering` | **Aktif (pola)** | `AGENTS.md` (guardrail) + `docs/HARNESS.md` + gate verifikasi lint→typecheck→test→build. |
| 5 | `mukul975/Anthropic-Cybersecurity-Skills` | **Aktif (pola)** | `src/lib/security/secret-scan.ts` dipakai sebagai gerbang unit test anti-kebocoran key; redaksi key di semua error provider. Tidak ada tool ofensif yang dipasang. |
| 6 | `cathrynlavery/diagram-design` | **Aktif (pola)** | Prinsip "no shadows, no Mermaid slop": palet editorial, garis tegas, hierarki tipografi — dipakai pada renderer `zine_glitch`. Generator/ekspor eksternal tidak dipasang. |
| 7 | `K-Dense-Al/scientific-agent-skills` | **Aktif (pola)** | `buildResearchRigorPrompt()` disuntik ke system prompt Divisi Riset + `auditResearchClaim()` menandai angka tanpa sumber / klaim absolut sebelum QC. |

## Kenapa tidak semua di-`npm install`

- `browser-use`, OpenViking adalah **server/binary Python/Go** — Vercel Serverless tidak bisa
  menjalankannya (batas ukuran & tidak ada proses long-lived).
- Repo skill (harness, cybersecurity, diagram, scientific) berbentuk **dokumen & prompt**,
  bukan library JS. Nilainya diambil sebagai pola, bukan sebagai dependency.

## Kalau Bos mau semua fitur penuh

Perlu **Render Worker** (bukan Vercel): Docker image berisi Python 3.11 + Chromium + OpenViking
+ PostgreSQL. Alur aplikasi sudah disiapkan lewat `service-adapter` sehingga tinggal mengisi
`OPENVIKING_URL` / `BROWSER_USE_URL` saat worker tersedia.

---

# 4 Repo Baru (Skill Packs v9.3) — 23 Nov 2026

Bos kirim 4 repo lagi. Statusnya jujur, sama seperti 7 repo sebelumnya: yang bisa jalan
di Next.js + Vercel dipasang sebagai kode nyata; yang butuh worker/binari dicatat sebagai
referensi dan **tidak** diklaim aktif.

| # | Repo | Status di aplikasi | Yang benar-benar dipakai |
|---|---|---|---|
| 8 | `blader/humanizer` | **Aktif (adapter)** | `src/lib/ai/writing-humanizer.ts` — `detectAiTells()` mendeteksi 11 pola tulisan AI (pembuka asisten, "di era digital ini", "bukan hanya X tetapi juga Y", em dash berlebih, "mari kita", "!!"), `humanizeText()` memperbaiki yang mekanis, `humanizeSceneNarrations()` dipanggil di Divisi Naskah sebelum TTS/timeline. Prinsip "jangan mengubah tulisan manusia yang sudah wajar" diikuti: teks bersih tetap dibiarkan. |
| 9 | `nextlevelbuilder/ui-ux-pro-max-skill` | **Aktif (adapter)** | `src/lib/ai/design-intelligence.ts` — playbook per tipe produk (palet, skala teks, aturan layout, anti-pattern), `contrastRatio()` + `wcagLevel()` (WCAG 2.x asli), `auditDesign()` untuk kontras/target sentuh 44px/ukuran teks. Dipakai sebagai direktif prompt desain + unit test yang menjaga warna panel Kids Studio tetap lulus kontras. |
| 10 | `mvanhorn/last30days-skill` | **Aktif (adapter)** | `src/lib/ai/research-recency.ts` — `classifyRecency()` (fresh ≤7 hari, current ≤30, stale), `summarizeRecency()` (rasio kesegaran + verdict jujur), `pickFreshSources()`, `buildRecencyPromptBlock()` disuntik ke Divisi Riset & Autopilot. Tren di Autopilot sekarang diurutkan yang paling segar dulu dan diberi tahu kalau mayoritas sumber sudah basi. |
| 11 | `morluto/rea` | **Reference-only (worker-required)** | Playbook reverse engineering (APK/jadx/apktool, analisis statis, MCP bridge) butuh Android SDK + Frida + worker Linux terpisah. Yang diadopsi hanya disiplinnya: statis dulu, catat hash & versi, jangan menyimpulkan dari satu file, nyatakan batasan alat. Tidak ada tool ofensif yang dipasang. |

## Kode & tes

- `tests/skills-v93.test.ts` — 20 tes: deteksi & perbaikan bau AI, matematika kontras WCAG,
  audit desain panel nyata (lulus), klasifikasi kesegaran sumber, sortir/pilih sumber segar,
  dan isi prompt block.
- Registry prompt bertambah dari 22 → **26 modul** (`src/lib/ai/github-skills-registry.ts`);
  Divisi Naskah kini menerima direktif `[humanizer]` + `[ui-ux-pro-max]`, Divisi Riset &
  Autopilot menerima `[last30days]`.
- Verifikasi: `tsc --noEmit`, `eslint`, `npm test`, `next build` hijau sebelum PR dikirim.
