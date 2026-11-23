import { NextResponse } from "next/server";
import { callFreeTierLLM } from "@/lib/ai/llm-provider";
import { buildInstalledSkillsPrompt } from "@/lib/ai/github-skills-registry";
import {
  buildRecencyPromptBlock,
  classifyRecency,
  summarizeRecency,
} from "@/lib/ai/research-recency";
import { fetchLiveAiTrends } from "@/lib/ai/trend-intelligence";
import type { PublishPlatform } from "@/lib/kids-studio/episode-brain";
import type {
  TikTokContentFormat,
  TrendSourceRecord,
  VisualStyleId,
} from "@/types/pipeline";

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
  contentFormat: TikTokContentFormat;
  visualStyle: VisualStyleId;
  sourceName: string;
  sourceUrl: string;
  sourcePublishedAt: string;
  sourceVerified: boolean;
  trendVerificationNote: string;
  verifiedTrends: TrendSourceRecord[];
}

const VALID_FORMATS: TikTokContentFormat[] = [
  "breaking_ai_news",
  "ai_tools_must_know",
  "claude_code_experiment",
  "ai_agent_vs_human",
  "before_after_automation",
  "ai_coding_tutorial",
  "ai_agent_builds_project",
  "myth_vs_reality",
  "surprising_experiment",
  "feature_visual_demo",
];

const VALID_STYLES: VisualStyleId[] = [
  "dark_ai_cinematic",
  "tech_documentary",
  "cyberpunk_dev",
  "clean_tutorial",
  "agent_3d_network",
  "minimal_kinetic",
  "high_energy_news",
  "zine_glitch",
];

