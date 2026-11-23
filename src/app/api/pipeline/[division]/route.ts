import { NextResponse } from "next/server";
import { callFreeTierLLM } from "@/lib/ai/llm-provider";
import { buildInstalledSkillsPrompt } from "@/lib/ai/github-skills-registry";
import { fetchLiveAiTrends } from "@/lib/ai/trend-intelligence";
import {
  MORAL_LESSON_CATALOG,
  SETTING_CATALOG,
  STORY_STRUCTURES,
  SUPPORTING_CHARACTER_CATALOG,
} from "@/lib/pipeline/variation-engine";
import type { KidsThemeId } from "@/lib/kids-studio/episode-brain";
import type {
  CreativeDirectorBrief,
  PipelineScene,
  QcCheckItem,
  QcInput,
  QcOutput,
  ResearchIdeaItem,
  ResearchInput,
  ResearchOutput,
  ScriptInput,
  ScriptOutput,
  SeoInput,
  SeoOutput,
  TikTokContentFormat,
  VisualStyleId,
} from "@/types/pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const VALID_THEME_IDS: KidsThemeId[] = [
  "rescue_trucks",
  "dino_colors",
  "space_rocket",
  "animal_friends",
  "ai_tech_tips",
];

const VALID_VISUAL_STYLES: VisualStyleId[] = [
  "dark_ai_cinematic",
  "tech_documentary",
  "cyberpunk_dev",
  "clean_tutorial",
  "agent_3d_network",
  "minimal_kinetic",
  "high_energy_news",
  "zine_glitch",
];

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

const VALID_TEMPLATES: NonNullable<PipelineScene["visualTemplate"]>[] = [
  "claude_terminal",
  "ai_network_flow",
  "github_pr_workflow",
  "code_diff_editor",
  "bezier_chart",
  "cursor_cards",
  "split_contrast",
  "cta_finale",
];

const VALID_TRANSITIONS: NonNullable<PipelineScene["transitionIn"]>[] = [
  "whip-up",
  "iris-circle",
  "zoom-through",
  "whip-left",
  "push-pull",
];

const BANNED_CONTENT_WORDS = [
  "bunuh",
  "membunuh",
  "narkoba",
  "judi online",
  "slot gacor",
  "goblok",
  "bangsat",
  "porn",
  "porno",
  "terorisme",
  "penipuan cepat kaya",
  "dijamin viral 100%",
];

function normalizeTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3);
}

function buildBigrams(tokens: string[]): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i < tokens.length; i += 1) {
    set.add(tokens[i]);
    if (i + 1 < tokens.length) set.add(`${tokens[i]}_${tokens[i + 1]}`);
  }
  return set;
}

function computeTextSimilarity(a: string, b: string): number {
  const setA = buildBigrams(normalizeTokens(a));
  const setB = buildBigrams(normalizeTokens(b));
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersect = 0;
  setA.forEach((item) => {
    if (setB.has(item)) intersect += 1;
  });
  const union = setA.size + setB.size - intersect;
  return union === 0 ? 0 : intersect / union;
}

function sanitizeThemeId(raw: unknown): KidsThemeId {
  if (typeof raw === "string" && VALID_THEME_IDS.includes(raw as KidsThemeId)) {
    return raw as KidsThemeId;
  }
  return "ai_tech_tips";
}

