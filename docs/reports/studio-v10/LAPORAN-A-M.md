# LAPORAN MASTER TASK — FAJREZZZ AI OFFICE v10 (A–M)

Branch: `arena/e690331b-fajrezzz-ai-office` · basis `8313262`
Tanggal sesi: 23 November 2026
Artefak pendukung ada di folder ini: `run.json`, `naskah-1..3.md`, `storyboard-1..3.md`,
`storyboard-1..3.png`, `perbandingan.md`, `skill-audit.md`.

> Ringkasan satu paragraf: mesin pemilihan topik, naskah, blueprint kreatif, rencana editing,
> audit skill, dan **render MP4 nyata** sudah berjalan. Tiga video 1080×1920/30 fps/H.264 sudah
> dirender dan diverifikasi `ffprobe` (metadata di `docs/reports/studio-v10-mp4/`). Yang belum:
> **suara narasi** (TTS diblokir), B-roll AI (butuh API key), dan render otomatis di Vercel
> (serverless tanpa ffmpeg). Dashboard tetap menampilkan ekspor sebagai `BLOCKED` saat ffmpeg
> tidak tersedia — itu sengaja.

---

## A. Penyebab video lama mirip (temuan audit kode)

| # | Penyebab | Lokasi bukti |
|---|---|---|
| 1 | Pemilihan topik dikunci ke AI: system prompt "PRIORITAS MUTLAK … AI AGENT/CLAUDE CODE" + 5 fallback topik AI + tren hanya `fetchLiveAiTrends` (feed rilis GitHub) | `src/app/api/agents/autopilot-topic/route.ts` sebelum v10 |
| 2 | Preset sinematik dipilih dari **regex kata kunci topik** → topik mirip = preset sama = editing sama | `src/lib/pipeline/cinematic-presets.ts` (`autoSelectCinematicPresetForTopic`) |
| 3 | Variasi visual hanya paper tone, warna aksen, layout, tipografi, dan 4 transisi dari hash seed. Gerak kamera, struktur cerita, musik, dan aset tetap | `src/lib/pipeline/visual-variation.ts` |
| 4 | Anti-repetisi berbasis teks: maks 25 judul `pastTopics` + 10 memori terkompresi dari klien. Tidak ada semantic similarity, tidak membandingkan sudut/hook/blueprint | `autopilot-topic/route.ts` (sebelum v10) |
| 5 | Riwayat tidak persisten: hanya `localStorage` (`fajrezzz_real_episodes_v2`). Ganti browser/bersihkan data → mesin "lupa" dan bisa mengulang topik | `src/store/AgencyContext.tsx`, `src/lib/studio/topic-history.ts` (baru) |
| 6 | `RealEpisode` tidak menyimpan topik/kategori/sudut/hook/sumber/blueprint → tidak ada materi pembanding | `src/types/pipeline.ts` |
| 7 | Registry 26 skill hanya metadata + `promptDirective`; tidak ada commit/lisensi uji/status/bukti → klaim "26/26 aktif" tak terbukti | `src/lib/ai/github-skills-registry.ts`, `src/lib/studio/skill-audit.ts` (baru) |

## B. Perubahan pemilihan topik

- **Modul baru** `src/lib/studio/topic-intelligence.ts`:
  - 12 kategori acuan (`TOPIC_CATEGORIES`): teknologi_ai, sains, sejarah, alam, edukasi,
    keamanan_digital, psikologi, inovasi, ekonomi, sosial, produktivitas, mitos_fakta —
    dengan `detectCategory()` untuk topik bebas, jadi kategori bisa berkembang.
  - `semanticSimilarity()` deterministik tanpa API (Dice unigram 0.70 + bigram 0.15 + trigram
    karakter 0.15, normalisasi sinonim). Versi cosine TF-IDF dua dokumen sebelumnya membuat kata
    bersama berbobot rendah sehingga "judul diganti" lolos — sudah diganti.
  - `scoreTopicCandidate()` 0–100 dengan bobot: audienceImportance 15, relevanceFreshness 15,
    curiosity 12, educationalValue 12, sourceQuality 12, originality 10, clarity 10,
    visualPotential 8, formatFit 6, minus `repetitionPenalty`.
  - `findSimilarEpisodes()` membandingkan **30 episode terakhir** (`HISTORY_COMPARISON_WINDOW`),
    memakai jendela + skor sudut/hook terpisah (bukan digabung agar tidak terencerkan).
  - `selectBestTopic()`: `MIN_TOPIC_SCORE = 58`, `DUPLICATE_THRESHOLD = 0.62`,
    `SAME_ANGLE_THRESHOLD = 0.8`. Tidak ada kandidat layak → `needsFreshResearch: true`
    (sistem **menolak mengarang**, endpoint mengembalikan HTTP 409).
