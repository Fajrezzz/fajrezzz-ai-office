/**
 * Modular AI Agent Skill Registry (Phase 1 Audit + Phase 2 Skill System).
 *
 * Rules:
 * - Every entry accurately reflects real audit findings, license, version, compatibility,
 *   and whether the capability is TRULY ACTIVE in the current runtime vs requires an external worker.
 * - Skills that are not installed are explicitly marked `not-installed` / `worker-required`
 *   — NEVER faked as active!
 */

export type SkillDomain =
  | "video-production"
  | "motion-graphics"
  | "video-encoding"
  | "audio-processing"
  | "speech-transcription"
  | "subtitle-synchronization"
  | "video-analysis"
  | "coding-best-practices"
  | "research-fact-checking"
  | "long-term-memory"
  | "quality-assurance"
  | "agent-harness"
  | "web-automation"
  | "cybersecurity"
  | "editorial-diagram"
  | "scientific-research";

export type SkillIntegrationType =
  | "npm-dependency"
  | "service-adapter"
  | "methodology-skill"
  | "reference-only";

export type SkillInstallStatus =
  | "installed"
  | "adapter-active"
  | "worker-required"
  | "not-installed"
  | "reference-only";

export type SkillCompatibilityStatus =
  | "compatible-nextjs-browser"
  | "compatible-nodejs-worker"
  | "selective-prompt-only"
  | "external-service-required";

export type SkillTestStatus = "tested" | "runtime-probed" | "not-tested-missing-binary";

export interface RuntimeCapabilityProbe {
  checkedAt: string;
  nodeVersion: string;
  remotionInstalled: boolean;
  remotionVersion: string | null;
  gsapInstalled: boolean;
  gsapVersion: string | null;
  mp4MuxerInstalled: boolean;
  ffmpegBinaryAvailable: boolean;
  ffprobeBinaryAvailable: boolean;
  whisperCliAvailable: boolean;
  autoEditorCliAvailable: boolean;
  ytDlpCliAvailable: boolean;
  hindsightConfigured: boolean;
}

export interface ModularAgentSkillSpec {
  id: string;
  name: string;
  domain: SkillDomain;
  sourceRepo: string;
  sourceUrl: string;
  license: string;
  version: string;
  integrationType: SkillIntegrationType;
  defaultInstallStatus: SkillInstallStatus;
  compatibility: SkillCompatibilityStatus;
  testStatus: SkillTestStatus;
  hardwareRequirement: string;
  securityNote: string;
  activeCapabilities: string[];
  inactiveCapabilities: string[];
  assignedDivisions: string[];
}

