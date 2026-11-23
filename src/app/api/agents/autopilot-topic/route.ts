import { NextResponse } from "next/server";
import { callFreeTierLLM } from "@/lib/ai/llm-provider";
import { buildInstalledSkillsPrompt } from "@/lib/ai/github-skills-registry";
import {
  buildRecencyPromptBlock,
  classifyRecency,
  summarizeRecency,
} from "@/lib/ai/research-recency";
import { fetchLiveAiTrends } from "@/lib/ai/trend-intelligence";
import { CANDIDATE_BANK } from "@/lib/studio/candidate-bank";
import {
  TOPIC_CATEGORIES,
  categoryLabel,
  detectCategory,
  selectBestTopic,
  type TopicCandidate,
  type TopicHistoryRecord,
} from "@/lib/studio/topic-intelligence";
import { buildCreativeBlueprint, describeBlueprint } from "@/lib/studio/creative-blueprint";
import { buildEditingPlan, describeEditingPlan } from "@/lib/studio/dynamic-editing";
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
  /** Kategori lintas-domain (bukan hanya AI) + skor topik + blueprint. */
  category?: string;
  topicScore?: number;
  blueprintLine?: string;
  editingLine?: string;
  needsFreshResearch?: boolean;
}

/* ------------------------------------------------------------------ */
/* Jembatan ke mesin Studio v10 (topik lintas kategori + blueprint)   */
/* ------------------------------------------------------------------ */

const FORMAT_BY_CATEGORY: Record<string, TikTokContentFormat> = {
  teknologi_ai: "feature_visual_demo",
  sains: "feature_visual_demo",
  sejarah: "surprising_experiment",
  alam: "feature_visual_demo",
  edukasi: "ai_coding_tutorial",
  keamanan_digital: "myth_vs_reality",
  psikologi: "myth_vs_reality",
  inovasi: "surprising_experiment",
  ekonomi: "before_after_automation",
  sosial: "myth_vs_reality",
  produktivitas: "ai_tools_must_know",
  mitos_fakta: "myth_vs_reality",
};

const STYLE_BY_CATEGORY: Record<string, VisualStyleId> = {
  teknologi_ai: "dark_ai_cinematic",
  sains: "tech_documentary",
  sejarah: "tech_documentary",
  alam: "tech_documentary",
  edukasi: "clean_tutorial",
  keamanan_digital: "high_energy_news",
  psikologi: "minimal_kinetic",
  inovasi: "agent_3d_network",
  ekonomi: "minimal_kinetic",
  sosial: "zine_glitch",
  produktivitas: "clean_tutorial",
  mitos_fakta: "cyberpunk_dev",
};

/** Judul episode lama → riwayat minimal supaya anti-repetisi tetap bekerja. */
function historyFromPastTopics(pastTopics: string[], nowMs: number): TopicHistoryRecord[] {
  return pastTopics.slice(0, 25).map((title, i) => ({
    episodeId: `past-${i}`,
    episodeNumber: i + 1,
    producedAt: new Date(nowMs - (i + 1) * 86_400_000).toISOString(),
    title,
    mainTopic: title,
    category: detectCategory(title) ?? "edukasi",
    angle: title,
    hook: title,
    summary: title,
    sources: [],
    storyFormat: "unknown",
    visualStyle: "unknown",
    status: "published" as const,
  }));
}

function studioPlanFor(
  candidate: TopicCandidate,
  history: TopicHistoryRecord[],
  episodeCount: number
) {
  const blueprint = buildCreativeBlueprint(candidate, { episodeIndex: episodeCount + 1 }).blueprint;
  const editingPlan = buildEditingPlan(blueprint, candidate, []);
  const score = scoreCached(candidate, history);
  return {
    category: candidate.category,
    topicScore: score,
    blueprintLine: describeBlueprint(blueprint),
    editingLine: describeEditingPlan(editingPlan),
    contentFormat: FORMAT_BY_CATEGORY[candidate.category] ?? "feature_visual_demo",
    visualStyle: STYLE_BY_CATEGORY[candidate.category] ?? "minimal_kinetic",
  };
}