- **Endpoint `autopilot-topic` diubah**:
  - System prompt AI-lock diganti cakupan 12 kategori + aturan "variasikan kategori".
  - 5 fallback topik AI (`CURATED_AI_AGENT_FALLBACKS`) dihapus, diganti `CANDIDATE_BANK` +
    `selectBestTopic()`; respons kini membawa `category`, `topicScore`, `blueprintLine`,
    `editingLine`.
  - Fallback tren terverifikasi tidak lagi menempelkan frasa "dampak praktis untuk workflow AI Agent".
- **Bukti penolakan duplikat** (dari `run.json`): kandidat `cand-supermoon-duplikat`
  (judul diganti, sudut sama) ditolak dengan alasan
  "terlalu mirip episode #1 (kemiripan 0.63)", "sudut pembahasan sama (1.00)", "skor 42 < 58".

**Kejujuran skor:** dimensi (kepentingan, curiosity, dsb.) diisi manusia di `candidate-bank.ts`,
bukan hasil pengukuran audiens. Skor 98–99 pada run ini artinya "semua kriteria terisi baik",
**bukan** prediksi viral. Tidak ada klaim tren/viral di UI.

## C. Naskah (Script Intelligence)

- `src/lib/studio/script-intelligence.ts`: `buildScriptSkeleton()` merangkai naskah dari fakta
  kandidat mengikuti urutan beat blueprint (9 struktur cerita, bukan template kaku),
  memecah klaim panjang di batas klausa (aman untuk desimal "74,68"), dan memberi label jujur
  `generator: "deterministic-fact-skeleton"` + disclaimer "bukan hasil LLM".
- `auditScript()` memeriksa: kalimat > 18 kata, jargon asing tanpa penjelasan (word-boundary),
  frasa 3 kata berulang, **angka tanpa sumber** (blocker), klise, hook > 14 kata, lebih dari satu
  ide utama. `applyMechanicalFixes()` membuang klise & memecah kalimat tanpa mengubah fakta.
- Hasil 3 episode: skor audit naskah 88 / 94 / 94, tanpa blocker, `qc.ok = true`.
- Setiap klaim ditandai `claimBearing` + `sourceIndexes`; sumber disimpan di
  `EpisodeArtifact.historyRecord.sources` dan ditampilkan di dashboard (nama + URL).

## D. Visual & editing

- **Blueprint wajib sebelum render**: `src/lib/studio/creative-blueprint.ts` — 12 gaya visual,
  6 asset mix, 8 gerak kamera, 6 mode tipografi, 8 transisi, 6 mood musik, 6 gaya hook,
  9 struktur cerita. `buildCreativeBlueprint()` memutasi pilihan (maks 24 percobaan) sampai
  `blueprintSimilarity < 0.55` terhadap riwayat, dan mencatat setiap percobaan yang ditolak.
- **Branding tetap**: `BRAND_INVARIANTS` (wordmark, aksen `#ff5a1f`, font, safe zone 9:16).
  Palet episode boleh berubah; aksen brand tidak.
- `src/lib/studio/dynamic-editing.ts`: menerjemahkan blueprint → keputusan per scene
  (kamera, transisi masuk/keluar yang menyambung, tipografi, aset, `cutIntervalSec`,
  `musicIntensity`, `soundCue`), rotasi sampai `novelAgainstHistory`, lalu
  `validateEditingPlan()` menolak 3 transisi berat berurutan dan scene < 1.2 s.
- Preset lama **tidak dihapus** (masih dipakai renderer); mesin baru berjalan di sampingnya
  agar tidak ada fitur yang rusak.

## E. Daftar 26 skill + status aktual (dihitung, bukan diklaim)

Sumber: `docs/reports/studio-v10/skill-audit.md` (dibuat ulang setiap panel dimuat).

| Status | Jumlah | Skill |
|---|---|---|
| VERIFIED ACTIVE (probe fungsional lulus) | 6 | hyperframes, scrapling, moneyprinterturbo, humanizer, ui-ux-pro-max, last30days-skill |
| INTEGRATED (kode ada + direktif prompt terverifikasi masuk) | 8 | marketingskills, linkedin-skills, hallmark, openrig, orca, data-formulator, git-bug, agency-agents |
| PARTIALLY INTEGRATED (butuh browser/localStorage) | 3 | ai-memory, claude-mem, atlas-os |
| REGISTERED ONLY (tidak ada bukti eksekusi) | 4 | claude-plugins-official, ai-engineering-from-scratch, openmausbot, andrej-karpathy-skills |
| BLOCKED (butuh API/biner/jaringan) | 4 | voicebox, comfyui, scrapegraph-ai, t3code |
| INCOMPATIBLE (referensi saja) | 1 | rea-reverse-engineering |
| INACTIVE | 0 | — |

