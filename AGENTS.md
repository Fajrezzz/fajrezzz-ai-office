# AGENTS.md — Guardrail Kerja Agen di Repo Ini

Dokumen ini mengadopsi pola **harness engineering** (context → tools → planning → permissions →
memory → verification) dari `ai-boost/awesome-harness-engineering`, disesuaikan untuk repo
FAJREZZZ AI Office.

## 1. Aturan wajib sebelum menyatakan "selesai"

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Kalau salah satu gagal → **belum selesai**. Jangan menutupi kegagalan dengan komentar,
`eslint-disable`, atau `@ts-ignore`.

## 2. Batas wewenang (permissions)

- **Jangan** commit API key, token, atau kredensial apa pun. Gunakan environment variable.
  Gerbang otomatis: `tests/security-scan-v9.test.ts` (memakai `src/lib/security/secret-scan.ts`).
- **Jangan** menambah lantai gedung (kantor tetap 3 lantai, atap fungsional).
- **Jangan** menurunkan kualitas tekstur/tekstur realistis untuk "mengatasi blur".
- **Jangan** mengaktifkan kembali Pollinations; hanya Gemini, Groq, OpenRouter.
- **Jangan** memakai ulang video kreator lain (`yt-dlp` tetap nonaktif).

## 3. Konteks yang harus dibaca dulu

| Kalau menyentuh… | Baca dulu |
|---|---|
| Visual video | `src/lib/pipeline/zine-style.ts`, `src/lib/pipeline/motion-renderer.ts` |
| Proporsi/ruang 3D | `src/lib/data/initial-office-data.ts`, `src/lib/office3d/interior-layout.ts` |
| Router AI / error provider | `src/lib/ai/llm-provider.ts` (+ `/api/ai/test-providers`) |
| Judul & klaim riset | `src/lib/ai/research-rigor.ts` |
| Memori agen | `src/lib/ai/agent-memory.ts` (`buildMemoryRecall`) |

## 4. Pola kerja (plan-first, anti-over-engineering)

1. Reproduksi masalah → tulis test yang gagal.
2. Perbaikan minimal yang membuat test lulus.
3. Refactor hanya kalau mengurangi duplikasi nyata.
4. Verifikasi visual: `npm run preview:zine` untuk renderer video; 3D dicek di dev server.
5. Commit kecil dengan pesan yang menjelaskan **penyebab**, bukan hanya gejalanya.

## 5. Kejujuran spesifikasi

Dilarang mengklaim angka (FPS, resolusi, views, skor viral) yang tidak diukur. Semua metrik QC
harus berasal dari pengukuran aktual (`ActualVideoQcTelemetry`, `ffprobe`, atau sampling canvas).