function scoreCached(candidate: TopicCandidate, history: TopicHistoryRecord[]): number {
  // selectBestTopic memakai skor yang sama; di sini cukup hitung ulang cepat.
  const result = selectBestTopic([candidate], { history, minScore: 0 });
  return result.ranked[0]?.score ?? 0;
}

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
    // Riwayat minimum dari judul lama → dipakai mesin anti-repetisi v10.
    const history = historyFromPastTopics(pastTopics, Date.now());

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
CAKUPAN TOPIK (WAJIB DINAMIS, BUKAN AI SAJA): pilih satu kategori paling relevan dari ${TOPIC_CATEGORIES.length} kategori berikut — ${TOPIC_CATEGORIES.map((c) => c.label).join("; ")}. Teknologi/AI hanya SALAH SATU kategori, bukan prioritas mutlak. Variasikan kategori antar episode: bila 3 episode terakhir didominasi satu kategori, pilih kategori lain yang punya sumber segar.
Contoh cakupan: sains harian, sejarah, alam & iklim, edukasi, keamanan digital, psikologi, inovasi, ekonomi, isu sosial, produktivitas, mitos vs fakta, serta teknologi/AI sehari-hari.

${promptBlock}
${buildRecencyPromptBlock()}

KESEGARAN SUMBER HARI INI: ${recency.verdict} (${recency.fresh} segar / ${recency.current} ≤30 hari / ${recency.stale} basi).