function runDeterministicQc(input: QcInput): QcOutput {
  const checks: QcCheckItem[] = [];
  const blockedReasons: string[] = [];

  const scenes = Array.isArray(input.scenes) ? input.scenes : [];
  const totalSec = scenes.reduce((acc, s) => acc + (Number(s.durationSec) || 0), 0);

  // 1. TikTok Duration check (20-65s optimal range, allow 15-75s)
  const durationOk = totalSec >= 15 && totalSec <= 75 && scenes.length >= 4;
  checks.push({
    id: "duration",
    label: "Durasi TikTok 9:16 & Struktur Adegan",
    passed: durationOk,
    severity: "blocker",
    detail: durationOk
      ? `${scenes.length} adegan, estimasi ${totalSec} detik (optimal untuk retensi TikTok 20–60d).`
      : `Durasi (${totalSec}d) atau jumlah adegan (${scenes.length}) di luar rentang TikTok 15–75 detik & min 4 adegan.`,
  });
  if (!durationOk) {
    blockedReasons.push("Durasi atau jumlah adegan belum sesuai standar TikTok 20–60 detik.");
  }

  // 2. Content Safety & Anti-Exaggeration Scan
  const combinedText = [
    input.title,
    input.description,
    input.summary,
    input.moralLesson,
    ...scenes.map((s) => `${s.narration} ${s.subtitle} ${s.visualCue}`),
  ]
    .join(" ")
    .toLowerCase();

  const foundBanned = BANNED_CONTENT_WORDS.filter((word) => {
    const pattern = new RegExp(`\\b${word.replace(/\s+/g, "\\s+")}\\b`, "i");
    return pattern.test(combinedText);
  });

  const safeWordsOk = foundBanned.length === 0;
  checks.push({
    id: "banned-words",
    label: "Filter Keamanan & Anti-Klaim Menyesatkan",
    passed: safeWordsOk,
    severity: "blocker",
    detail: safeWordsOk
      ? "0 kata terlarang atau klaim menyesatkan terdeteksi."
      : `Ditemukan frasa berisiko: ${foundBanned.join(", ")}.`,
  });
  if (!safeWordsOk) {
    blockedReasons.push(`Naskah mengandung frasa berisiko: ${foundBanned.join(", ")}.`);
  }

  // 3. Editorial Value & Payoff Checklist
  const hasMoral = (input.moralLesson?.trim().length ?? 0) >= 8;
  const hasSummary = (input.summary?.trim().length ?? 0) >= 20;
  const qualityChecklistOk = hasMoral && hasSummary;
  checks.push({
    id: "editorial-value-checklist",
    label: "Kejelasan Informasi & Payoff Penutup",
    passed: qualityChecklistOk,
    severity: "blocker",
    detail: qualityChecklistOk
      ? `Payoff jelas: "${input.moralLesson}".`
      : "Takeaway/payoff atau ringkasan episode terlalu singkat.",
  });
  if (!qualityChecklistOk) {
    blockedReasons.push("Payoff atau ringkasan naskah belum lengkap.");
  }

  // 4. Anti-duplication check
  const currentFingerprint = `${input.title} ${input.summary} ${input.storyStructure} ${input.setting} ${input.supportingCharacter} ${scenes
    .map((s) => s.narration)
    .join(" ")}`;

  let maxSimilarity = 0;
  let mostSimilarTitle: string | null = null;
  let duplicateStructureAndSetting = false;

  for (const prev of input.previousEpisodes ?? []) {
    const prevFingerprint = `${prev.title} ${prev.summary} ${prev.storyStructure} ${prev.setting} ${prev.supportingCharacter}`;
    const sim = computeTextSimilarity(currentFingerprint, prevFingerprint);
    if (sim > maxSimilarity) {
      maxSimilarity = sim;
      mostSimilarTitle = prev.title;
    }
    if (
      prev.storyStructure &&
      prev.setting &&
      prev.storyStructure.toLowerCase().trim() === input.storyStructure.toLowerCase().trim() &&
      prev.setting.toLowerCase().trim() === input.setting.toLowerCase().trim()
    ) {
      duplicateStructureAndSetting = true;
    }
  }

  const similarityPct = Math.round(maxSimilarity * 100);
  const similarityOk = maxSimilarity < 0.45 && !duplicateStructureAndSetting;
  checks.push({
    id: "anti-duplicate",
    label: "Anti-Konten Repetitif (Kemiripan Episode Sebelumnya)",
    passed: similarityOk,
    severity: "blocker",
    detail:
      (input.previousEpisodes?.length ?? 0) === 0
        ? "Episode perdana — belum ada episode pembanding."
        : duplicateStructureAndSetting
        ? `Struktur ("${input.storyStructure}") + latar ("${input.setting}") sama persis dengan episode sebelumnya.`
        : similarityOk
        ? `Kemiripan tertinggi ${similarityPct}% (aman di bawah ambang 45%).`
        : `Terlalu mirip (${similarityPct}%) dengan "${mostSimilarTitle}".`,
  });
  if (!similarityOk) {
    blockedReasons.push(`Kemiripan naskah ${similarityPct}% terlalu tinggi — butuh variasi baru.`);
  }

  // 5. REAL ACTUAL VIDEO TELEMETRY QC (SECTION 9 — ACTUAL VALUES, NOT TARGETS!)
  const vt = input.videoTelemetry;
  if (vt) {
    const isVertical916 = Math.abs(vt.actualHeight / Math.max(1, vt.actualWidth) - 16 / 9) < 0.03;
    checks.push({
      id: "video-resolution-actual",
      label: "Resolusi Aktual & Rasio Vertikal 9:16",
      passed: isVertical916 && vt.actualWidth >= 720,
      severity: "blocker",
      detail: `Aktual: ${vt.actualWidth}×${vt.actualHeight} (Target ${vt.requestedPreset.toUpperCase()}: ${vt.targetWidth}×${vt.targetHeight}) · Rasio ${isVertical916 ? "9:16 valid" : "TIDAK 9:16"}.`,
    });
    if (!isVertical916) blockedReasons.push("Video tidak berasio vertikal 9:16.");

    const fpsOk = vt.actualFps >= 29 && vt.droppedFrames <= Math.max(5, vt.encodedFrames * 0.03);
    checks.push({
      id: "video-fps-codec-actual",
      label: "FPS Aktual, Codec & Bitrate Aktual",
      passed: fpsOk,
      severity: "warning",
      detail: `Aktual: ${vt.actualFps} FPS · Codec: ${vt.actualCodec} (${vt.actualContainer.toUpperCase()}) · Bitrate: ${vt.actualBitrateMbps} Mbps · Frame drop: ${vt.droppedFrames}/${vt.encodedFrames}.`,
    });

    const syncOk = vt.hasAudioTrack && Math.abs(vt.avSyncDeltaMs) <= 65;
    checks.push({
      id: "audio-sync-actual",
      label: "Audio Track & Sinkronisasi Audio-Video",
      passed: syncOk,
      severity: "blocker",
      detail: vt.hasAudioTrack
        ? `Audio: ${vt.audioCodec} · Drift A/V aktual: ${vt.avSyncDeltaMs} ms (batas ≤ 65 ms).`
        : "Track audio TIDAK terdeteksi pada file ekspor!",
    });
    if (!syncOk) blockedReasons.push("Audio track hilang atau drift A/V melebihi 65ms.");

    const visualIntegrityOk =
      vt.blackFrameCount === 0 &&
      vt.safeZoneTikTokPass &&
      vt.subtitleClippingWarnings === 0 &&
      vt.fileIntegrityPass &&
      vt.renderErrorCount === 0;
    checks.push({
      id: "visual-safezone-integrity",
      label: "Black Frame, Safe Zone TikTok & Integritas File",
      passed: visualIntegrityOk,
      severity: "blocker",
      detail: `Black frame: ${vt.blackFrameCount} · Safe Zone TikTok: ${vt.safeZoneTikTokPass ? "PASS" : "FAIL"} · Header: ${vt.fileHeaderMagic} (${vt.fileIntegrityPass ? "VALID" : "CORRUPT"}) · Render errors: ${vt.renderErrorCount}.`,
    });
    if (!visualIntegrityOk) {
      blockedReasons.push("Terdeteksi black frame, pelanggaran safe zone TikTok, atau integritas file gagal.");
    }
  }

  const passedCount = checks.filter((c) => c.passed).length;
  const score = Math.round((passedCount / Math.max(1, checks.length)) * 100);
  const passed = blockedReasons.length === 0;

  return {
    passed,
    score,
    similarityScore: similarityPct,
    mostSimilarEpisodeTitle: mostSimilarTitle,
    blockedReasons,
    checks,
    videoTelemetry: vt,
  };
}