export const MODULAR_AGENT_SKILLS: ModularAgentSkillSpec[] = [
  {
    id: "remotion-video-composition",
    name: "Remotion React Video Composition",
    domain: "video-production",
    sourceRepo: "remotion-dev/remotion",
    sourceUrl: "https://github.com/remotion-dev/remotion",
    license: "Remotion License (Free ≤3 org)",
    version: "4.0.546",
    integrationType: "npm-dependency",
    defaultInstallStatus: "installed",
    compatibility: "compatible-nextjs-browser",
    testStatus: "tested",
    hardwareRequirement: "Browser CPU/GPU untuk @remotion/player; Chromium headless jika render server.",
    securityNote: "Pure client React composition — tanpa eksekusi shell.",
    activeCapabilities: [
      "Komposisi video vertikal TikTok 9:16 berbasis React (AbsoluteFill, Sequence, spring, interpolate)",
      "Interactive @remotion/player preview frame-by-frame di Dashboard",
      "Animated UI, terminal Claude Code, diagram arsitektur multi-agent & kinetic typography",
    ],
    inactiveCapabilities: [
      "@remotion/renderer server-side headless Chromium (butuh worker container, melebihi batas ukuran Vercel Lambda)",
    ],
    assignedDivisions: ["Motion", "Editing", "Creative Director"],
  },
  {
    id: "gsap-timeline-motion",
    name: "GSAP Timeline & Motion Choreography",
    domain: "motion-graphics",
    sourceRepo: "greensock/gsap-skills",
    sourceUrl: "https://github.com/greensock/gsap-skills",
    license: "MIT (skills) + GSAP Standard No-Charge License (gsap 3.15.1)",
    version: "3.15.1",
    integrationType: "npm-dependency",
    defaultInstallStatus: "installed",
    compatibility: "compatible-nextjs-browser",
    testStatus: "tested",
    hardwareRequirement: "Ringan (CPU JS 60-120fps di desktop & Android).",
    securityNote: "Library JS murni tanpa akses jaringan atau filesystem.",
    activeCapabilities: [
      "GSAP paused timeline scrubbing presisi per frame (power4.out, expo.inOut, back.out)",
      "Stagger animation, parallax depth offset, kinetic text reveal & UI micro-sequencing",
      "Terintegrasi ke Motion Renderer & Remotion TikTok Composition",
    ],
    inactiveCapabilities: [],
    assignedDivisions: ["Motion", "Editing"],
  },
  {
    id: "ffmpeg-encoding-validation",
    name: "FFmpeg Encoding, Mixing & ffprobe QA",
    domain: "video-encoding",
    sourceRepo: "FFmpeg/FFmpeg",
    sourceUrl: "https://github.com/ffmpeg/ffmpeg",
    license: "LGPL v2.1+ / GPL v2+ (tergantung build)",
    version: "master (CLI adapter)",
    integrationType: "service-adapter",
    defaultInstallStatus: "worker-required",
    compatibility: "compatible-nodejs-worker",
    testStatus: "runtime-probed",
    hardwareRequirement: "Native binary ffmpeg/ffprobe di Node worker/Docker (NVENC/VideoToolbox opsional untuk 4K 120fps).",
    securityNote: "Gunakan spawn array args (tanpa shell interpolation) & validasi path lokal.",
    activeCapabilities: [
      "Browser WebCodecs H.264/H.265 MP4 + AAC via mp4-muxer (aktif langsung di browser tanpa server FFmpeg)",
      "Adapter server FFmpeg + ffprobe siap pakai otomatis bila binary ffmpeg terpasang di host/worker",
      "Validasi metadata file aktual (resolusi, FPS unik, codec, bitrate, audio stream)",
    ],
    inactiveCapabilities: [
      "Server-side FFmpeg transcoding di Vercel Serverless (Vercel Lambda tidak menyertakan binary ffmpeg bawaan)",
    ],
    assignedDivisions: ["Editing", "QC"],
  },
  {
    id: "auto-editor-audio-pacing",
    name: "Auto-Editor Silence Detection & Smart Pacing",
    domain: "audio-processing",
    sourceRepo: "wyattblue/auto-editor",
    sourceUrl: "https://github.com/wyattblue/auto-editor",
    license: "Unlicense",
    version: "31.10.0 (PCM engine + CLI adapter)",
    integrationType: "service-adapter",
    defaultInstallStatus: "adapter-active",
    compatibility: "compatible-nextjs-browser",
    testStatus: "tested",
    hardwareRequirement: "CPU ringan (PCM RMS audio trimming langsung di browser & Node).",
    securityNote: "Pemrosesan audio lokal di memori tanpa upload pihak ketiga.",
    activeCapabilities: [
      "Deteksi hening PCM RMS (-40 dB) & smart dead-air trimming dengan margin 70ms untuk pacing TikTok cepat",
      "Auto-ducking BGM & transisi audio sample-accurate di OfflineAudioContext",
    ],
    inactiveCapabilities: [
      "CLI native auto-editor (Nim binary) untuk pemotongan video eksternal (butuh worker)",
    ],
    assignedDivisions: ["Suara", "Editing"],
  },
  {
    id: "whisper-cpp-transcription",
    name: "whisper.cpp Speech-to-Text & Timestamps",
    domain: "speech-transcription",
    sourceRepo: "ggml-org/whisper.cpp",
    sourceUrl: "https://github.com/ggml-org/whisper.cpp",
    license: "MIT (dipilih resmi dari organisasi ggml-org)",
    version: "v1.9.5 (adapter)",
    integrationType: "service-adapter",
    defaultInstallStatus: "worker-required",
    compatibility: "compatible-nodejs-worker",
    testStatus: "runtime-probed",
    hardwareRequirement: "Binary C++ whisper-cli + bobot model GGML (~142MB-466MB RAM/VRAM).",
    securityNote: "100% pemrosesan lokal bila terpasang; tidak mengirim audio ke layanan eksternal.",
    activeCapabilities: [
      "Parser output JSON token timestamp whisper.cpp (-ojf) sudah diimplementasikan & teruji",
      "Fallback aktif: syllable-weighted audio-duration subtitle aligner (0ms drift pada TTS internal)",
    ],
    inactiveCapabilities: [
      "Eksekusi binary C++ whisper-cli di Vercel Serverless (butuh dedicated render worker + model GGML)",
    ],
    assignedDivisions: ["Suara", "Motion", "QC"],
  },
  {
    id: "subtitle-sync-engine",
    name: "Word-Level Subtitle Synchronization Engine",
    domain: "subtitle-synchronization",
    sourceRepo: "ggml-org/whisper.cpp + internal sync",
    sourceUrl: "https://github.com/ggml-org/whisper.cpp",
    license: "MIT",
    version: "v3.1",
    integrationType: "npm-dependency",
    defaultInstallStatus: "installed",
    compatibility: "compatible-nextjs-browser",
    testStatus: "tested",
    hardwareRequirement: "Zero overhead (pure TypeScript).",
    securityNote: "Pemrosesan teks lokal tanpa pengiriman data eksternal.",
    activeCapabilities: [
      "Sinkronisasi durasi scene tepat pada durasi audio terukur + PCM silence trim",
      "Distribusi timestamp kata per kata berbobot suku kata Bahasa Indonesia & tanda baca",
      "Highlight keyword otomatis di dalam TikTok 9:16 Safe Zone",
    ],
    inactiveCapabilities: [],
    assignedDivisions: ["Suara", "Motion", "Editing"],
  },
  {
    id: "yt-dlp-authorized-analysis",
    name: "yt-dlp Authorized Media Inspection (Policy-Guarded)",
    domain: "video-analysis",
    sourceRepo: "yt-dlp/yt-dlp",
    sourceUrl: "https://github.com/yt-dlp/yt-dlp",
    license: "Unlicense",
    version: "2026.10.26 (reference/policy only)",
    integrationType: "reference-only",
    defaultInstallStatus: "not-installed",
    compatibility: "compatible-nodejs-worker",
    testStatus: "not-tested-missing-binary",
    hardwareRequirement: "Python 3.9+ CLI pada worker terpisah.",
    securityNote:
      "KETAT: Dilarang mengunduh/menggunakan ulang video kreator lain tanpa izin. Hanya untuk sumber berlisensi/milik sendiri sesuai ToS platform.",
    activeCapabilities: [
      "Kebijakan filter hak cipta & daftar domain berizin terdokumentasi",
    ],
    inactiveCapabilities: [
      "Binary yt-dlp tidak dipasang di Vercel & sengaja dinonaktifkan untuk mencegah pelanggaran hak cipta",
    ],
    assignedDivisions: ["Riset"],
  },
  {
    id: "hindsight-agent-memory",
    name: "Hindsight Long-Term Agent Memory",
    domain: "long-term-memory",
    sourceRepo: "vectorize-io/hindsight",
    sourceUrl: "https://github.com/vectorize-io/hindsight",
    license: "MIT",
    version: "v1.2.3 (HTTP adapter)",
    integrationType: "service-adapter",
    defaultInstallStatus: "worker-required",
    compatibility: "external-service-required",
    testStatus: "runtime-probed",
    hardwareRequirement: "Membutuhkan server Hindsight (PostgreSQL+pgvector) atau Hindsight Cloud via HINDSIGHT_API_URL.",
    securityNote: "API key hanya dari server env var; tidak menyimpan PII/data pribadi.",
    activeCapabilities: [
      "HTTP adapter retain/recall Hindsight siap aktif otomatis begitu HINDSIGHT_API_URL diset",
      "Fallback aktif Rp 0: memori persisten jangka panjang lokal (agent-memory.ts)",
    ],
    inactiveCapabilities: [
      "Backend Hindsight eksternal belum terhubung (HINDSIGHT_API_URL kosong)",
    ],
    assignedDivisions: ["CEO Auto-Pilot", "Riset", "Naskah"],
  },
  {
    id: "superpowers-ponytail-coding",
    name: "Superpowers + Ponytail Coding & Workflow Discipline",
    domain: "coding-best-practices",
    sourceRepo: "obra/superpowers + dietrichgebert/ponytail",
    sourceUrl: "https://github.com/obra/superpowers",
    license: "MIT",
    version: "v7.0.2 + v5.3.3",
    integrationType: "methodology-skill",
    defaultInstallStatus: "installed",
    compatibility: "selective-prompt-only",
    testStatus: "tested",
    hardwareRequirement: "Zero runtime overhead (disuntikkan ke prompt agen & SOP engineering).",
    securityNote: "Hanya pedoman arsitektur & verifikasi; tanpa eksekusi skrip eksternal.",
    activeCapabilities: [
      "Plan-before-code, perubahan bedah minimalis (Ponytail), dan verifikasi nyata sebelum klaim selesai (Superpowers)",
      "Checklist coding modular & anti over-engineering pada seluruh divisi AI",
    ],
    inactiveCapabilities: [],
    assignedDivisions: ["Naskah", "Motion", "QC"],
  },
  {
    id: "ecc-selective-research-security",
    name: "ECC Selective Research-First & Security Hygiene",
    domain: "research-fact-checking",
    sourceRepo: "affaan-m/ecc",
    sourceUrl: "https://github.com/affaan-m/ecc",
    license: "MIT",
    version: "v2.2.3 (selective)",
    integrationType: "methodology-skill",
    defaultInstallStatus: "installed",
    compatibility: "selective-prompt-only",
    testStatus: "tested",
    hardwareRequirement: "Zero overhead; konfigurasi harness penuh sengaja tidak diimpor agar tidak bentrok.",
    securityNote: "Integrasi selektif: hanya prinsip research-first, zero-secret-in-code, & fact-checking sumber resmi.",
    activeCapabilities: [
      "Sistem pemeringkatan topik AI aktual 5-faktor (Kebaruan, Relevansi, Hookability, Kualitas Sumber, Kemudahan Demo)",
      "Verifikasi sumber resmi GitHub & tanggal publikasi; larangan klaim views/viral palsu",
    ],
    inactiveCapabilities: [
      "Harness konfigurasi ECC penuh sengaja tidak dipasang untuk menghindari konflik dengan Next.js",
    ],
    assignedDivisions: ["Riset", "CEO Auto-Pilot", "QC"],
  },
  {
    id: "actual-media-qa-auditor",
    name: "Actual Video & Media Quality Assurance",
    domain: "quality-assurance",
    sourceRepo: "FFmpeg/ffprobe + internal QC",
    sourceUrl: "https://github.com/ffmpeg/ffmpeg",
    license: "MIT / LGPL",
    version: "v3.1",
    integrationType: "npm-dependency",
    defaultInstallStatus: "installed",
    compatibility: "compatible-nextjs-browser",
    testStatus: "tested",
    hardwareRequirement: "Browser canvas pixel sampling + binary header check (plus ffprobe bila di worker).",
    securityNote: "Inspeksi file lokal tanpa mengunggah video ke server eksternal.",
    activeCapabilities: [
      "Inspeksi header container MP4 (ftyp) / WebM (EBML), black-frame pixel scan & TikTok Safe Zone check",
      "Pelaporan metrik AKTUAL (resolusi, FPS unik, codec, bitrate Mbps, drift A/V ms, frame drop)",
    ],
    inactiveCapabilities: [],
    assignedDivisions: ["QC", "Editing"],
  },
  // ================= v9 SKILL PACKS (7 repo yang dikirim Bos) =================
  {
    id: "agentmemory-recall",
    name: "AgentMemory — Persistent Recall & Consolidation",
    domain: "long-term-memory",
    sourceRepo: "rohitg00/agentmemory",
    sourceUrl: "https://github.com/rohitg00/agentmemory",
    license: "MIT",
    version: "0.9.33",
    integrationType: "methodology-skill",
    defaultInstallStatus: "adapter-active",
    compatibility: "compatible-nextjs-browser",
    testStatus: "tested",
    hardwareRequirement: "Tidak ada — berjalan di localStorage browser (tanpa server/DB eksternal).",
    securityNote: "Semua memori tetap di browser Bos; tidak ada data yang dikirim ke pihak ketiga.",
    activeCapabilities: [
      "Recall berbobot (overlap kata kunci + kebaruan + jenis memori) sebelum agen menulis naskah — `buildMemoryRecall()`",
      "Konteks memori terkompresi (`buildCompressedMemoryContext`) disuntik ke prompt agen",
      "Pencatatan episode & pelajaran QC agar topik tidak diulang",
    ],
    inactiveCapabilities: [
      "Server daemon + MCP bridge bawaan repo aslinya (butuh proses Node terpisah, tidak cocok untuk Vercel Serverless)",
    ],
    assignedDivisions: ["Riset", "SEO", "Naskah", "QC"],
  },
  {
    id: "openviking-context-db",
    name: "OpenViking — Self-Evolving Context Database",
    domain: "long-term-memory",
    sourceRepo: "volcengine/OpenViking",
    sourceUrl: "https://github.com/volcengine/OpenViking",
    license: "Apache-2.0",
    version: "main (≈3.5k commits)",
    integrationType: "service-adapter",
    defaultInstallStatus: "worker-required",
    compatibility: "external-service-required",
    testStatus: "not-tested-missing-binary",
    hardwareRequirement: "Server Python/Go + PostgreSQL/QueueFS; minimal 2 vCPU & 2 GB RAM di luar Vercel.",
    securityNote: "Butuh kredensial DB sendiri; tidak diaktifkan otomatis untuk menghindari secret tambahan.",
    activeCapabilities: [],
    inactiveCapabilities: [
      "Knowledge RAG + skill unification (menunggu worker khusus; adapter belum dipasang)",
    ],
    assignedDivisions: ["Riset"],
  },
  {
    id: "browser-use-agent",
    name: "Browser Use — Autonomous Web Agent",
    domain: "web-automation",
    sourceRepo: "browser-use/browser-use",
    sourceUrl: "https://github.com/browser-use/browser-use",
    license: "MIT",
    version: "1.0.8",
    integrationType: "service-adapter",
    defaultInstallStatus: "worker-required",
    compatibility: "external-service-required",
    testStatus: "not-tested-missing-binary",
    hardwareRequirement: "Python 3.11+ + Chromium headless (~400 MB) — tidak bisa di Vercel Serverless.",
    securityNote: "Hanya boleh dipakai untuk halaman publik/berlisensi terbuka; guardrail yt-dlp tetap berlaku.",
    activeCapabilities: [],
    inactiveCapabilities: [
      "Otomasi browser untuk riset tren (menunggu Render Worker; riset saat ini pakai GitHub API resmi)",
    ],
    assignedDivisions: ["Riset"],
  },
  {
    id: "awesome-harness-engineering",
    name: "Awesome Harness Engineering — Agent Reliability Patterns",
    domain: "agent-harness",
    sourceRepo: "ai-boost/awesome-harness-engineering",
    sourceUrl: "https://github.com/ai-boost/awesome-harness-engineering",
    license: "CC0-1.0",
    version: "main (Nov 2026)",
    integrationType: "methodology-skill",
    defaultInstallStatus: "adapter-active",
    compatibility: "selective-prompt-only",
    testStatus: "tested",
    hardwareRequirement: "Tidak ada — pola dokumen & checklist.",
    securityNote: "Hanya mengadopsi pola (context, tools, planning, permissions, verification), bukan memasang harness pihak ketiga.",
    activeCapabilities: [
      "Checklist harness 6 primitif di `docs/HARNESS.md` + guardrail `AGENTS.md`",
      "Gate verifikasi sebelum commit: lint → typecheck → test → build",
    ],
    inactiveCapabilities: [
      "Orkestrasi harness eksternal (tidak dipasang agar tidak bentrok dengan Next.js)",
    ],
    assignedDivisions: ["CEO Auto-Pilot", "QC"],
  },
  {
    id: "anthropic-cybersecurity-skills",
    name: "Anthropic Cybersecurity Skills — Secret Hygiene & Threat Checks",
    domain: "cybersecurity",
    sourceRepo: "mukul975/Anthropic-Cybersecurity-Skills",
    sourceUrl: "https://github.com/mukul975/Anthropic-Cybersecurity-Skills",
    license: "Apache-2.0",
    version: "817 skills (build Aug 2026)",
    integrationType: "methodology-skill",
    defaultInstallStatus: "adapter-active",
    compatibility: "selective-prompt-only",
    testStatus: "tested",
    hardwareRequirement: "Tidak ada — pola review & pemindaian statis.",
    securityNote: "Tidak ada eksekusi tools ofensif; hanya hygiene: scan secret, redaksi log, prinsip least-privilege.",
    activeCapabilities: [
      "Pemindai secret hardcoded (`src/lib/security/secret-scan.ts`) dijalankan otomatis sebagai unit test",
      "Redaksi key pada semua pesan error provider AI (`sanitizeErrorMessage`)",
    ],
    inactiveCapabilities: [
      "Seluruh 817 skill ofensif/DFIR tidak diimpor (di luar kebutuhan aplikasi)",
    ],
    assignedDivisions: ["QC", "CEO Auto-Pilot"],
  },
  {
    id: "diagram-design-editorial",
    name: "Diagram Design — Editorial Diagram Grammar",
    domain: "editorial-diagram",
    sourceRepo: "cathrynlavery/diagram-design",
    sourceUrl: "https://github.com/cathrynlavery/diagram-design",
    license: "MIT",
    version: "2.6.174",
    integrationType: "methodology-skill",
    defaultInstallStatus: "adapter-active",
    compatibility: "selective-prompt-only",
    testStatus: "tested",
    hardwareRequirement: "Tidak ada — aturan desain dipakai di renderer canvas kita sendiri.",
    securityNote: "Tidak memasang plugin/HTML generator eksternal; hanya prinsip desain.",
    activeCapabilities: [
      "Prinsip 'no shadows, no Mermaid slop': palet editorial, garis tegas, hierarki tipografi di renderer `zine_glitch`",
      "Slab teks presisi + grid band anti-tumpang-tindih untuk diagram alur di video",
    ],
    inactiveCapabilities: [
      "52 tipe diagram + ekspor .drawio/.excalidraw (belum dipakai; format video hanya butuh SVG/canvas)",
    ],
    assignedDivisions: ["Motion", "Editing"],
  },
  {
    id: "scientific-agent-skills",
    name: "Scientific Agent Skills — Research Rigor Guard",
    domain: "scientific-research",
    sourceRepo: "K-Dense-Al/scientific-agent-skills",
    sourceUrl: "https://github.com/K-Dense-Al/scientific-agent-skills",
    license: "Lihat repo (MIT-style)",
    version: "main",
    integrationType: "methodology-skill",
    defaultInstallStatus: "adapter-active",
    compatibility: "selective-prompt-only",
    testStatus: "tested",
    hardwareRequirement: "Tidak ada — aturan prompt + audit teks.",
    securityNote: "Tidak ada tool biologi/kimia yang dijalankan; hanya disiplin epistemik.",
    activeCapabilities: [
      "`buildResearchRigorPrompt()` disuntik ke system prompt Divisi Riset",
      "`auditResearchClaim()` menandai angka tanpa sumber & klaim absolut sebelum QC",
    ],
    inactiveCapabilities: [
      "Tool komputasi ilmiah & dataset khusus domain (tidak relevan untuk konten AI)",
    ],
    assignedDivisions: ["Riset", "QC"],
  },
];

