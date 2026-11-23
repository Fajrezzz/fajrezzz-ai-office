# HARNESS.md — Checklist Keandalan Agen (6 Primitif)

Diadopsi dari `ai-boost/awesome-harness-engineering`, diterjemahkan ke repo ini.

## 1. Context — agen harus tahu apa yang sudah ada
- [x] `AGENTS.md` sebagai kontrak kerja
- [x] Memori jangka panjang (`agent-memory.ts`) + recall berbobot
- [x] Dokumen arsitektur video & kualitas visual di `docs/`

## 2. Tools — akses yang sempit dan jelas
- [x] Router AI tunggal (`llm-provider.ts`) dengan 3 provider + discovery model live
- [x] Diagnosis provider: `GET /api/ai/test-providers`
- [x] Tidak ada `eval`, `child_process`, atau shell dari input pengguna

## 3. Planning — rencana sebelum menulis
- [x] Pipeline 7 divisi (Riset → SEO → Naskah → Suara → Motion → Editing → QC)
- [x] Draf naskah selalu melewati QC sebelum render

## 4. Permissions — batas keras
- [x] Tanpa secret di kode (gerbang `secret-scan`)
- [x] 3 lantai, tanpa Pollinations, tanpa `yt-dlp` produksi
- [x] Semua aksi destruktif (hapus episode) butuh konfirmasi eksplisit di UI

## 5. Memory — apa yang sudah dipelajari
- [x] `RecordMemoryEvent` untuk episode, ide, dan pelajaran QC
- [x] Recall sebelum membuat topik baru (mencegah pengulangan)

## 6. Verification — bukti, bukan klaim
- [x] `npm run lint` + `typecheck` + `test` + `build`
- [x] QC video mengukur resolusi/FPS/bitrate aktual
- [x] Audit klaim riset (`auditResearchClaim`) untuk angka tanpa sumber