export async function POST(
  request: Request,
  context: { params: Promise<{ division: string }> }
) {
  const { division } = await context.params;

  try {
    const body = (await request.json()) as Record<string, unknown>;

    /* ==================== DIVISI 1: RISET & TREND INTELLIGENCE ==================== */
    if (division === "research") {
      const input = body as unknown as ResearchInput;
      if (!input.theme?.trim()) {
        return NextResponse.json(
          { ok: false, error: "Tema dari Bos wajib diisi." },
          { status: 400 }
        );
      }

      const trendReport =
        Array.isArray(input.verifiedTrends) && input.verifiedTrends.length > 0
          ? {
              verifiedOnline: true,
              verificationNote: `Menggunakan ${input.verifiedTrends.length} sumber tren terverifikasi.`,
              items: input.verifiedTrends,
            }
          : await fetchLiveAiTrends(90);

      const researchSkills = buildInstalledSkillsPrompt("research");
      const systemPrompt = `Anda adalah AI Creative Director & Kepala Divisi Riset Konten TikTok 9:16 khusus AI AGENT, CLAUDE CODE, AI CODING, MULTI-AGENT SYSTEMS, & AI AUTOMATION (Bahasa Indonesia).

${researchSkills.promptBlock}

ATURAN WAJIB:
- Fokus 100% TikTok Vertical 9:16 (20–60 detik).
- JANGAN mengarang fitur Claude Code / AI Agent yang tidak nyata.
- JANGAN mengarang jumlah views atau janji viral.
- Gunakan data sumber terverifikasi bila relevan; bila tidak ada sumber berita baru, fokus pada edukasi teknis, eksperimen, dan perbandingan workflow yang faktual.

Balas HANYA dalam JSON valid:
{
  "ideas": [
    {
      "id": "idea-1",
      "title": "Judul konsep TikTok menarik tapi jujur (Bahasa Indonesia)",
      "angle": "Sudut pandang spesifik dan nilai nyata untuk penonton",
      "themeId": "ai_tech_tips",
      "storyStructure": "Struktur storytelling unik",
      "setting": "Gaya latar presentasi AI tech",
      "supportingCharacter": "Studi kasus / perbandingan teknis konkret",
      "moralLesson": "Kesimpulan / payoff nyata di akhir video",
      "hook3s": "Hook 0-2 detik yang langsung menghentikan scrolling",
      "targetAge": "Developer, Kreator AI & Tech Enthusiast 18-38 tahun",
      "contentFormat": "breaking_ai_news | ai_tools_must_know | claude_code_experiment | ai_agent_vs_human | before_after_automation | ai_coding_tutorial | ai_agent_builds_project | myth_vs_reality | surprising_experiment | feature_visual_demo",
      "visualStyle": "dark_ai_cinematic | tech_documentary | cyberpunk_dev | clean_tutorial | agent_3d_network | minimal_kinetic | high_energy_news",
      "whyChosen": "Alasan objektif topik ini kuat untuk retensi penonton",
      "sourceIndex": 0
    }
  ]
}
WAJIB hasilkan tepat 5 ide yang masing-masing berbeda format, gaya visual, dan struktur cerita.`;

      const avoidStructSet = new Set(
        (input.avoidStructures ?? []).map((s) => s.toLowerCase().trim())
      );
      const freshStructures = STORY_STRUCTURES.filter(
        (s) => !avoidStructSet.has(s.toLowerCase())
      ).slice(0, 5);
      const freshSettings = SETTING_CATALOG.slice(0, 5);
      const freshChars = SUPPORTING_CHARACTER_CATALOG.slice(0, 5);

      const trendText =
        trendReport.items.length > 0
          ? trendReport.items
              .slice(0, 6)
              .map(
                (t, i) =>
                  `[${i}] (${t.classification}, ${t.publishedAt.slice(0, 10)}) ${t.title} — ${t.sourceName} (${t.sourceUrl})`
              )
              .join("\n")
          : "(Belum ada sumber tren online terverifikasi — gunakan sourceIndex: -1)";

      const userPrompt = `Tema Utama: "${input.theme}"
Platform: tiktok (Vertical 9:16 ONLY)
Sumber Tren Terverifikasi:
${trendText}

Judul episode lama yang WAJIB dihindari: ${JSON.stringify(input.previousEpisodeTitles ?? [])}
Struktur lama yang dihindari: ${JSON.stringify(input.avoidStructures ?? [])}
Rekomendasi variasi struktur: ${JSON.stringify(freshStructures)}
Rekomendasi latar: ${JSON.stringify(freshSettings)}
Rekomendasi studi kasus: ${JSON.stringify(freshChars)}
Rekomendasi takeaway: ${JSON.stringify(MORAL_LESSON_CATALOG.slice(0, 5))}

Hasilkan tepat 5 ide TikTok 9:16 tentang AI Agent / Claude Code yang tajam, faktual, dan berbeda satu sama lain.`;

      const llm = await callFreeTierLLM<{
        ideas?: Array<Partial<ResearchIdeaItem> & { sourceIndex?: number }>;
      }>({
        taskType: "research",
        systemPrompt,
        userPrompt,
        expectJson: true,
        temperature: 0.82,
        maxTokens: 2100,
      });

      if (!llm.ok) {
        return NextResponse.json(llm, { status: llm.httpStatus });
      }

      const rawIdeas = Array.isArray(llm.parsed?.ideas) ? llm.parsed.ideas : [];
      if (rawIdeas.length < 3) {
        return NextResponse.json(
          {
            ok: false,
            code: "INVALID_JSON_RESPONSE",
            error: "AI tidak mengembalikan minimal 5 ide terstruktur. Coba Retry.",
            attempts: llm.attempts,
          },
          { status: 502 }
        );
      }

      const ideas: ResearchIdeaItem[] = rawIdeas.slice(0, 5).map((item, idx) => {
        const sIdx =
          typeof item.sourceIndex === "number" &&
          item.sourceIndex >= 0 &&
          item.sourceIndex < trendReport.items.length
            ? item.sourceIndex
            : -1;
        const src = sIdx >= 0 ? trendReport.items[sIdx] : null;
        return {
          id: item.id || `idea-${idx + 1}`,
          title: String(item.title || `Ide AI Agent #${idx + 1}`).trim(),
          angle: String(item.angle || "Eksperimen workflow AI coding nyata").trim(),
          themeId: sanitizeThemeId(item.themeId),
          storyStructure: String(item.storyStructure || `Struktur ${idx + 1}`).trim(),
          setting: String(item.setting || `Visual Style ${idx + 1}`).trim(),
          supportingCharacter: String(
            item.supportingCharacter || "Studi kasus Claude Code CLI"
          ).trim(),
          moralLesson: String(
            item.moralLesson || "AI Agent paling efektif bila disertai verifikasi test nyata"
          ).trim(),
          hook3s: String(
            item.hook3s || "Ini alasan workflow AI Agent mulai menggantikan cara coding manual!"
          ).trim(),
          targetAge: String(item.targetAge || "Developer & Kreator Tech 18-38 tahun").trim(),
          contentFormat: VALID_FORMATS.includes(item.contentFormat as TikTokContentFormat)
            ? (item.contentFormat as TikTokContentFormat)
            : VALID_FORMATS[idx % VALID_FORMATS.length],
          visualStyle: VALID_VISUAL_STYLES.includes(item.visualStyle as VisualStyleId)
            ? (item.visualStyle as VisualStyleId)
            : VALID_VISUAL_STYLES[idx % VALID_VISUAL_STYLES.length],
          whyChosen: String(
            item.whyChosen || "Topik praktis dengan demonstrasi visual terminal & workflow AI."
          ).trim(),
          sourceName: src ? src.sourceName : "Faktual AI Engineering (tanpa klaim berita baru)",
          sourceUrl: src?.sourceUrl ?? "",
          sourcePublishedAt: src?.publishedAt ?? new Date().toISOString(),
          sourceVerified: Boolean(src?.verified),
        };
      });

      const output: ResearchOutput = {
        ideas,
        trendIntelligenceNote: trendReport.verificationNote,
        verifiedSourcesCount: trendReport.items.length,
      };
      return NextResponse.json({
        ok: true,
        output,
        meta: {
          provider: llm.provider,
          model: llm.model,
          durationMs: llm.durationMs,
          usage: llm.usage,
          estimatedCostUsd: llm.estimatedCostUsd,
          attempts: llm.attempts,
        },
      });
    }

    /* ==================== DIVISI 2: SEO TIKTOK ==================== */
    if (division === "seo") {
      const input = body as unknown as SeoInput;
      if (!input.idea?.title) {
        return NextResponse.json(
          { ok: false, error: "Ide riset wajib dipilih sebelum Divisi SEO bekerja." },
          { status: 400 }
        );
      }

      const seoSkills = buildInstalledSkillsPrompt("seo");
      const systemPrompt = `Anda adalah Spesialis Editorial & SEO TikTok AI Technology berbahasa Indonesia.
ATURAN KETAT:
- Judul menarik tapi TIDAK clickbait menyesatkan.
- Caption padat, memicu diskusi natural di komentar TikTok.
- Hashtag MAKSIMAL 5 hashtag yang SANGAT RELEVAN (dilarang spam hashtag generik seperti #fyp #viral #foryoupage berlebihan!).

${seoSkills.promptBlock}

Balas HANYA JSON valid:
{
  "title": "Judul TikTok maksimal 68 karakter, tajam dan jujur",
  "description": "Caption TikTok 2 paragraf ringkas + pertanyaan diskusi natural untuk komentar",
  "tags": ["6-8 kata kunci pencarian TikTok relevan"],
  "hashtags": ["#ClaudeCode", "#AIAgent", "#AICoding", "#Automation", "#TechIndonesia"],
  "thumbnailHeadline": "2-4 KATA KAPITAL TAJAM UNTUK COVER 9:16"
}`;

      const userPrompt = `Platform: TikTok Vertical 9:16
Ide Episode: ${JSON.stringify(input.idea)}
Buat metadata TikTok Bahasa Indonesia yang profesional, informatif, dan non-spammy.`;

      const llm = await callFreeTierLLM<Partial<SeoOutput>>({
        taskType: "classification",
        systemPrompt,
        userPrompt,
        expectJson: true,
        temperature: 0.62,
        maxTokens: 1100,
      });

      if (!llm.ok) {
        return NextResponse.json(llm, { status: llm.httpStatus });
      }

      const cleanHashtags = (
        Array.isArray(llm.parsed?.hashtags)
          ? llm.parsed.hashtags
          : ["#ClaudeCode", "#AIAgent", "#AICoding", "#WorkflowAI"]
      )
        .map((h) => {
          const clean = String(h).trim().replace(/\s+/g, "");
          return clean.startsWith("#") ? clean : `#${clean}`;
        })
        .filter((h) => h.length > 2 && !/^#(fyp|viral|foryou|foryoupage)$/i.test(h))
        .slice(0, 5);

      const output: SeoOutput = {
        title: String(llm.parsed?.title || input.idea.title).trim().slice(0, 82),
        description: String(
          llm.parsed?.description ||
            `${input.idea.title}\n\n${input.idea.moralLesson}\nMenurut kamu workflow AI Agent mana yang paling berguna buat kerjaan harian? Tulis di komentar!`
        ).trim(),
        tags: Array.isArray(llm.parsed?.tags)
          ? llm.parsed.tags.map((t) => String(t).replace(/^#/, "").trim()).filter(Boolean).slice(0, 8)
          : ["claude code", "ai agent", "ai coding", "otomatisasi workflow", "tutorial ai"],
        hashtags:
          cleanHashtags.length > 0
            ? cleanHashtags
            : ["#ClaudeCode", "#AIAgent", "#AICoding", "#AIAutomation"],
        thumbnailHeadline: String(
          llm.parsed?.thumbnailHeadline || input.idea.title.split(" ").slice(0, 3).join(" ")
        )
          .toUpperCase()
          .trim()
          .slice(0, 30),
      };

      return NextResponse.json({
        ok: true,
        output,
        meta: {
          provider: llm.provider,
          model: llm.model,
          durationMs: llm.durationMs,
          usage: llm.usage,
          estimatedCostUsd: llm.estimatedCostUsd,
          attempts: llm.attempts,
        },
      });
    }

    /* ==================== DIVISI 3: AI CREATIVE DIRECTOR & NASKAH ==================== */
    if (division === "script") {
      const input = body as unknown as ScriptInput;
      if (!input.idea?.title || !input.seo?.title) {
        return NextResponse.json(
          { ok: false, error: "Hasil Riset & SEO wajib tersedia sebelum menulis Naskah." },
          { status: 400 }
        );
      }

      const bossHints = input.bossOriginalElements
        ? [
            input.bossOriginalElements.customIdea &&
              `Ide asli Bos: ${input.bossOriginalElements.customIdea}`,
            input.bossOriginalElements.customTwist &&
              `Twist dari Bos: ${input.bossOriginalElements.customTwist}`,
            input.bossOriginalElements.customVoiceLine &&
              `Kalimat khas Bos: ${input.bossOriginalElements.customVoiceLine}`,
            input.bossOriginalElements.customCharacter &&
              `Studi kasus Bos: ${input.bossOriginalElements.customCharacter}`,
          ]
            .filter(Boolean)
            .join("\n")
        : "";

      const scriptSkills = buildInstalledSkillsPrompt("script");
      const systemPrompt = `Anda adalah AI Creative Director & Scriptwriter TikTok Vertical 9:16 untuk topik AI AGENT & CLAUDE CODE (Bahasa Indonesia).

${scriptSkills.promptBlock}

ATURAN KETAT STORYTELLING & SYNC AUDIO-VISUAL:
1. Total durasi video WAJIB 24–52 detik (5 sampai 6 adegan padat — jangan diperpanjang tanpa alasan!).
2. Adegan 1 WAJIB Hook kuat 0–2 detik pertama ("visualTemplate": "claude_terminal").
3. Setiap adegan WAJIB memakai "visualTemplate" YANG BERBEDA-BEDA sesuai isi narasi:
   - "claude_terminal" (hook / perintah terminal Claude Code)
   - "ai_network_flow" (arsitektur multi-agent / koneksi tools)
   - "github_pr_workflow" (pull request, diff, CI checks, deploy GitHub)
   - "code_diff_editor" (kode bertambah/berubah langsung di editor)
   - "bezier_chart" (grafik perbandingan kecepatan/efisiensi)
   - "cursor_cards" (checklist langkah atau fitur utama)
   - "split_contrast" (before manual vs after AI automation)
   - "cta_finale" (kesimpulan payoff + CTA natural komentar/follow)
4. Setiap narasi adegan pendek, ritmis, 11–20 kata bahasa Indonesia natural yang enak diucapkan voiceover (agar pas 4–8 detik per adegan dan sinkron sempurna dengan subtitle).
5. Adegan terakhir WAJIB memberikan payoff/kesimpulan bernilai + CTA natural.

Balas HANYA JSON valid:
{
  "summary": "Ringkasan 2 kalimat untuk arsip anti-duplikat",
  "storyStructure": "Struktur storytelling episode",
  "setting": "Gaya visual utama",
  "supportingCharacter": "Studi kasus / contoh teknis",
  "moralLesson": "Kesimpulan payoff utama",
  "visualStyle": "dark_ai_cinematic | tech_documentary | cyberpunk_dev | clean_tutorial | agent_3d_network | minimal_kinetic | high_energy_news",
  "contentFormat": "breaking_ai_news | ai_tools_must_know | claude_code_experiment | ai_agent_vs_human | before_after_automation | ai_coding_tutorial | ai_agent_builds_project | myth_vs_reality | surprising_experiment | feature_visual_demo",
  "scenes": [
    {
      "sceneNumber": 1,
      "label": "Hook 0-2 Detik",
      "durationSec": 5,
      "narration": "Kalimat narasi natural Bahasa Indonesia 11-19 kata",
      "subtitle": "Highlight pendek 4-7 kata",
      "visualCue": "Headline visual 3-6 kata tajam di layar",
      "mood": "intro | problem | action | solve | celebrate",
      "visualTemplate": "claude_terminal",
      "transitionIn": "whip-up | iris-circle | zoom-through | whip-left | push-pull",
      "codeSnippet": "claude 'perintah singkat relevan'"
    }
  ]
}`;

      const userPrompt = `Judul TikTok: ${input.seo.title}
Konsep Riset: ${JSON.stringify(input.idea)}
Platform: TikTok Vertical 9:16 ONLY
${bossHints ? `Elemen Orisinal Bos (WAJIB dimasukkan):\n${bossHints}\n` : ""}
Ringkasan episode lama (WAJIB berbeda):
${JSON.stringify((input.previousSummaries ?? []).slice(0, 6))}

Tulis storyboard lengkap 5-6 adegan (total 28-48 detik) dengan variasi template visual & transisi antar-adegan yang presisi.`;

      const llm = await callFreeTierLLM<Partial<ScriptOutput>>({
        taskType: "creative_script",
        systemPrompt,
        userPrompt,
        expectJson: true,
        temperature: 0.74,
        maxTokens: 2400,
      });

      if (!llm.ok) {
        return NextResponse.json(llm, { status: llm.httpStatus });
      }

      const moods: PipelineScene["mood"][] = [
        "intro",
        "problem",
        "action",
        "solve",
        "celebrate",
      ];
      const rawScenes = Array.isArray(llm.parsed?.scenes) ? llm.parsed.scenes : [];
      if (rawScenes.length < 4) {
        return NextResponse.json(
          {
            ok: false,
            code: "INVALID_JSON_RESPONSE",
            error: "AI menghasilkan kurang dari 4 adegan. Klik Retry pada Divisi Naskah.",
            attempts: llm.attempts,
          },
          { status: 502 }
        );
      }

      const defaultMidTemplates: NonNullable<PipelineScene["visualTemplate"]>[] = [
        "ai_network_flow",
        "code_diff_editor",
        "github_pr_workflow",
        "split_contrast",
        "cursor_cards",
        "bezier_chart",
      ];

      const scenes: PipelineScene[] = rawScenes.slice(0, 6).map((s, idx, arr) => {
        const isFirst = idx === 0;
        const isLast = idx === arr.length - 1;
        const parsedTpl = VALID_TEMPLATES.includes(
          s.visualTemplate as NonNullable<PipelineScene["visualTemplate"]>
        )
          ? (s.visualTemplate as NonNullable<PipelineScene["visualTemplate"]>)
          : isFirst
          ? "claude_terminal"
          : isLast
          ? "cta_finale"
          : defaultMidTemplates[(idx - 1) % defaultMidTemplates.length];

        const parsedTrans = VALID_TRANSITIONS.includes(
          s.transitionIn as NonNullable<PipelineScene["transitionIn"]>
        )
          ? (s.transitionIn as NonNullable<PipelineScene["transitionIn"]>)
          : VALID_TRANSITIONS[idx % VALID_TRANSITIONS.length];

        return {
          sceneNumber: idx + 1,
          label: String(s.label || `Adegan ${idx + 1}`).trim(),
          durationSec: Math.min(10, Math.max(4, Number(s.durationSec) || 5.5)),
          narration: String(s.narration || "").trim(),
          subtitle: String(s.subtitle || s.narration || "").trim().slice(0, 72),
          visualCue: String(s.visualCue || s.label || input.idea.title).trim().slice(0, 68),
          mood: moods.includes(s.mood as PipelineScene["mood"])
            ? (s.mood as PipelineScene["mood"])
            : moods[Math.min(idx, moods.length - 1)],
          visualTemplate: parsedTpl,
          transitionIn: parsedTrans,
          codeSnippet: s.codeSnippet ? String(s.codeSnippet).trim().slice(0, 84) : undefined,
        };
      });

      const totalDurationSec = Math.round(
        scenes.reduce((acc, s) => acc + s.durationSec, 0) * 10
      ) / 10;

      const visualStyle: VisualStyleId = VALID_VISUAL_STYLES.includes(
        llm.parsed?.visualStyle as VisualStyleId
      )
        ? (llm.parsed?.visualStyle as VisualStyleId)
        : input.idea.visualStyle ?? "dark_ai_cinematic";

      const contentFormat: TikTokContentFormat = VALID_FORMATS.includes(
        llm.parsed?.contentFormat as TikTokContentFormat
      )
        ? (llm.parsed?.contentFormat as TikTokContentFormat)
        : input.idea.contentFormat ?? "claude_code_experiment";

      const creativeBrief: CreativeDirectorBrief = {
        topic: input.idea.title,
        sourceName: input.idea.sourceName || "Edukasi Faktual AI Agent",
        sourceUrl: input.idea.sourceUrl || "",
        sourcePublishedAt: input.idea.sourcePublishedAt || new Date().toISOString(),
        sourceVerified: Boolean(input.idea.sourceVerified),
        whyChosen: input.idea.whyChosen || input.idea.angle,
        targetAudience: input.idea.targetAge || "Developer & Kreator AI 18-38 tahun",
        hook0to2s: scenes[0]?.narration || input.idea.hook3s,
        contentFormat,
        visualStyle,
        transitions: scenes.map((sc) => sc.transitionIn || "whip-up"),
        tiktokTitle: input.seo.title,
        tiktokCaption: input.seo.description,
        tiktokHashtags: input.seo.hashtags,
      };

      const output: ScriptOutput = {
        summary: String(
          llm.parsed?.summary ||
            `${input.seo.title}: ${input.idea.angle}.`
        ).trim(),
        storyStructure: String(
          llm.parsed?.storyStructure || input.idea.storyStructure
        ).trim(),
        setting: String(llm.parsed?.setting || input.idea.setting).trim(),
        supportingCharacter: String(
          llm.parsed?.supportingCharacter || input.idea.supportingCharacter
        ).trim(),
        moralLesson: String(
          llm.parsed?.moralLesson || input.idea.moralLesson
        ).trim(),
        totalDurationSec,
        scenes,
        visualStyle,
        contentFormat,
        creativeBrief,
      };

      return NextResponse.json({
        ok: true,
        output,
        meta: {
          provider: llm.provider,
          model: llm.model,
          durationMs: llm.durationMs,
          usage: llm.usage,
          estimatedCostUsd: llm.estimatedCostUsd,
          attempts: llm.attempts,
        },
      });
    }

    /* ==================== DIVISI 7: QC OTOMATIS (EDITORIAL + VIDEO TELEMETRY) ==================== */
    if (division === "qc") {
      const input = body as unknown as QcInput;
      const start = Date.now();
      const deterministic = runDeterministicQc(input);

      let aiReviewNote =
        "Audit QC otomatis (durasi TikTok, keamanan klaim, anti-duplikat, & metrik file video aktual) selesai.";
      let provider = "deterministic-qc-v3";
      let model = "tiktok-qc-rules-v3";
      let tokensUsed = 0;

      const llm = await callFreeTierLLM<{
        policySafe?: boolean;
        editorialNote?: string;
        concerns?: string[];
      }>({
        taskType: "fast",
        systemPrompt: `Anda adalah Auditor QC Konten TikTok AI Technology profesional. Evaluasi kejelasan informasi, kejujuran klaim teknis, dan anti-clickbait secara objektif.
Balas HANYA JSON: { "policySafe": true/false, "editorialNote": "catatan singkat 1-2 kalimat", "concerns": [] }`,
        userPrompt: `Judul: ${input.title}
Ringkasan: ${input.summary}
Payoff: ${input.moralLesson}
Adegan: ${JSON.stringify(input.scenes.map((s) => s.narration))}`,
        expectJson: true,
        temperature: 0.2,
        maxTokens: 420,
        timeoutMs: 14000,
      });

      if (llm.ok) {
        provider = llm.provider;
        model = llm.model;
        tokensUsed = llm.usage.totalTokens;
        if (llm.parsed?.editorialNote) {
          aiReviewNote = String(llm.parsed.editorialNote);
        }
        if (llm.parsed?.policySafe === false) {
          deterministic.passed = false;
          const concerns = Array.isArray(llm.parsed.concerns)
            ? llm.parsed.concerns.join("; ")
            : "Dinilai berisiko menyesatkan oleh reviewer AI.";
          deterministic.blockedReasons.push(concerns);
          deterministic.checks.push({
            id: "ai-safety-review",
            label: "Audit Editorial AI (Kejujuran Klaim & Nilai Konten)",
            passed: false,
            severity: "blocker",
            detail: concerns,
          });
        } else {
          deterministic.checks.push({
            id: "ai-safety-review",
            label: "Audit Editorial AI (Kejujuran Klaim & Nilai Konten)",
            passed: true,
            severity: "warning",
            detail: aiReviewNote,
          });
        }
      }

      const output: QcOutput = {
        ...deterministic,
        aiReviewNote,
      };

      return NextResponse.json({
        ok: true,
        output,
        meta: {
          provider,
          model,
          durationMs: Date.now() - start,
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: tokensUsed },
          estimatedCostUsd: 0,
          attempts: llm.ok ? llm.attempts : [],
        },
      });
    }

    return NextResponse.json(
      {
        ok: false,
        error: `Divisi "${division}" tidak dijalankan di server. Gunakan research, seo, script, atau qc.`,
      },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Kesalahan server saat menjalankan divisi.",
      },
      { status: 500 }
    );
  }
}