**Tidak ada "26/26 ACTIVE".** Angka di dashboard berasal dari audit yang sama.

## F. Bukti uji per skill

Setiap entri punya: file implementasi yang dicek keberadaannya, hitungan rujukan kode di `src/`,
probe yang benar-benar dijalankan, dan alasan bila BLOCKED (`skill-audit.ts`). Contoh probe nyata:

- `humanizer` → `detectAiTells` + `humanizerScore` pada sampel berbau AI (terdeteksi > 0 pola).
- `ui-ux-pro-max` → `contrastRatio("#000","#fff") = 21`, `wcagLevel = "AAA"`.
- `last30days-skill` / `scrapling` → `classifyRecency(2 hari) = fresh`, `(2019) = stale`.
- `hyperframes` / `moneyprinterturbo` → `computeWordTimings` menghasilkan 10 cue monoton dan
  tidak melewati durasi audio.
- `marketingskills`, `hallmark`, `agency-agents`, dst → `buildInstalledSkillsPrompt()` dicek pada
  **semua scope divisi**; lulus berarti direktif benar-benar masuk system prompt (bukan bukti
  kualitas output).
- BLOCKED menyebut alasan spesifik (mis. "butuh API key image provider", "network hanya npm/github").

Yang **tidak** tersedia di registry dan karena itu tidak dikarang: nomor commit/versi tiap repo
(hanya nama repo + lisensi). Rekomendasi: tambahkan field `commit`/`version` saat menarik skill.

## G. Hasil Auto-Pilot sampai MP4

Trace 14 tahap per run (`run.json`, panel dashboard):

| Tahap | Status di sesi ini | Catatan |
|---|---|---|
| trend_discovery | degraded | tren live butuh jaringan; kandidat dari bank bertanda sumber |
| topic_selection | ok | skor + anti-repetisi berjalan, duplikat ditolak |
| source_verification | degraded | hanya validasi bentuk URL + tanggal (bukan cek isi halaman) |
| script_generation | degraded | tanpa API key LLM → kerangka fakta deterministik (dilabeli) |
| script_review | ok | audit naskah: 0 blocker |
| creative_blueprint | ok | signature unik per episode |
| storyboard | ok | rencana editing tervalidasi |
| visual_asset_generation | **BLOCKED** | butuh API key image provider |
| voice_generation | **BLOCKED** | TTS butuh jaringan |
| subtitle | ok | timing kata dari `computeWordTimings` (76/105/79 cue) |
| remotion_composition | degraded | rencana scene ada, renderer tidak dijalankan |
| ffmpeg_export | **BLOCKED** di API / **ok** via `npm run studio:render` | ffmpeg 9.0.2 dipasang lokal, 3 MP4 dihasilkan |
| quality_control | ok | 6 pemeriksaan episode |
| final_mp4 | **BLOCKED** di API / **ok** via renderer lokal | 3 file MP4 1080×1920, lihat bagian H |

Total saat dijalankan tanpa ffmpeg: 18 `ok`, 12 `degraded`, 12 `BLOCKED` → `finalStatus = blocked`.
**Pembaruan:** setelah `ffmpeg`+`ffprobe` dipasang di sandbox ini, tahap
`ffmpeg_export` dan `final_mp4` **benar-benar dieksekusi** lewat
`npm run studio:render` dan menghasilkan 3 MP4 (lihat bagian H & I). Status di
API tetap `BLOCKED` pada environment tanpa ffmpeg — itu disengaja agar dashboard
tidak berbohong saat renderer tidak ada.

## H. Tiga episode percobaan + perbedaannya

Ketiganya dipilih sistem dari hasil membuka halaman sumber resmi (bukan mengikuti contoh):

1. **Sains** — "Supermoon 24 November 2026: kenapa bulan terlihat lebih besar padahal ukurannya
   tidak berubah" (BMKG, 21 Nov 2026). Sudut: koreksi miskonsepsi ukuran.
2. **Ekonomi** — "Pengangguran turun jadi 4,75 persen, tapi kenapa gaji terasa tetap segitu"
   (BPS, 5 Nov 2026). Sudut: dua indikator dibaca bersamaan.
3. **Sosial** — "IPM Indonesia 76,59: angka ini sebenarnya mengukur apa dari hidup kita"
   (BPS, 5 Nov 2026). Sudut: membedah isi indeks + batasannya.

