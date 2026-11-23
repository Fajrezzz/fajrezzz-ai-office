/**
 * Fajrezzz AI Office — Installed GitHub AI Agent Skills & Modules Registry (19 Modules)
 *
 * Distills structured agent playbooks, architecture patterns, and prompt directives
 * inspired by the 19 open-source GitHub repositories installed into our autonomous AI team.
 * Every module is mapped directly to divisions, 3D staff agents, and live LLM/video pipelines.
 */

export type SkillCategory =
  | "marketing_growth"
  | "agent_orchestration"
  | "memory_context"
  | "video_motion_voice"
  | "research_data"
  | "design_qa_ops";

export interface InstalledGitHubSkill {
  id: string;
  repo: string;
  name: string;
  url: string;
  license: string;
  category: SkillCategory;
  summaryId: string;
  assignedDivisions: string[];
  assignedAgents: string[];
  /** Real actionable prompt directive injected into server AI calls for assigned divisions */
  promptDirective: string;
}

export const INSTALLED_GITHUB_SKILLS: InstalledGitHubSkill[] = [
  {
    id: "marketingskills",
    repo: "coreyhaines31/marketingskills",
    name: "Marketing Skills (CRO, Copywriting, SEO)",
    url: "https://github.com/coreyhaines31/marketingskills",
    license: "MIT",
    category: "marketing_growth",
    summaryId: "Playbook CRO, copywriting tajam, AI-SEO, psikologi klik & growth loop.",
    assignedDivisions: ["research", "seo", "script", "autopilot"],
    assignedAgents: ["Raka (Riset)", "Nadia (SEO)", "Dimas (Naskah)"],
    promptDirective:
      "[marketingskills] Gunakan psikologi rasa ingin tahu + angka konkret pada hook 3 detik pertama, hindari kalimat basa-basi, dan pastikan setiap poin punya manfaat praktis yang langsung bisa dipraktikkan penonton.",
  },
  {
    id: "linkedin-skills",
    repo: "sergebulaev/linkedin-skills",
    name: "LinkedIn Content Engineering Skills",
    url: "https://github.com/sergebulaev/linkedin-skills",
    license: "MIT",
    category: "marketing_growth",
    summaryId: "Gaya bahasa manusiawi non-robotik, struktur cerita engaging & ritme posting.",
    assignedDivisions: ["script", "research", "think", "autopilot"],
    assignedAgents: ["Dimas (Naskah)", "Raka (Riset)"],
    promptDirective:
      "[linkedin-skills] Tulis narasi layaknya manusia sungguhan berbicara ke teman dekat — kalimat pendek, ritme ritmis, kontras realita vs ekspektasi, ZERO frasa klise AI seperti 'Di era digital saat ini' atau 'Kesimpulannya'.",
  },
  {
    id: "hallmark",
    repo: "Nutlope/hallmark",
    name: "Hallmark Anti-AI-Slop Design Skill",
    url: "https://github.com/Nutlope/hallmark",
    license: "MIT",
    category: "design_qa_ops",
    summaryId: "Standar desain anti-AI-slop: tipografi editorial kontras tinggi, grid presisi & visual tajam.",
    assignedDivisions: ["motion", "editing", "seo", "qc"],
    assignedAgents: ["Clara (Motion)", "Fajar (Editing)", "Nadia (SEO)"],
    promptDirective:
      "[hallmark] Anti-AI-slop: buat headline thumbnail & teks layar maksimal 3–6 kata super tajam, kontras editorial tinggi, tanpa klikbait murahan dan tanpa kalimat generik.",
  },
  {
    id: "hyperframes",
    repo: "heygen-com/hyperframes",
    name: "Hyperframes AI Motion Video Engine",
    url: "https://github.com/heygen-com/hyperframes",
    license: "Apache-2.0",
    category: "video_motion_voice",
    summaryId: "Komposisi video berbasis kode: animasi motion teks kinetik, transisi adegan & render video.",
    assignedDivisions: ["motion", "editing", "script"],
    assignedAgents: ["Clara (Motion)", "Fajar (Editing)"],
    promptDirective:
      "[hyperframes] Rancang setiap adegan dengan satu visualCue dinamis + subtitle motion-teks singkat (4–8 kata per potongan) yang sinkron dengan animasi kinetik dan pergantian adegan cepat tiap 4–7 detik.",
  },
  {
    id: "voicebox",
    repo: "jamiepine/voicebox",
    name: "Voicebox Open-Source AI Voice Studio",
    url: "https://github.com/jamiepine/voicebox",
    license: "MIT",
    category: "video_motion_voice",
    summaryId: "Pengarah suara neural natural, intonasi conversational & jeda napas presisi.",
    assignedDivisions: ["voice", "script"],
    assignedAgents: ["Bima (Suara)", "Dimas (Naskah)"],
    promptDirective:
      "[voicebox] Tulis kalimat narasi yang enak dilafalkan suara neural Bahasa Indonesia: gunakan koma/titik sebagai jeda napas natural, hindari singkatan rumit, dan jaga durasi tiap adegan padat & bertenaga.",
  },
  {
    id: "comfyui",
    repo: "Comfy-Org/ComfyUI",
    name: "ComfyUI Modular Visual Node Graph",
    url: "https://github.com/Comfy-Org/ComfyUI",
    license: "GPL-3.0",
    category: "video_motion_voice",
    summaryId: "Alur visual berbasis node grafis (Scene Prompt → Mood Palette → Kinetic Overlay → Composite).",
    assignedDivisions: ["motion", "editing"],
    assignedAgents: ["Clara (Motion)", "Fajar (Editing)"],
    promptDirective:
      "[ComfyUI] Susun arahan visual berlapis seperti node graph: latar atmosferik + objek fokus utama + aksen cahaya mood + teks kinetik kontras tinggi.",
  },
  {
    id: "openrig",
    repo: "mvschwarz/openrig",
    name: "OpenRig Persistent Agent Network",
    url: "https://github.com/mvschwarz/openrig",
    license: "Apache-2.0",
    category: "agent_orchestration",
    summaryId: "Jaringan tim agen persisten dengan peran spesifik, konteks bersama & kepemilikan tugas.",
    assignedDivisions: ["think", "autopilot", "research", "seo", "script", "qc"],
    assignedAgents: ["Semua 22 Staf Kantor 3D"],
    promptDirective:
      "[openrig] Bertindaklah sebagai spesialis yang memiliki tanggung jawab penuh atas divisimu dan menyerahkan output terstruktur bersih siap pakai ke divisi berikutnya.",
  },
  {
    id: "orca",
    repo: "stablyai/orca",
    name: "Orca Autonomous Bot Fleet Runtime",
    url: "https://github.com/stablyai/orca",
    license: "MIT",
    category: "agent_orchestration",
    summaryId: "Menjalankan armada agen AI secara otonom lintas desktop & mobile tanpa klik manual.",
    assignedDivisions: ["autopilot", "think"],
    assignedAgents: ["CEO & Auto-Pilot Runner"],
    promptDirective:
      "[orca] Jalankan orkestrasi armada 7 divisi end-to-end secara mandiri dari pemilihan topik, produksi, hingga ekspor video selesai.",
  },
  {
    id: "ai-memory",
    repo: "akitaonrails/ai-memory",
    name: "AI Memory Long-Term Cross-Vendor Ledger",
    url: "https://github.com/akitaonrails/ai-memory",
    license: "MIT",
    category: "memory_context",
    summaryId: "Memori jangka panjang lintas penyedia AI (Groq ↔ Gemini ↔ OpenRouter) & handoff konteks.",
    assignedDivisions: ["autopilot", "think", "research", "qc"],
    assignedAgents: ["Reza (Manajer)", "Raka (Riset)", "Alya (QC)"],
    promptDirective:
      "[ai-memory] Rujuk memori jangka panjang episode & eksperimen sebelumnya; JANGAN pernah mengulang topik, struktur, atau sudut pandang yang sudah pernah diproduksi.",
  },
  {
    id: "claude-mem",
    repo: "thedotmack/claude-mem",
    name: "Claude-Mem Session Context Compression",
    url: "https://github.com/thedotmack/claude-mem",
    license: "Apache-2.0",
    category: "memory_context",
    summaryId: "Menangkap seluruh aktivitas agen, mengompresi jadi insight ringkas & menyuntikkannya ke sesi berikutnya.",
    assignedDivisions: ["autopilot", "think", "research", "script"],
    assignedAgents: ["Semua 22 Staf Kantor 3D"],
    promptDirective:
      "[claude-mem] Bangun ide baru di atas pembelajaran sesi sebelumnya agar kualitas hook, retensi, dan kedalaman informasi terus meningkat di setiap episode.",
  },
  {
    id: "claude-plugins-official",
    repo: "anthropics/claude-plugins-official",
    name: "Anthropic Official Agent Plugin Architecture",
    url: "https://github.com/anthropics/claude-plugins-official",
    license: "Apache-2.0",
    category: "agent_orchestration",
    summaryId: "Arsitektur plugin modular terstandarisasi untuk kemampuan & tool tiap divisi agen.",
    assignedDivisions: ["think", "autopilot", "research", "seo", "script", "qc"],
    assignedAgents: ["Reza (Manajer)", "Hendra (CEO)"],
    promptDirective:
      "[claude-plugins] Ikuti kontrak skema JSON yang ketat dan modular agar tiap plugin divisi terhubung mulus tanpa error parsing.",
  },
  {
    id: "scrapegraph-ai",
    repo: "ScrapeGraphAI/Scrapegraph-ai",
    name: "ScrapeGraph-AI Intelligent Extraction",
    url: "https://github.com/ScrapeGraphAI/Scrapegraph-ai",
    license: "MIT",
    category: "research_data",
    summaryId: "Ekstraksi pola tren, pain-point audiens & celah konten berbasis graf riset AI.",
    assignedDivisions: ["research", "autopilot"],
    assignedAgents: ["Raka (Riset)"],
    promptDirective:
      "[scrapegraph-ai] Ekstrak sudut tren paling spesifik dengan masalah nyata yang sedang ramai dicari audiens Indonesia (AI, keuangan, teknologi, produktivitas, bisnis praktis).",
  },
  {
    id: "scrapling",
    repo: "D4Vinci/Scrapling",
    name: "Scrapling Adaptive Signal Discovery",
    url: "https://github.com/D4Vinci/Scrapling",
    license: "BSD-3-Clause",
    category: "research_data",
    summaryId: "Radar penemuan sinyal tren adaptif & diversifikasi sudut konten anti-jenuh.",
    assignedDivisions: ["research", "autopilot", "seo"],
    assignedAgents: ["Raka (Riset)", "Nadia (SEO)"],
    promptDirective:
      "[Scrapling] Pilih sudut yang jarang dibahas kompetitor tapi punya rasa penasaran tinggi dan pencarian organik stabil.",
  },
  {
    id: "data-formulator",
    repo: "microsoft/data-formulator",
    name: "Microsoft Data Formulator Visual Analytics",
    url: "https://github.com/microsoft/data-formulator",
    license: "MIT",
    category: "research_data",
    summaryId: "Mengubah fakta & angka menjadi visual grafik animasi & KPI yang mudah dipahami penonton.",
    assignedDivisions: ["research", "script", "motion"],
    assignedAgents: ["Raka (Riset)", "Clara (Motion)", "Dimas (Naskah)"],
    promptDirective:
      "[data-formulator] Sertakan minimal 1–2 angka perbandingan / persentase nyata dalam naskah & teks layar agar Divisi Motion otomatis menggambar grafik data animasi yang meyakinkan.",
  },
  {
    id: "ai-engineering-from-scratch",
    repo: "rohitg00/ai-engineering-from-scratch",
    name: "AI Engineering (Evals, Routing & Structured Output)",
    url: "https://github.com/rohitg00/ai-engineering-from-scratch",
    license: "MIT",
    category: "design_qa_ops",
    summaryId: "Arsitektur LLM routing multi-provider, validasi output terstruktur & evaluasi kualitas otomatis.",
    assignedDivisions: ["qc", "think", "autopilot"],
    assignedAgents: ["Alya (QC)", "Reza (Manajer)"],
    promptDirective:
      "[ai-engineering] Lakukan self-critique sebelum output: pastikan fakta masuk akal, alur logis, durasi presisi, dan JSON 100% valid.",
  },
  {
    id: "git-bug",
    repo: "git-bug/git-bug",
    name: "Git-Bug Offline-First QC Issue Tracker",
    url: "https://github.com/git-bug/git-bug",
    license: "GPL-3.0",
    category: "design_qa_ops",
    summaryId: "Pelacakan bug/blocker kualitas konten offline-first pada Divisi QC sebelum publish.",
    assignedDivisions: ["qc"],
    assignedAgents: ["Alya (QC)"],
    promptDirective:
      "[git-bug] Catat setiap temuan kualitas atau risiko duplikasi sebagai checklist blocker yang terukur dan bisa langsung diperbaiki.",
  },
  {
    id: "atlas-os",
    repo: "Atlas-OS/Atlas",
    name: "Atlas-OS Lightweight Performance Blueprint",
    url: "https://github.com/Atlas-OS/Atlas",
    license: "GPL-3.0",
    category: "design_qa_ops",
    summaryId: "Optimasi performa ringan, minim latency & eksekusi mulus di perangkat mobile/HP.",
    assignedDivisions: ["motion", "editing"],
    assignedAgents: ["Fajar (Editing)", "Tania (Ops)"],
    promptDirective:
      "[Atlas-OS] Jaga pacing video tetap ringkas, padat tanpa dead-air, dan ringan dirender pada perangkat apapun.",
  },
  {
    id: "t3code",
    repo: "pingdotgg/t3code",
    name: "T3Code Mobile & Remote Agent Command",
    url: "https://github.com/pingdotgg/t3code",
    license: "MIT",
    category: "agent_orchestration",
    summaryId: "Kontrol armada agen AI secara real-time langsung dari HP maupun komputer.",
    assignedDivisions: ["autopilot", "think"],
    assignedAgents: ["Tania (Ops)", "BOS FAJREZ HUD"],
    promptDirective:
      "[t3code] Laporkan progres singkat, jelas, dan mudah dipantau langsung dari layar ponsel Bos Fajrez.",
  },
  {
    id: "openmausbot",
    repo: "milind-soni/OpenMausBot",
    name: "OpenMausBot Virtual Sandbox Agent Runtime",
    url: "https://github.com/milind-soni/OpenMausBot",
    license: "Apache-2.0",
    category: "agent_orchestration",
    summaryId: "Agen otonom yang bekerja mandiri di lingkungan virtual workspace hingga tugas tuntas.",
    assignedDivisions: ["autopilot", "think", "editing"],
    assignedAgents: ["Semua 22 Staf Kantor 3D"],
    promptDirective:
      "[OpenMausBot] Eksekusi tugas secara proaktif sampai menghasilkan deliverable nyata yang siap ditonton/diunduh tanpa menunggu instruksi berulang.",
  },
  {
    id: "moneyprinterturbo",
    repo: "harry0703/MoneyPrinterTurbo",
    name: "MoneyPrinterTurbo Automated AI Short Video Engine",
    url: "https://github.com/harry0703/MoneyPrinterTurbo",
    license: "MIT",
    category: "video_motion_voice",
    summaryId: "Pipeline video pendek otomatis: Topik → Naskah → AI B-Roll sinematik per adegan → Suara TTS → Subtitle kinetik → SFX & BGM → Video HD.",
    assignedDivisions: ["script", "voice", "motion", "editing", "autopilot"],
    assignedAgents: ["Dimas (Naskah)", "Bima (Suara)", "Clara (Motion)", "Fajar (Editing)"],
    promptDirective:
      "[MoneyPrinterTurbo] Setiap adegan WAJIB punya visualCue sinematik konkret yang bisa langsung digenerate menjadi AI B-Roll berkelas (misal: 'futuristic neon data dashboard dark studio cinematic lighting'), pacing cepat 3–6 detik per cut, dan kalimat punchy untuk subtitle kinetik.",
  },
  {
    id: "andrej-karpathy-skills",
    repo: "multica-ai/andrej-karpathy-skills",
    name: "Andrej Karpathy Agent Discipline & Precision",
    url: "https://github.com/multica-ai/andrej-karpathy-skills",
    license: "MIT",
    category: "design_qa_ops",
    summaryId: "Disiplin agen ala Karpathy: berpikir jernih sebelum bertindak, kesederhanaan tajam, perubahan bedah presisi & verifikasi berbasis target.",
    assignedDivisions: ["think", "autopilot", "research", "script", "qc"],
    assignedAgents: ["Reza (Manajer)", "Alya (QC)", "Hendra (CEO)"],
    promptDirective:
      "[karpathy-guidelines] Utamakan kejelasan dan kesederhanaan tajam: buang kalimat bertele-tele, uji asumsi sebelum menyimpulkan, dan verifikasi setiap output terhadap target retensi & kualitas nyata.",
  },
  {
    id: "agency-agents",
    repo: "msitarzewski/agency-agents",
    name: "Agency-Agents Complete Multi-Division AI Personas",
    url: "https://github.com/msitarzewski/agency-agents",
    license: "MIT",
    category: "agent_orchestration",
    summaryId: "Persona spesialis agensi AI lengkap lintas divisi (Marketing, Design, Engineering, Reality Checker QC) dengan SOP & deliverable terbukti.",
    assignedDivisions: ["think", "autopilot", "research", "seo", "script", "qc"],
    assignedAgents: ["Semua 22 Staf Kantor 3D"],
    promptDirective:
      "[agency-agents] Bekerjalah sesuai persona ahli divisimu dengan standar agensi kelas dunia + Reality Checker QC: pastikan deliverable konkret, unik, tajam, dan siap publikasi.",
  },
];

/**
 * Retrieve all installed GitHub skills relevant to a specific division or autonomous mode
 * and build a concise, high-signal system prompt block for the LLM.
 */
export function buildInstalledSkillsPrompt(
  scope: "autopilot" | "think" | "research" | "seo" | "script" | "qc"
): { promptBlock: string; activeSkillRepos: string[] } {
  const matched = INSTALLED_GITHUB_SKILLS.filter((s) =>
    s.assignedDivisions.includes(scope)
  );
  const promptBlock = [
    `MODUL GITHUB AI SKILLS TERPASANG AKTIF (${matched.length}/${INSTALLED_GITHUB_SKILLS.length} modul):`,
    ...matched.map((s) => `- ${s.promptDirective}`),
  ].join("\n");

  return {
    promptBlock,
    activeSkillRepos: matched.map((s) => s.repo),
  };
}
