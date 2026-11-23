# Audit 26 skill — berbasis bukti

26 skill terdaftar · 6 VERIFIED ACTIVE (probe fungsional lulus) · 5 INTEGRATED (kode + direktif prompt terbukti) · 3 PARTIALLY (butuh browser) · 4 BLOCKED (butuh API/biner/jaringan) · 1 INCOMPATIBLE (referensi saja).

Dijalankan: 2026-11-23T18:13:20.473Z (44 ms)

| # | Skill | Repo | Lisensi | Status | Bukti |
|---|---|---|---|---|---|
| 1 | Marketing Skills (CRO, Copywriting, SEO) | coreyhaines31/marketingskills | MIT | **INTEGRATED** | File implementasi ada: src/lib/ai/github-skills-registry.ts <br> Rujukan kode: 1/1 pola ditemukan di src/. <br> LULUS · buildInstalledSkillsPrompt("script") memuat [marketingskills] → Direktif skill benar-benar disuntikkan ke system prompt divisi naskah. |
| 2 | LinkedIn Content Engineering Skills | sergebulaev/linkedin-skills | MIT | **INTEGRATED** | File implementasi ada: src/lib/ai/writing-humanizer.ts <br> Rujukan kode: 2/2 pola ditemukan di src/. <br> LULUS · buildInstalledSkillsPrompt("script") memuat [linkedin-skills] → Direktif skill benar-benar disuntikkan ke system prompt divisi naskah. <br> LULUS · detectAiTells + humanizerScore pada sampel berbau AI → terdeteksi 2 pola AI (era-digital, kata-penguat-kosong), skor humanis 82. |
| 3 | Hallmark Anti-AI-Slop Design Skill | Nutlope/hallmark | MIT | **REGISTERED_ONLY** | File implementasi ada: src/lib/ai/design-intelligence.ts <br> Rujukan kode: 1/1 pola ditemukan di src/. <br> GAGAL · buildInstalledSkillsPrompt("script") memuat [hallmark] → Direktif skill TIDAK muncul di prompt. |
| 4 | Hyperframes AI Motion Video Engine | heygen-com/hyperframes | Apache-2.0 | **VERIFIED_ACTIVE** | File implementasi ada: src/remotion/TikTokAiComposition.tsx, src/lib/pipeline/motion-renderer.ts <br> Rujukan kode: 1/1 pola ditemukan di src/. <br> LULUS · computeWordTimings → urutan monoton & tidak melewati durasi audio → 10 cue kata, monoton=true, dalam durasi=true. |
| 5 | Voicebox Open-Source AI Voice Studio | jamiepine/voicebox | MIT | **BLOCKED** | File implementasi ada: src/lib/pipeline/neural-tts-client.ts, src/app/api/tts/route.ts <br> Rujukan kode: 1/1 pola ditemukan di src/. <br> LULUS · buildInstalledSkillsPrompt("script") memuat [voicebox] → Direktif skill benar-benar disuntikkan ke system prompt divisi naskah. |
| 6 | ComfyUI Modular Visual Node Graph | Comfy-Org/ComfyUI | GPL-3.0 | **BLOCKED** | File implementasi ada: src/lib/pipeline/scene-broll-client.ts, src/app/api/ai/scene-image/route.ts <br> Rujukan kode: 1/1 pola ditemukan di src/. |
| 7 | OpenRig Persistent Agent Network | mvschwarz/openrig | Apache-2.0 | **INTEGRATED** | File implementasi ada: src/lib/ai/autonomous-agent-engine.ts <br> Rujukan kode: 1/1 pola ditemukan di src/. <br> LULUS · buildInstalledSkillsPrompt("script") memuat [openrig] → Direktif skill benar-benar disuntikkan ke system prompt divisi naskah. |
| 8 | Orca Autonomous Bot Fleet Runtime | stablyai/orca | MIT | **REGISTERED_ONLY** | File implementasi ada: src/lib/pipeline/browser-divisions.ts <br> Rujukan kode: 1/1 pola ditemukan di src/. <br> GAGAL · buildInstalledSkillsPrompt("script") memuat [orca] → Direktif skill TIDAK muncul di prompt. |
| 9 | AI Memory Long-Term Cross-Vendor Ledger | akitaonrails/ai-memory | MIT | **PARTIALLY_INTEGRATED** | File implementasi ada: src/lib/ai/agent-memory.ts, src/lib/ai/hindsight-memory.ts <br> Rujukan kode: 1/1 pola ditemukan di src/. |
| 10 | Claude-Mem Session Context Compression | thedotmack/claude-mem | Apache-2.0 | **PARTIALLY_INTEGRATED** | File implementasi ada: src/lib/ai/agent-memory.ts <br> Rujukan kode: 1/1 pola ditemukan di src/. |
| 11 | Anthropic Official Agent Plugin Architecture | anthropics/claude-plugins-official | Apache-2.0 | **REGISTERED_ONLY** | File implementasi ada: src/lib/ai/github-skills-registry.ts, src/lib/ai/advanced-skill-registry.ts <br> Rujukan kode: 1/1 pola ditemukan di src/. <br> GAGAL · buildInstalledSkillsPrompt("script") memuat [claude-plugins-official] → Direktif skill TIDAK muncul di prompt. |
| 12 | ScrapeGraph-AI Intelligent Extraction | ScrapeGraphAI/Scrapegraph-ai | MIT | **BLOCKED** | File implementasi ada: src/lib/ai/trend-intelligence.ts <br> Rujukan kode: 1/1 pola ditemukan di src/. |
| 13 | Scrapling Adaptive Signal Discovery | D4Vinci/Scrapling | BSD-3-Clause | **VERIFIED_ACTIVE** | File implementasi ada: src/lib/ai/trend-intelligence.ts, src/lib/ai/research-recency.ts <br> Rujukan kode: 1/1 pola ditemukan di src/. <br> LULUS · classifyRecency(2 hari lalu) vs classifyRecency(2019) → 2 hari → fresh, 2019 → stale. |
| 14 | Microsoft Data Formulator Visual Analytics | microsoft/data-formulator | MIT | **INTEGRATED** | File implementasi ada: src/lib/pipeline/ffmpeg-adapter.ts, src/lib/perf/render-telemetry.ts <br> Rujukan kode: 1/1 pola ditemukan di src/. <br> LULUS · buildInstalledSkillsPrompt("script") memuat [data-formulator] → Direktif skill benar-benar disuntikkan ke system prompt divisi naskah. |
| 15 | AI Engineering (Evals, Routing & Structured Output) | rohitg00/ai-engineering-from-scratch | MIT | **REGISTERED_ONLY** | File implementasi ada: src/lib/ai/llm-provider.ts <br> Rujukan kode: 1/1 pola ditemukan di src/. <br> GAGAL · buildInstalledSkillsPrompt("script") memuat [ai-engineering-from-scratch] → Direktif skill TIDAK muncul di prompt. |
| 16 | Git-Bug Offline-First QC Issue Tracker | git-bug/git-bug | GPL-3.0 | **REGISTERED_ONLY** | File implementasi ada: src/lib/pipeline/auto-editor-pacing.ts <br> Rujukan kode: 1/1 pola ditemukan di src/. <br> GAGAL · buildInstalledSkillsPrompt("script") memuat [git-bug] → Direktif skill TIDAK muncul di prompt. |
| 17 | Atlas-OS Lightweight Performance Blueprint | Atlas-OS/Atlas | GPL-3.0 | **PARTIALLY_INTEGRATED** | File implementasi ada: src/lib/perf/render-telemetry.ts <br> Rujukan kode: 1/1 pola ditemukan di src/. |
| 18 | T3Code Mobile & Remote Agent Command | pingdotgg/t3code | MIT | **BLOCKED** | File implementasi ada: src/app/api/agents/think/route.ts <br> Rujukan kode: 1/1 pola ditemukan di src/. |
| 19 | OpenMausBot Virtual Sandbox Agent Runtime | milind-soni/OpenMausBot | Apache-2.0 | **REGISTERED_ONLY** | File implementasi ada: src/lib/ai/autonomous-agent-engine.ts, src/lib/security/secret-scan.ts <br> Rujukan kode: 1/1 pola ditemukan di src/. <br> GAGAL · buildInstalledSkillsPrompt("script") memuat [openmausbot] → Direktif skill TIDAK muncul di prompt. |
| 20 | MoneyPrinterTurbo Automated AI Short Video Engine | harry0703/MoneyPrinterTurbo | MIT | **VERIFIED_ACTIVE** | File implementasi ada: src/lib/pipeline/video-engine-v3.ts <br> Rujukan kode: 1/1 pola ditemukan di src/. <br> LULUS · computeWordTimings → urutan monoton & tidak melewati durasi audio → 10 cue kata, monoton=true, dalam durasi=true. |
| 21 | Andrej Karpathy Agent Discipline & Precision | multica-ai/andrej-karpathy-skills | MIT | **REGISTERED_ONLY** | File implementasi ada: src/lib/ai/llm-provider.ts <br> Rujukan kode: 1/1 pola ditemukan di src/. <br> GAGAL · buildInstalledSkillsPrompt("script") memuat [andrej-karpathy-skills] → Direktif skill TIDAK muncul di prompt. |
| 22 | Humanizer — Penghapus Bau Tulisan AI | blader/humanizer | MIT | **VERIFIED_ACTIVE** | File implementasi ada: src/lib/ai/writing-humanizer.ts <br> Rujukan kode: 1/1 pola ditemukan di src/. <br> LULUS · detectAiTells + humanizerScore pada sampel berbau AI → terdeteksi 2 pola AI (era-digital, kata-penguat-kosong), skor humanis 82. |
| 23 | UI/UX Pro Max — Design Intelligence & Audit Terukur | nextlevelbuilder/ui-ux-pro-max-skill | MIT | **VERIFIED_ACTIVE** | File implementasi ada: src/lib/ai/design-intelligence.ts <br> Rujukan kode: 1/1 pola ditemukan di src/. <br> LULUS · contrastRatio("#000000", "#ffffff") + wcagLevel → rasio kontras 21, level AAA. |
| 24 | Last 30 Days — Riset Berbasis Kesegaran | mvanhorn/last30days-skill | MIT | **VERIFIED_ACTIVE** | File implementasi ada: src/lib/ai/research-recency.ts <br> Rujukan kode: 1/1 pola ditemukan di src/. <br> LULUS · classifyRecency(2 hari lalu) vs classifyRecency(2019) → 2 hari → fresh, 2019 → stale. |
| 25 | REA — Reverse Engineering Playbook (Referensi Terbatas) | morluto/rea | Lihat repo (MIT-style) | **INCOMPATIBLE** | File implementasi ada: src/lib/ai/github-skills-registry.ts <br> Rujukan kode: 1/1 pola ditemukan di src/. |
| 26 | Agency-Agents Complete Multi-Division AI Personas | msitarzewski/agency-agents | MIT | **INTEGRATED** | File implementasi ada: src/lib/config/team-roster.ts <br> Rujukan kode: 1/1 pola ditemukan di src/. <br> LULUS · buildInstalledSkillsPrompt("script") memuat [agency-agents] → Direktif skill benar-benar disuntikkan ke system prompt divisi naskah. |

## Hitungan status
```json
{
  "VERIFIED_ACTIVE": 6,
  "INTEGRATED": 5,
  "PARTIALLY_INTEGRATED": 3,
  "REGISTERED_ONLY": 7,
  "INACTIVE": 0,
  "BLOCKED": 4,
  "INCOMPATIBLE": 1
}
```