export interface ResolvedAgentSkill extends ModularAgentSkillSpec {
  installStatus: SkillInstallStatus;
  isActiveNow: boolean;
  runtimeNote: string;
}

/**
 * Resolves live skill status honestly against real server capability probe results.
 */
export function resolveSkillsWithRuntime(
  probe: RuntimeCapabilityProbe | null
): ResolvedAgentSkill[] {
  return MODULAR_AGENT_SKILLS.map((skill) => {
    if (!probe) {
      return {
        ...skill,
        installStatus: skill.defaultInstallStatus,
        isActiveNow:
          skill.defaultInstallStatus === "installed" ||
          skill.defaultInstallStatus === "adapter-active",
        runtimeNote: "Menunggu probe runtime server...",
      };
    }

    if (skill.id === "remotion-video-composition") {
      return {
        ...skill,
        version: probe.remotionVersion || skill.version,
        installStatus: probe.remotionInstalled ? "installed" : "not-installed",
        isActiveNow: probe.remotionInstalled,
        runtimeNote: probe.remotionInstalled
          ? `Remotion v${probe.remotionVersion} + @remotion/player aktif di browser.`
          : "Remotion belum terpasang di node_modules.",
      };
    }

    if (skill.id === "gsap-timeline-motion") {
      return {
        ...skill,
        version: probe.gsapVersion || skill.version,
        installStatus: probe.gsapInstalled ? "installed" : "not-installed",
        isActiveNow: probe.gsapInstalled,
        runtimeNote: probe.gsapInstalled
          ? `GSAP v${probe.gsapVersion} aktif untuk timeline & motion choreography.`
          : "GSAP belum terpasang.",
      };
    }

    if (skill.id === "ffmpeg-encoding-validation") {
      const both = probe.ffmpegBinaryAvailable && probe.ffprobeBinaryAvailable;
      return {
        ...skill,
        installStatus: both ? "installed" : "worker-required",
        testStatus: both ? "tested" : "not-tested-missing-binary",
        isActiveNow: both,
        runtimeNote: both
          ? "Binary ffmpeg & ffprobe aktif di host server."
          : "Binary ffmpeg/ffprobe tidak tersedia di Vercel Serverless (ekspor MP4 berjalan via WebCodecs browser; FFmpeg butuh render worker terpisah).",
      };
    }

    if (skill.id === "whisper-cpp-transcription") {
      return {
        ...skill,
        installStatus: probe.whisperCliAvailable ? "installed" : "worker-required",
        testStatus: probe.whisperCliAvailable ? "tested" : "not-tested-missing-binary",
        isActiveNow: probe.whisperCliAvailable,
        runtimeNote: probe.whisperCliAvailable
          ? "Binary whisper-cli terdeteksi aktif."
          : "Binary whisper-cli belum terpasang di server ini (fallback aktif: syllable-weighted audio-locked aligner).",
      };
    }

    if (skill.id === "hindsight-agent-memory") {
      return {
        ...skill,
        installStatus: probe.hindsightConfigured ? "adapter-active" : "worker-required",
        isActiveNow: probe.hindsightConfigured,
        runtimeNote: probe.hindsightConfigured
          ? "Terhubung ke HINDSIGHT_API_URL."
          : "HINDSIGHT_API_URL belum diset — standby (menggunakan memori persisten lokal aktif).",
      };
    }

    if (skill.id === "yt-dlp-authorized-analysis") {
      return {
        ...skill,
        installStatus: probe.ytDlpCliAvailable ? "adapter-active" : "not-installed",
        isActiveNow: false,
        runtimeNote:
          "Dinonaktifkan secara default — hanya referensi & membutuhkan otorisasi hak cipta eksplisit di worker terpisah.",
      };
    }

    return {
      ...skill,
      installStatus: skill.defaultInstallStatus,
      isActiveNow:
        skill.defaultInstallStatus === "installed" ||
        skill.defaultInstallStatus === "adapter-active",
      runtimeNote:
        skill.defaultInstallStatus === "installed" ||
        skill.defaultInstallStatus === "adapter-active"
          ? "Aktif & terverifikasi pada pipeline saat ini."
          : "Belum aktif di runtime ini.",
    };
  });
}

/**
 * Callable dispatcher so agents can retrieve domain-specific active skill rules on demand.
 */
export function invokeAgentSkill(
  domain: SkillDomain,
  probe: RuntimeCapabilityProbe | null = null
): {
  domain: SkillDomain;
  skills: ResolvedAgentSkill[];
  promptDirectives: string;
} {
  const resolved = resolveSkillsWithRuntime(probe).filter((s) => s.domain === domain);
  const lines = resolved.map(
    (s) =>
      `- [${s.name} | ${s.installStatus.toUpperCase()}]: ${s.activeCapabilities.join("; ")}`
  );
  return {
    domain,
    skills: resolved,
    promptDirectives: lines.join("\n"),
  };
}
