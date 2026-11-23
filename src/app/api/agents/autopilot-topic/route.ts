import { NextResponse } from "next/server";
import { callFreeTierLLM } from "@/lib/ai/llm-provider";
import { buildInstalledSkillsPrompt } from "@/lib/ai/github-skills-registry";
import type { PublishPlatform } from "@/lib/kids-studio/episode-brain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface AutopilotTopicRequest {
  pastTopics?: string[];
  compressedMemories?: string[];
  episodeCount?: number;
}

interface AutopilotTopicResponse {
  theme: string;
  platform: PublishPlatform;
  niche: string;
  reasoning: string;
  viralHookPreview: string;
}

const VALID_PLATFORMS: PublishPlatform[] = [
  "youtube_shorts",
  "tiktok",
  "youtube_landscape",
];

const FALLBACK_VIRAL_TOPICS: AutopilotTopicResponse[] = [
  {
    theme: "3 tools AI gratis 2026 yang diam-diam menggantikan 4 jam kerja admin setiap hari",
    platform: "youtube_shorts",
    niche: "AI & Produktivitas",
    reasoning: "Topik AI praktis dengan angka penghematan waktu konkret memiliki CTR dan retensi tinggi di YouTube Shorts Indonesia.",
    viralHookPreview: "Masih kerja manual 4 jam sehari? 3 AI gratis ini bisa kelarin semuanya dalam 10 menit!",
  },
  {
    theme: "Aturan 50-30-20 sering gagal di gaji UMR Indonesia — ini formula realistis yang benar-benar jalan",
    platform: "youtube_shorts",
    niche: "Keuangan Pribadi",
    reasoning: "Angle kontrarian yang relevan dengan realita pekerja Indonesia memicu komentar & share organik tinggi.",
    viralHookPreview: "Kenapa aturan gaji 50-30-20 bikin kamu malah boncos di tanggal 20?",
  },
  {
    theme: "Kenapa otak cepat lelah setelah 15 menit scrolling — sains dopamin & cara reset fokus dalam 72 jam",
    platform: "tiktok",
    niche: "Psikologi & Fokus",
    reasoning: "Masalah fokus generasi digital sangat relatable dengan nilai edukatif tinggi & grafik data menarik.",
    viralHookPreview: "Pernah baru buka HP 5 menit tapi tiba-tiba sudah 2 jam dan kepala terasa kosong?",
  },
  {
    theme: "Rahasia algoritma video 2026: kenapa video 300 views bisa mendadak tembus 100 ribu setelah 7 hari",
    platform: "youtube_shorts",
    niche: "Kreator & Algoritma",
    reasoning: "Sangat relevan bagi kreator & pebisnis digital yang ingin memahami retensi dan distribusi konten modern.",
    viralHookPreview: "Jangan hapus video yang baru 300 views — ini cara kerja mesin rekomendasi sebenarnya!",
  },
  {
    theme: "5 kebiasaan kecil pemilik bisnis UMKM yang omzetnya stabil naik meski ekonomi lagi melambat",
    platform: "youtube_landscape",
    niche: "Bisnis & UMKM",
    reasoning: "Konten bisnis praktis dengan angka konkret punya nilai simpan (save) dan watch time panjang.",
    viralHookPreview: "Kenapa warung sebelah selalu ramai padahal harganya lebih mahal 20%?",
  },
];

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as AutopilotTopicRequest;
    const pastTopics = Array.isArray(body.pastTopics)
      ? body.pastTopics.slice(0, 25)
      : [];
    const compressedMemories = Array.isArray(body.compressedMemories)
      ? body.compressedMemories.slice(0, 10)
      : [];
    const episodeCount = Number(body.episodeCount || 0);

    const { promptBlock, activeSkillRepos } =
      buildInstalledSkillsPrompt("autopilot");

    const systemPrompt = `Kamu adalah CEO & Kepala Strategi Konten Otonom di "FAJREZZZ AI OFFICE".
Tugasmu: memilih 1 topik video viral berbahasa Indonesia secara MANDIRI (tanpa menunggu ketikan Bos) untuk langsung diproduksi otomatis oleh 7 Divisi (Riset → SEO → Naskah → Suara Neural → Motion Grafis Kinetik → Editing Video → QC).

${promptBlock}

ATURAN WAJIB:
1. Topik HARUS segar, spesifik, bernilai tinggi, dan cocok untuk penonton umum Indonesia (AI/teknologi praktis, keuangan cerdas, psikologi/produktivitas, bisnis UMKM, fakta sains/sejarah modern, strategi kreator) — BUKAN kartun anak-anak.
2. DILARANG mengulang atau terlalu mirip dengan daftar topik yang sudah pernah dibuat.
3. Prioritaskan format "youtube_shorts" atau "tiktok" (cepat ditonton, ritme tinggi) untuk sebagian besar episode, dan sesekali "youtube_landscape".
4. Balas HANYA dalam JSON valid tanpa teks tambahan:
{
  "theme": "Tema spesifik 1 kalimat yang kaya angle & angka nyata",
  "platform": "youtube_shorts | tiktok | youtube_landscape",
  "niche": "Nama niche singkat",
  "reasoning": "Alasan strategis singkat kenapa topik ini berpotensi viral & tinggi retensi",
  "viralHookPreview": "Contoh kalimat hook 3 detik pertama yang tajam"
}`;

    const userPrompt = `Nomor Episode Berikutnya: #${episodeCount + 1}
Tanggal hari ini: ${new Date().toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "full" })}
Daftar topik lama yang WAJIB DIHINDARI:
${pastTopics.length > 0 ? pastTopics.map((t, i) => `${i + 1}. ${t}`).join("\n") : "(Belum ada episode — ini episode perdana!)"}

Memori jangka panjang kantor (ai-memory / claude-mem):
${compressedMemories.length > 0 ? compressedMemories.map((m) => `- ${m}`).join("\n") : "(Shift baru dimulai)"}

Pilih 1 topik paling tajam, segar, dan siap langsung masuk produksi video otomatis sekarang!`;

    const llm = await callFreeTierLLM<Partial<AutopilotTopicResponse>>({
      systemPrompt,
      userPrompt,
      expectJson: true,
      temperature: 0.9,
      maxTokens: 550,
      timeoutMs: 22000,
    });

    if (llm.ok && llm.parsed?.theme && llm.parsed.theme.trim().length >= 12) {
      const rawPlatform = llm.parsed.platform as PublishPlatform;
      const platform: PublishPlatform = VALID_PLATFORMS.includes(rawPlatform)
        ? rawPlatform
        : "youtube_shorts";

      return NextResponse.json({
        ok: true,
        source: "ai",
        provider: llm.provider,
        model: llm.model,
        durationMs: llm.durationMs,
        activeSkillsUsed: activeSkillRepos,
        data: {
          theme: llm.parsed.theme.trim().slice(0, 180),
          platform,
          niche: (llm.parsed.niche || "Konten Viral Indonesia").trim().slice(0, 50),
          reasoning: (
            llm.parsed.reasoning ||
            "Dipilih otomatis oleh AI CEO berdasarkan potensi retensi & pencarian organik."
          )
            .trim()
            .slice(0, 260),
          viralHookPreview: (
            llm.parsed.viralHookPreview ||
            "Tunggu dulu — fakta ini bakal mengubah cara kamu bekerja hari ini!"
          )
            .trim()
            .slice(0, 160),
        } satisfies AutopilotTopicResponse,
      });
    }

    // Resilient fallback if all free LLM endpoints momentarily throttle
    const lowerPast = pastTopics.map((p) => p.toLowerCase());
    const freshFallback =
      FALLBACK_VIRAL_TOPICS.find(
        (f) => !lowerPast.some((p) => p.includes(f.niche.toLowerCase()))
      ) ?? FALLBACK_VIRAL_TOPICS[episodeCount % FALLBACK_VIRAL_TOPICS.length];

    return NextResponse.json({
      ok: true,
      source: "curated-fallback",
      provider: "autopilot-fallback",
      model: "deterministic-radar",
      durationMs: 0,
      activeSkillsUsed: activeSkillRepos,
      data: freshFallback,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error ? err.message : "Autopilot topic selection failed",
      },
      { status: 500 }
    );
  }
}
