# LAPORAN MASTER TASK — FAJREZZZ AI OFFICE v10 (A–M)

Branch: `arena/e690331b-fajrezzz-ai-office` · basis `8313262`
Tanggal sesi: 23 November 2026
Artefak pendukung ada di folder ini: `run.json`, `naskah-1..3.md`, `storyboard-1..3.md`,
`storyboard-1..3.png`, `perbandingan.md`, `skill-audit.md`.

> Ringkasan satu paragraf: mesin pemilihan topik, naskah, blueprint kreatif, rencana editing,
> dan audit skill sudah diimplementasikan + diuji (189 tes lulus). **Yang belum ada: file MP4.**
> Sandbox ini tidak punya `ffmpeg`, `ffprobe`, maupun browser headless, jadi render video tidak
> dijalankan dan **tidak diklaim berhasil**. Dashboard menampilkan tahap ekspor sebagai `BLOCKED`.

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
| ffmpeg_export | **BLOCKED** | `ffmpeg`/`ffprobe` tidak ada |
| quality_control | ok | 6 pemeriksaan episode |
| final_mp4 | **BLOCKED** | tidak ada file video |

Total: 18 tahap `ok`, 12 `degraded`, 12 `BLOCKED`. `finalStatus = blocked`.
**Tidak ada MP4 yang dihasilkan pada sesi ini.**

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
**Yang bisa dilihat Bos:** naskah + papan cerita (PNG placeholder warna/ritme, bukan frame video).
Video belum ada.

## I. Metadata video

Tidak ada file video → tidak ada resolusi/fps/codec/bitrate yang bisa diverifikasi.
Yang bisa dilaporkan hanya **rencana** output: 9:16, 1080×1920, subtitle per kata, safe zone
TikTok, target 35–55 s. Klaim 4K/120fps/bitrate tertentu **tidak dibuat** karena tidak ada
encoder yang berjalan. Verifikasi metadata nyata harus dilakukan lewat `ffprobe` di environment
yang punya ffmpeg (produksi/Bos).

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
| Render MP4 / `ffprobe` | **tidak dijalankan** (biner tidak ada) |
| Preview 3 video di browser | **tidak dijalankan** (tidak ada video; chromium tidak ada) |

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
  `tests/studio-pipeline-v10.test.ts`
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
- Commit laporan (penyempurnaan angka SHA ini): commit berikutnya di branch yang sama.
- Basis: `8313262` (merge PR #29). Branch `arena/e690331b-fajrezzz-ai-office` **belum di-merge**
  ke `main`; merge menunggu izin Bos.

## M. Yang masih belum berfungsi / butuh tambahan

1. **Render MP4 & verifikasi metadata**: butuh environment dengan `ffmpeg`/`ffprobe` +
   Chromium/Remotion. Di sandbox tidak ada → tidak diklaim. Perlu dijalankan di produksi/Bos
   (atau CI dengan image ber-ffmpeg).
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
