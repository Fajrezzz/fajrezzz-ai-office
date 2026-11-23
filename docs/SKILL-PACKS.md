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