Perbedaan terukur (`perbandingan.md`):

| Pasangan | Kemiripan topik | Kemiripan blueprint | Editing sama? | Kemiripan naskah | Vonis |
|---|---|---|---|---|---|
| 1 vs 2 | 0.020 | 0.028 | tidak | 0.05 | berbeda |
| 1 vs 3 | 0.004 | 0.269 | tidak | 0.06 | berbeda |
| 2 vs 3 | 0.013 | 0.054 | tidak | 0.04 | berbeda |

Gaya visual, hook style, struktur cerita, tipografi, dan bahasa transisi ketiganya tidak identik.

**Video nyata sudah dirender** (1080×1920, 30 fps, H.264, sesuai blueprint masing-masing):

| Episode | File | Durasi | Bitrate | Palet/aksen | Ciri visual |
|---|---|---|---|---|---|
| 1 · sains | `docs/reports/studio-v10-mp4/episode-1.mp4` | 43,9 s | 1.644 kbps | hitam + aksen oranye | hook teks besar, bar aksen kiri, 6 scene |
| 2 · ekonomi | `docs/reports/studio-v10-mp4/episode-2.mp4` | 53,5 s | 1.710 kbps | ungu gelap + aksen lime | bar aksen atas, push-in, subtitle padat |
| 3 · sosial | `docs/reports/studio-v10-mp4/episode-3.mp4` | 49,9 s | 1.769 kbps | warm dark + aksen oranye | bar bawah, drift kamera |

Perbedaan yang bisa dilihat langsung: palet, warna aksen, posisi elemen aksen,
gerak kamera per scene, transisi (`Mask reveal` vs `Graphic wipe` vs
`Timeline slide`), dan teks besar per scene diambil dari naskah episode itu.

**Yang belum ada di video:** suara narasi (TTS butuh jaringan, diblokir),
B-roll AI (butuh API key). Track audio = AAC senyap.

## I. Metadata video

Diambil dari `ffprobe -print_format json` (bukan perkiraan), tersimpan di
`docs/reports/studio-v10-mp4/render-report.json`:

| Ep | Resolusi | fps | Codec video | Pixel format | Codec audio | Durasi | Bitrate | Decode check | Faststart |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 1080×1920 | 30 | h264 | yuv420p | aac | 43,90 s | 1.644 kbps | bersih | ya |
| 2 | 1080×1920 | 30 | h264 | yuv420p | aac | 53,50 s | 1.710 kbps | bersih | ya |
| 3 | 1080×1920 | 30 | h264 | yuv420p | aac | 49,90 s | 1.769 kbps | bersih | ya |

- **Decode check**: `ffmpeg -v error -i <file> -f null -` tanpa keluaran error untuk ketiganya.
- **Subtitle**: di-burn ke frame (libass), jadi tidak muncul sebagai stream terpisah
  (`subtitleStreams = 0`). Isi & timing ada di `episode-<n>.ass`.
- **Audio**: AAC 128 kbps **senyap**. Belum ada narasi suara → belum ada klaim sinkron
  audio–subtitle.
- Klaim 4K/60–120fps/bitrate tinggi **tidak dibuat**; semuanya 1080p30 sesuai kemampuan
  encoder yang tersedia.

## J. Test lulus/gagal

| Perintah | Hasil |
|---|---|
| `npm run typecheck` | lulus (0 error) |
| `npm run lint` | lulus (0 error, 0 warning) |
| `npm test` | **189 tes / 0 gagal** (16 suite lama 159 + 3 suite baru 30) |
| `npm run build` | sukses (route `/api/studio/autopilot` terdaftar) |
| `npm run studio:dry-run` | 3 episode, 0 duplikat, QC lulus |
| `GET /api/studio/autopilot` (dev) | 200, audit 26 skill |
| `POST /api/studio/autopilot` (dev) | 200, 3 episode, `finalStatus = blocked` |
| Render MP4 / `ffprobe` | **dijalankan** — 3 file MP4, semuanya lolos validasi metadata |
| `tests/render-metadata-v10.test.ts` | 4 tes lulus (metadata + decode + honesty) |
| Preview 3 video di browser | belum ada preview in-app; file MP4 dibuka manual oleh Bos |

Suite baru: `tests/topic-intelligence-v10.test.ts` (9), `tests/creative-blueprint-v10.test.ts` (12),
`tests/studio-pipeline-v10.test.ts` (9).

## K. File yang diubah/ditambah