const CURATED_AI_AGENT_FALLBACKS: Array<{
  theme: string;
  niche: string;
  reasoning: string;
  viralHookPreview: string;
  contentFormat: TikTokContentFormat;
  visualStyle: VisualStyleId;
}> = [
  {
    theme:
      "Cara kerja Claude Code di terminal untuk membaca repo, mengedit beberapa file sekaligus, dan menjalankan build otomatis",
    niche: "Claude Code & Terminal AI",
    reasoning:
      "Developer dan pembuat produk digital aktif mencari alur kerja nyata AI coding agent berbasis terminal.",
    viralHookPreview:
      "Stop copy-paste kode dari chat AI! Ini cara AI agent kerja langsung di terminal kamu.",
    contentFormat: "ai_coding_tutorial",
    visualStyle: "clean_tutorial",
  },
  {
    theme:
      "AI Agent vs Workflow Manual: membandingkan tahapan riset, coding, testing, dan pull request GitHub secara objektif",
    niche: "AI Agent vs Human Workflow",
    reasoning:
      "Perbandingan before-after workflow nyata membantu penonton memahami kapan AI agent efektif dan kapan tetap butuh review manusia.",
    viralHookPreview:
      "Kerjaan repo 4 jam bisa berubah drastis kalau AI agent bantu eksekusi terminal — tapi ada 1 syarat wajib.",
    contentFormat: "ai_agent_vs_human",
    visualStyle: "tech_documentary",
  },
  {
    theme:
      "Arsitektur Multi-Agent AI: bagaimana beberapa agent spesialis berbagi tugas riset, coding, dan QA seperti kantor virtual",
    niche: "Multi-Agent Systems",
    reasoning:
      "Konsep multi-agent dan karyawan virtual AI punya daya tarik visual tinggi lewat diagram alur node dan data flow.",
    viralHookPreview:
      "Satu AI saja sering lupa konteks. Ini alasan sistem multi-agent membagi tugas ke beberapa spesialis!",
    contentFormat: "feature_visual_demo",
    visualStyle: "agent_3d_network",
  },
  {
    theme:
      "Eksperimen membangun fitur web nyata dengan AI coding agent: dari prompt terminal sampai verifikasi build dan PR GitHub",
    niche: "AI Agent Builds Real Projects",
    reasoning:
      "Demonstrasi proses nyata dari prompt sampai verifikasi build memberi edukasi praktis tanpa melebih-lebihkan.",
    viralHookPreview:
      "Apa yang terjadi kalau AI agent disuruh bikin fitur lengkap dari nol lalu diuji build-nya sendiri?",
    contentFormat: "ai_agent_builds_project",
    visualStyle: "cyberpunk_dev",
  },
  {
    theme:
      "Mitos vs Fakta AI Coding Agent 2026: kenapa prompt panjang kalah penting dibanding verifikasi test dan struktur repo",
    niche: "Myth vs Reality AI Coding",
    reasoning:
      "Meluruskan ekspektasi berlebihan soal AI coding memberi nilai tinggi dan memicu diskusi sehat di kolom komentar TikTok.",
    viralHookPreview:
      "Banyak orang mengira AI coding gagal karena modelnya bodoh — padahal masalahnya di satu kebiasaan ini!",
    contentFormat: "myth_vs_reality",
    visualStyle: "minimal_kinetic",
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

    // 1. REAL TREND INTELLIGENCE: Fetch verified official GitHub releases & fresh community discussions!
    const trendReport = await fetchLiveAiTrends(90);
    // v9.3 (last30days): tren ≤ 30 hari didahulukan, yang lebih tua tetap ada
    // tapi ditandai umurnya supaya agent tidak mengklaim "baru" untuk berita lama.
    const recency = summarizeRecency(
      trendReport.items.map((t) => ({ name: t.sourceName, publishedAt: t.publishedAt }))
    );
    const freshFirst = [...trendReport.items].sort((a, b) => {
      const rank = (p: string) =>
        classifyRecency(p) === "fresh" ? 0 : classifyRecency(p) === "current" ? 1 : 2;
      return rank(a.publishedAt) - rank(b.publishedAt);
    });
    const topTrends = freshFirst.slice(0, 8);

    const { promptBlock, activeSkillRepos } =
      buildInstalledSkillsPrompt("autopilot");

    const systemPrompt = `Kamu adalah AI Creative Director & Kepala Trend Intelligence di "FAJREZZZ AI OFFICE".
PRIORITAS MUTLAK: Konten TikTok Vertical 9:16 (20–60 detik) khusus topik AI AGENT, CLAUDE CODE, AI CODING, MULTI-AGENT SYSTEMS, AI AUTOMATION, TERMINAL & GITHUB WORKFLOW, serta UPDATE AI TERKINI.

${promptBlock}
${buildRecencyPromptBlock()}

KESEGARAN SUMBER HARI INI: ${recency.verdict} (${recency.fresh} segar / ${recency.current} ≤30 hari / ${recency.stale} basi).

ATURAN INTEGRITAS KETAT (WAJIB):
1. Platform SELALU "tiktok" (Vertical 9:16). JANGAN pernah pilih YouTube landscape.
2. DILARANG KERAS mengarang fitur baru Claude Code/OpenAI/Gemini yang tidak ada di data sumber!
3. DILARANG KERAS mengarang angka views, jumlah pencarian, atau janji viral!
4. Jika tersedia daftar "TREN TERVERIFIKASI ONLINE" di bawah, pilih dan rujuk salah satu sumber resmi/komunitas yang belum dibahas di daftar topik lama, dan sertakan "sourceIndex" yang sesuai (0..N-1).
5. Jika daftar tren kosong, fokus pada tutorial/eksperimen/perbandingan arsitektur AI Agent & Claude Code yang faktual dan tandai "sourceIndex": -1.
6. DILARANG mengulang topik yang mirip dengan daftar topik sebelumnya.
7. Pilih sumber yang paling SEGAR (≤ 30 hari) bila kualitasnya setara; kalau memakai sumber lebih tua, sebutkan umurnya di reasoning.
8. Balas HANYA JSON valid:
{
  "theme": "Topik TikTok 9:16 spesifik 1 kalimat tentang AI Agent / Claude Code / AI Coding",
  "niche": "Nama sub-niche singkat (misal: Claude Code Workflow / Breaking AI Agent)",
  "reasoning": "Alasan objektif pemilihan topik berdasarkan nilai edukasi & retensi penonton",
  "viralHookPreview": "Hook 0-2 detik pertama yang langsung menghentikan scrolling tanpa clickbait bohong",
  "contentFormat": "breaking_ai_news | ai_tools_must_know | claude_code_experiment | ai_agent_vs_human | before_after_automation | ai_coding_tutorial | ai_agent_builds_project | myth_vs_reality | surprising_experiment | feature_visual_demo",
  "visualStyle": "zine_glitch | dark_ai_cinematic | tech_documentary | cyberpunk_dev | clean_tutorial | agent_3d_network | minimal_kinetic | high_energy_news",
  "sourceIndex": 0
}`;

    const trendBlock =
      topTrends.length > 0
        ? topTrends
            .map(
              (t, i) =>
                `[${i}] (${t.classification}, ${t.publishedAt.slice(0, 10)}, ${t.freshnessDays} hari lalu) ${t.title} — ${t.sourceName} (${t.sourceUrl}) | Ringkasan: ${t.summary}`
            )
            .join("\n")
        : "(TIDAK ADA DATA TREN ONLINE TERVERIFIKASI SAAT INI — fokus pada topik edukasi/eksperimen/perbandingan AI Agent faktual tanpa mengklaim breaking news baru.)";

    const userPrompt = `Episode TikTok Berikutnya: #${episodeCount + 1}
Tanggal hari ini: ${new Date().toISOString().slice(0, 10)}

TREN TERVERIFIKASI ONLINE (Trend Intelligence):
${trendBlock}

TOPIK LAMA YANG WAJIB DIHINDARI:
${pastTopics.length > 0 ? pastTopics.map((t, i) => `${i + 1}. ${t}`).join("\n") : "(Episode perdana)"}

MEMORI KANTOR:
${compressedMemories.length > 0 ? compressedMemories.map((m) => `- ${m}`).join("\n") : "(Shift baru)"}

Pilih 1 topik TikTok 9:16 paling menarik, faktual, dan berbeda dari episode sebelumnya!`;

    const llm = await callFreeTierLLM<
      Partial<AutopilotTopicResponse> & { sourceIndex?: number }
    >({
      taskType: "research",
      systemPrompt,
      userPrompt,
      expectJson: true,
      temperature: 0.8,
      maxTokens: 650,
      timeoutMs: 22000,
    });

    if (llm.ok && llm.parsed?.theme && llm.parsed.theme.trim().length >= 12) {
      const idx =
        typeof llm.parsed.sourceIndex === "number" &&
        llm.parsed.sourceIndex >= 0 &&
        llm.parsed.sourceIndex < topTrends.length
          ? llm.parsed.sourceIndex
          : topTrends.length > 0
          ? episodeCount % topTrends.length
          : -1;
      const chosenSource = idx >= 0 ? topTrends[idx] : null;

      const contentFormat: TikTokContentFormat = VALID_FORMATS.includes(
        llm.parsed.contentFormat as TikTokContentFormat
      )
        ? (llm.parsed.contentFormat as TikTokContentFormat)
        : chosenSource
        ? "breaking_ai_news"
        : "claude_code_experiment";

      const visualStyle: VisualStyleId = VALID_STYLES.includes(
        llm.parsed.visualStyle as VisualStyleId
      )
        ? (llm.parsed.visualStyle as VisualStyleId)
        : "dark_ai_cinematic";

      return NextResponse.json({
        ok: true,
        source: "ai",
        provider: llm.provider,
        model: llm.model,
        durationMs: llm.durationMs,
        activeSkillsUsed: activeSkillRepos,
        data: {
          theme: llm.parsed.theme.trim().slice(0, 200),
          platform: "tiktok",
          niche: (llm.parsed.niche || "AI Agent & Claude Code").trim().slice(0, 56),
          reasoning: (
            llm.parsed.reasoning ||
            "Dipilih oleh AI Creative Director berdasarkan relevansi teknis dan kejelasan visual untuk TikTok 9:16."
          )
            .trim()
            .slice(0, 280),
          viralHookPreview: (
            llm.parsed.viralHookPreview ||
            "Ini cara AI coding agent bekerja langsung di terminal kamu tanpa copy-paste manual!"
          )
            .trim()
            .slice(0, 170),
          contentFormat,
          visualStyle,
          sourceName: chosenSource
            ? chosenSource.sourceName
            : "Belum diverifikasi online (topik edukasi faktual)",
          sourceUrl: chosenSource?.sourceUrl ?? "",
          sourcePublishedAt: chosenSource?.publishedAt ?? new Date().toISOString(),
          sourceVerified: Boolean(chosenSource?.verified),
          trendVerificationNote: trendReport.verificationNote,
          verifiedTrends: topTrends,
        } satisfies AutopilotTopicResponse,
      });
    }

    // Honest deterministic fallback using verified GitHub trend if available, else factual AI Agent topic
    const lowerPast = pastTopics.map((p) => p.toLowerCase());
    const unusedTrend = topTrends.find(
      (t) => !lowerPast.some((p) => p.includes(t.title.toLowerCase().slice(0, 22)))
    );

    if (unusedTrend) {
      return NextResponse.json({
        ok: true,
        source: "verified-trend-fallback",
        provider: "trend-intelligence",
        model: "github-official-feed",
        durationMs: 0,
        activeSkillsUsed: activeSkillRepos,
        data: {
          theme: `${unusedTrend.title} — dampak praktis untuk workflow AI Agent & coding otomatis`,
          platform: "tiktok",
          niche: unusedTrend.tags[0] || "Breaking AI Agent",
          reasoning: `Diambil langsung dari sumber terverifikasi (${unusedTrend.sourceName}, dipublikasikan ${unusedTrend.publishedAt.slice(0, 10)}).`,
          viralHookPreview: `Update resmi baru saja rilis: ${unusedTrend.title.slice(0, 90)}!`,
          contentFormat: "breaking_ai_news",
          visualStyle: "high_energy_news",
          sourceName: unusedTrend.sourceName,
          sourceUrl: unusedTrend.sourceUrl,
          sourcePublishedAt: unusedTrend.publishedAt,
          sourceVerified: true,
          trendVerificationNote: trendReport.verificationNote,
          verifiedTrends: topTrends,
        } satisfies AutopilotTopicResponse,
      });
    }

    const curated =
      CURATED_AI_AGENT_FALLBACKS.find(
        (f) => !lowerPast.some((p) => p.includes(f.niche.toLowerCase()))
      ) ?? CURATED_AI_AGENT_FALLBACKS[episodeCount % CURATED_AI_AGENT_FALLBACKS.length];

    return NextResponse.json({
      ok: true,
      source: "curated-fallback",
      provider: "autopilot-fallback",
      model: "ai-agent-editorial",
      durationMs: 0,
      activeSkillsUsed: activeSkillRepos,
      data: {
        ...curated,
        platform: "tiktok",
        sourceName: "Tren online belum dapat diverifikasi (edukasi faktual AI Agent)",
        sourceUrl: "",
        sourcePublishedAt: new Date().toISOString(),
        sourceVerified: false,
        trendVerificationNote: trendReport.verificationNote,
        verifiedTrends: topTrends,
      } satisfies AutopilotTopicResponse,
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