ATURAN INTEGRITAS KETAT (WAJIB):
1. Platform SELALU "tiktok" (Vertical 9:16). JANGAN pernah pilih YouTube landscape.
2. DILARANG KERAS mengarang fitur baru Claude Code/OpenAI/Gemini yang tidak ada di data sumber!
3. DILARANG KERAS mengarang angka views, jumlah pencarian, atau janji viral!
4. Jika tersedia daftar "TREN TERVERIFIKASI ONLINE" di bawah, pilih dan rujuk salah satu sumber resmi/komunitas yang belum dibahas di daftar topik lama, dan sertakan "sourceIndex" yang sesuai (0..N-1).
5. Jika daftar tren kosong, fokus pada tutorial/eksperimen/perbandingan arsitektur AI Agent & Claude Code yang faktual dan tandai "sourceIndex": -1.
6. DILARANG mengulang topik, SUDUT, hook, dan struktur yang mirip dengan daftar topik sebelumnya. Mengganti judul saja tidak cukup.
6b. DILARANG clickbait, hoaks, angka tanpa sumber, atau klaim "viral" tanpa data tren. Satu episode = satu ide utama.
7. Pilih sumber yang paling SEGAR (≤ 30 hari) bila kualitasnya setara; kalau memakai sumber lebih tua, sebutkan umurnya di reasoning.
8. Balas HANYA JSON valid:
{
  "theme": "Topik TikTok 9:16 spesifik 1 kalimat (boleh lintas kategori, bukan hanya AI)",
  "category": "sains | sejarah | alam | edukasi | keamanan_digital | psikologi | inovasi | ekonomi | sosial | produktivitas | mitos_fakta | teknologi_ai",
  "niche": "Nama sub-niche singkat sesuai kategori",
  "reasoning": "Alasan objektif pemilihan topik berdasarkan nilai edukasi & retensi penonton",
  "viralHookPreview": "Hook 0-2 detik pertama yang langsung menghentikan scrolling tanpa clickbait bohong",
  "contentFormat": "breaking_ai_news | ai_tools_must_know | claude_code_experiment | ai_agent_vs_human | before_after_automation | ai_coding_tutorial | ai_agent_builds_project | myth_vs_reality | surprising_experiment | feature_visual_demo",
  "visualStyle": "zine_glitch | dark_ai_cinematic | tech_documentary | cyberpunk_dev | clean_tutorial | agent_3d_network | minimal_kinetic | high_energy_news",
  "sourceIndex": 0
}
CATATAN: field "category" WAJIB salah satu id kategori di atas.`;

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

      const themeText = llm.parsed.theme.trim().slice(0, 200);
      const parsedCategory =
        TOPIC_CATEGORIES.find((c) => c.id === llm.parsed.category)?.id ??
        detectCategory(themeText) ??
        "edukasi";
      const llmCandidate: TopicCandidate = {
        id: `llm-${Date.now()}`,
        category: parsedCategory,
        title: themeText,
        angle: (llm.parsed.reasoning || themeText).slice(0, 160),
        hook: (llm.parsed.viralHookPreview || themeText).slice(0, 160),
        thesis: themeText,
        keyFacts: [],
        sources: chosenSource
          ? [
              {
                name: chosenSource.sourceName,
                url: chosenSource.sourceUrl,
                publishedAt: chosenSource.publishedAt.slice(0, 10),
                kind: "official",
              },
            ]
          : [],
        audienceImportance: 6,
        clarity: 6,
        curiosity: 7,
        educationalValue: 6,
        visualPotential: 6,
        difficulty: 5,
        durationFitSec: 45,
        noveltyNotes: "Dipilih LLM dengan riwayat topik sebagai pembanding",
      };
      const plan = studioPlanFor(llmCandidate, history, episodeCount);

      return NextResponse.json({
        ok: true,
        source: "ai",
        provider: llm.provider,
        model: llm.model,
        durationMs: llm.durationMs,
        activeSkillsUsed: activeSkillRepos,
        data: {
          theme: themeText,
          platform: "tiktok",
          category: categoryLabel(parsedCategory),
          topicScore: plan.topicScore,
          blueprintLine: plan.blueprintLine,
          editingLine: plan.editingLine,
          niche: (llm.parsed.niche || categoryLabel(parsedCategory)).trim().slice(0, 56),
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
          contentFormat: plan.contentFormat,
          visualStyle: plan.visualStyle,
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

    // Fallback 1: tren terverifikasi yang belum pernah dibahas.
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
          theme: unusedTrend.title.slice(0, 200),
          platform: "tiktok",
          category: "teknologi_ai",
          niche: unusedTrend.tags[0] || "Update teknologi",
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

    // Fallback 2: bank kandidat lintas kategori + skor & anti-repetisi v10.
    // Kalau tidak ada yang layak → JANGAN mengarang: minta riset ulang.
    const selection = selectBestTopic(CANDIDATE_BANK, { history });
    if (!selection.chosen) {
      return NextResponse.json(
        {
          ok: false,
          source: "needs-fresh-research",
          error:
            "Tidak ada kandidat topik yang layak (skor < ambang atau terlalu mirip episode lama). " +
            "Sistem menolak mengarang topik. Perlu riset/tren baru sebelum episode berikutnya.",
          needsFreshResearch: true,
          rejected: selection.rejected,
          notes: selection.notes,
          verifiedTrends: topTrends,
          trendVerificationNote: trendReport.verificationNote,
        },
        { status: 409 }
      );
    }

    const chosen = selection.chosen;
    const plan = studioPlanFor(chosen, history, episodeCount);

    return NextResponse.json({
      ok: true,
      source: "candidate-bank-v10",
      provider: "studio-topic-intelligence",
      model: "topic-scoring-v10",
      durationMs: 0,
      activeSkillsUsed: activeSkillRepos,
      data: {
        theme: chosen.title,
        platform: "tiktok",
        category: categoryLabel(chosen.category),
        topicScore: plan.topicScore,
        blueprintLine: plan.blueprintLine,
        editingLine: plan.editingLine,
        niche: categoryLabel(chosen.category),
        reasoning:
          `Skor topik ${plan.topicScore}/100 · sudut: ${chosen.angle} · ` +
          `dibandingkan dengan ${selection.comparedEpisodes} episode terakhir.`,
        viralHookPreview: chosen.hook,
        contentFormat: plan.contentFormat,
        visualStyle: plan.visualStyle,
        sourceName: chosen.sources[0]?.name ?? "Sumber belum terverifikasi",
        sourceUrl: chosen.sources[0]?.url ?? "",
        sourcePublishedAt: chosen.sources[0]?.publishedAt ?? new Date().toISOString(),
        sourceVerified: (chosen.sources[0]?.kind ?? "") === "official",
        trendVerificationNote: trendReport.verificationNote,
        verifiedTrends: topTrends,
        needsFreshResearch: false,
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