Baru:
- `src/lib/studio/topic-intelligence.ts` — kategori, kemiripan semantik, skor, pemilihan topik
- `src/lib/studio/creative-blueprint.ts` — blueprint wajib + anti-template
- `src/lib/studio/dynamic-editing.ts` — blueprint → rencana editing per scene
- `src/lib/studio/script-intelligence.ts` — naskah deterministik + audit klaim
- `src/lib/studio/topic-history.ts` — riwayat + backend & label daya tahan
- `src/lib/studio/skill-audit.ts` — audit 26 skill berbasis bukti & probe
- `src/lib/studio/candidate-bank.ts` — kandidat dari sumber resmi yang dibuka
- `src/lib/studio/episode-factory.ts` — artefak episode + pembanding antar episode
- `src/lib/studio/autopilot-pipeline.ts` — trace 14 tahap + deteksi kapabilitas
- `src/app/api/studio/autopilot/route.ts` — endpoint GET (audit) & POST (seleksi + blueprint)
- `src/components/dashboard/StudioIntelligencePanel.tsx` — dashboard transparan
- `scripts/studio-dry-run.ts` — dry-run + artefak bukti (termasuk PNG storyboard)
- `tests/topic-intelligence-v10.test.ts`, `tests/creative-blueprint-v10.test.ts`,
  `tests/studio-pipeline-v10.test.ts`, `tests/render-metadata-v10.test.ts`
- `scripts/studio-render.ts` — renderer MP4 nyata (ffmpeg + libass + xfade) + verifikasi ffprobe
- `docs/reports/studio-v10-mp4/` — 3 MP4, metadata ffprobe, subtitle .ass, frame sampel
- `docs/reports/studio-v10/*` — laporan ini + bukti run

Diubah:
- `src/app/api/agents/autopilot-topic/route.ts` — AI-lock dihapus, 5 fallback AI dihapus,
  diganti pemilihan lintas kategori berskor + blueprint; 409 saat tidak ada topik layak
- `src/components/dashboard/RealResultsDashboard.tsx` — memasang panel Studio Intelligence
- `package.json` — script `studio:dry-run` + 3 suite tes baru
- `.gitignore` — `.studio-data/` (riwayat lokal dev)

## L. Commit terbaru

- Commit fitur (kode + tes + dashboard + seluruh bukti run): **`9ba2a9b`**
  ("feat(studio): v10 topic intelligence, creative blueprint, script audit, dan audit skill
  berbasis bukti").
- Commit laporan (angka SHA di bagian ini): **`81f32fe`**.
- Basis: `8313262` (merge PR #29). Branch `arena/e690331b-fajrezzz-ai-office` **belum di-merge**
  ke `main`; merge menunggu izin Bos.

## M. Yang masih belum berfungsi / butuh tambahan

1. **Render MP4 & verifikasi metadata**: **sudah jalan di sandbox** setelah `ffmpeg` 9.0.2 +
   `ffprobe` dipasang lokal (imageio-ffmpeg + ffprobe-static, tidak di-commit ke repo).
   Yang belum: render di **produksi/Vercel** — serverless tidak menyediakan ffmpeg; perlu
   worker/CI ber-ffmpeg kalau ingin render otomatis dari dashboard.
2. **Suara (TTS)** dan **aset visual (image gen)**: butuh API key + jaringan; keduanya BLOCKED.
3. **Naskah dari LLM**: endpoint produksi memakai LLM bila key tersedia, tetapi sesi ini tidak
   memanggil LLM (tanpa key) → keluarannya kerangka deterministik yang dilabeli.
4. **Riwayat persisten lintas deploy**: sekarang `localStorage` (browser). Belum ada DB.
   Solusi kompatibel: tabel `studio_topic_history` di Supabase + service role key
   (`createSupabaseBackendPlaceholder()` sudah disiapkan, sengaja no-op agar tidak mengaku
   tersimpan cloud). Tanpa itu, riwayat hilang bila data situs dibersihkan / ganti perangkat.
5. **Tren live**: `fetchLiveAiTrends` butuh jaringan (di sandbox diblokir). Kandidat sesi ini
   berasal dari halaman resmi yang dibuka manual oleh agent, bukan feed otomatis.
6. **Verifikasi sumber otomatis**: pipeline baru memeriksa bentuk URL + tanggal; belum melakukan
   HTTP fetch + ekstraksi kutipan. Perlu ditambahkan bila ingin bukti otomatis penuh.
7. **Commit/versi per skill** belum ada di registry; audit belum bisa menyebut commit SHA repo
   sumber masing-masing skill.
8. **Publikasi otomatis tetap dimatikan** — menunggu persetujuan manual Bos.
