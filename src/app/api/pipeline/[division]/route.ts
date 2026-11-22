import { NextResponse } from "next/server";
import { callFreeTierLLM } from "@/lib/ai/llm-provider";
import type { KidsThemeId } from "@/lib/kids-studio/episode-brain";
import type {
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

/** Deterministic child-safety banned words list (Indonesian & English) */
const BANNED_KIDS_WORDS = [
  "bunuh",
  "membunuh",
  "darah",
  "berdarah",
  "senjata",
  "pistol",
  "tembak",
  "narkoba",
  "mabuk",
  "alkohol",
  "rokok",
  "judi",
  "bodoh",
  "goblok",
  "anjing",
  "bangsat",
  "setan",
  "hantu seram",
  "horor",
  "kekerasan",
  "siksa",
  "bully",
  "seks",
  "telanjang",
  "porn",
  "kill",
  "blood",
  "gun",
  "weapon",
  "drugs",
  "stupid",
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
    if (i + 1 < tokens.length) {
      set.add(`${tokens[i]}_${tokens[i + 1]}`);
    }
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

function sanitizeThemeId(raw: unknown, fallbackText: string): KidsThemeId {
  if (
    typeof raw === "string" &&
    VALID_THEME_IDS.includes(raw as KidsThemeId)
  ) {
    return raw as KidsThemeId;
  }
  const lower = fallbackText.toLowerCase();
  if (/dino|t-rex|telur|warna/.test(lower)) return "dino_colors";
  if (/roket|bulan|planet|angkasa|bintang/.test(lower)) return "space_rocket";
  if (/hewan|kucing|kelinci|gajah|hutan|kebun/.test(lower))
    return "animal_friends";
  if (/ai|aplikasi|teknologi|coding|laptop/.test(lower)) return "ai_tech_tips";
  return "rescue_trucks";
}

function runDeterministicQc(input: QcInput): QcOutput {
  const checks: QcCheckItem[] = [];
  const blockedReasons: string[] = [];

  const scenes = Array.isArray(input.scenes) ? input.scenes : [];
  const totalSec = scenes.reduce((acc, s) => acc + (Number(s.durationSec) || 0), 0);

  // 1. Duration check
  const durationOk = totalSec >= 15 && totalSec <= 180 && scenes.length >= 4;
  checks.push({
    id: "duration",
    label: "Durasi & Jumlah Adegan",
    passed: durationOk,
    severity: "blocker",
    detail: durationOk
      ? `${scenes.length} adegan, total ${totalSec} detik (sesuai target Shorts/Video anak).`
      : `Durasi (${totalSec}d) atau jumlah adegan (${scenes.length}) di luar rentang aman 15–180 detik & min 4 adegan.`,
  });
  if (!durationOk) {
    blockedReasons.push("Durasi atau jumlah adegan belum memenuhi standar (min 4 adegan, 15–180 detik).");
  }

  // 2. Banned/unsafe word scan
  const combinedText = [
    input.title,
    input.description,
    input.summary,
    input.moralLesson,
    ...scenes.map((s) => `${s.narration} ${s.subtitle} ${s.visualCue}`),
  ]
    .join(" ")
    .toLowerCase();

  const foundBanned = BANNED_KIDS_WORDS.filter((word) => {
    const pattern = new RegExp(`\\b${word.replace(/\s+/g, "\\s+")}\\b`, "i");
    return pattern.test(combinedText);
  });

  const safeWordsOk = foundBanned.length === 0;
  checks.push({
    id: "banned-words",
    label: "Filter Kata Terlarang (COPPA / Ramah Anak)",
    passed: safeWordsOk,
    severity: "blocker",
    detail: safeWordsOk
      ? "0 kata kasar, kekerasan, horor, atau tidak pantas ditemukan."
      : `Ditemukan kata terlarang: ${foundBanned.join(", ")}.`,
  });
  if (!safeWordsOk) {
    blockedReasons.push(`Naskah mengandung kata terlarang untuk anak: ${foundBanned.join(", ")}.`);
  }

  // 3. Kids safety & educational value checklist
  const hasMoral = (input.moralLesson?.trim().length ?? 0) >= 8;
  const hasSummary = (input.summary?.trim().length ?? 0) >= 20;
  const kidsChecklistOk = hasMoral && hasSummary;
  checks.push({
    id: "kids-safety-checklist",
    label: "Checklist Keamanan & Nilai Edukasi Anak",
    passed: kidsChecklistOk,
    severity: "blocker",
    detail: kidsChecklistOk
      ? `Pesan edukasi jelas: "${input.moralLesson}".`
      : "Pesan moral atau ringkasan episode terlalu singkat / kosong.",
  });
  if (!kidsChecklistOk) {
    blockedReasons.push("Pesan edukasi ramah anak atau ringkasan naskah belum lengkap.");
  }

  // 4. Anti-duplication / similarity check against previous episodes
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
      prev.storyStructure.toLowerCase().trim() ===
        input.storyStructure.toLowerCase().trim() &&
      prev.setting.toLowerCase().trim() === input.setting.toLowerCase().trim()
    ) {
      duplicateStructureAndSetting = true;
    }
  }

  const similarityPct = Math.round(maxSimilarity * 100);
  const similarityOk = maxSimilarity < 0.45 && !duplicateStructureAndSetting;
  checks.push({
    id: "anti-duplicate",
    label: "Anti-Konten Seragam (Kemiripan Episode Sebelumnya)",
    passed: similarityOk,
    severity: "blocker",
    detail:
      (input.previousEpisodes?.length ?? 0) === 0
        ? "Episode pertama — belum ada episode pembanding."
        : duplicateStructureAndSetting
        ? `Struktur cerita ("${input.storyStructure}") + latar ("${input.setting}") sama persis dengan episode sebelumnya.`
        : similarityOk
        ? `Kemiripan tertinggi ${similarityPct}% (aman di bawah ambang batas 45%).`
        : `Terlalu mirip (${similarityPct}%) dengan "${mostSimilarTitle}" — berisiko dianggap konten massal/repetitif YouTube.`,
  });
  if (!similarityOk) {
    blockedReasons.push(
      duplicateStructureAndSetting
        ? "Struktur cerita dan latar terlalu seragam dengan episode sebelumnya. Ulangi Riset/Naskah dengan variasi baru."
        : `Kemiripan naskah ${similarityPct}% dengan "${mostSimilarTitle}" (batas maks 45%).`
    );
  }

  const passedCount = checks.filter((c) => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);
  const passed = blockedReasons.length === 0;

  return {
    passed,
    score,
    similarityScore: similarityPct,
    mostSimilarEpisodeTitle: mostSimilarTitle,
    blockedReasons,
    checks,
  };
}

export async function POST(
  request: Request,
  context: { params: Promise<{ division: string }> }
) {
  const { division } = await context.params;

  try {
    const body = (await request.json()) as Record<string, unknown>;

    /* ==================== DIVISI 1: RISET ==================== */
    if (division === "research") {
      const input = body as unknown as ResearchInput;
      if (!input.theme?.trim()) {
        return NextResponse.json(
          { ok: false, error: "Tema dari Bos wajib diisi." },
          { status: 400 }
        );
      }

      const systemPrompt = `Anda adalah Kepala Divisi Riset Konten YouTube Anak berbahasa Indonesia yang taat kebijakan monetisasi YouTube (anti konten massal/template seragam, 100% ramah anak COPPA).
Balas HANYA dalam JSON valid tanpa teks tambahan dengan skema:
{
  "ideas": [
    {
      "id": "idea-1",
      "title": "Judul konsep episode unik (Bahasa Indonesia)",
      "angle": "Sudut pandang/konflik unik yang membedakan dari episode lain",
      "themeId": "rescue_trucks | dino_colors | space_rocket | animal_friends | ai_tech_tips",
      "storyStructure": "Nama struktur cerita (beda untuk setiap ide, misal: Misteri Petunjuk, Estafet Kerja Sama, Tukar Peran Lucu, Eksperimen Gagal-Berhasil, Peta Harta Karun)",
      "setting": "Latar lokasi spesifik yang berbeda",
      "supportingCharacter": "Nama & jenis karakter pendukung unik",
      "moralLesson": "Pesan edukatif positif untuk anak",
      "hook3s": "Kalimat hook 3 detik pertama yang memikat",
      "targetAge": "3-7 tahun"
    }
  ]
}
WAJIB hasilkan tepat 5 ide yang masing-masing berbeda struktur cerita, latar, karakter pendukung, dan sudut pandang.`;

      const userPrompt = `Tema dari Bos: "${input.theme}"
Platform: ${input.platform}
Judul episode lama yang WAJIB dihindari sudutnya: ${JSON.stringify(input.previousEpisodeTitles ?? [])}
Struktur cerita lama yang dihindari: ${JSON.stringify(input.avoidStructures ?? [])}
Latar lama yang dihindari: ${JSON.stringify(input.avoidSettings ?? [])}
Karakter pendukung lama yang dihindari: ${JSON.stringify(input.avoidCharacters ?? [])}

Hasilkan 5 ide episode baru yang segar, orisinal, aman untuk anak, dan tidak terasa seperti template berulang.`;

      const llm = await callFreeTierLLM<{ ideas?: Partial<ResearchIdeaItem>[] }>({
        systemPrompt,
        userPrompt,
        expectJson: true,
        temperature: 0.85,
        maxTokens: 2000,
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

      const ideas: ResearchIdeaItem[] = rawIdeas.slice(0, 5).map((item, idx) => ({
        id: item.id || `idea-${idx + 1}`,
        title: String(item.title || `Ide Episode #${idx + 1}`).trim(),
        angle: String(item.angle || "Sudut cerita kreatif baru").trim(),
        themeId: sanitizeThemeId(item.themeId, `${input.theme} ${item.title ?? ""}`),
        storyStructure: String(item.storyStructure || `Struktur Unik ${idx + 1}`).trim(),
        setting: String(item.setting || `Latar Baru ${idx + 1}`).trim(),
        supportingCharacter: String(
          item.supportingCharacter || `Sahabat Baru ${idx + 1}`
        ).trim(),
        moralLesson: String(
          item.moralLesson || "Belajar tolong-menolong dan berani mencoba"
        ).trim(),
        hook3s: String(item.hook3s || "Wah, lihat apa yang terjadi hari ini!").trim(),
        targetAge: String(item.targetAge || "3-7 tahun").trim(),
      }));

      const output: ResearchOutput = { ideas };
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

    /* ==================== DIVISI 2: SEO ==================== */
    if (division === "seo") {
      const input = body as unknown as SeoInput;
      if (!input.idea?.title) {
        return NextResponse.json(
          { ok: false, error: "Ide riset wajib dipilih sebelum Divisi SEO bekerja." },
          { status: 400 }
        );
      }

      const systemPrompt = `Anda adalah Spesialis SEO YouTube Anak berbahasa Indonesia.
Balas HANYA dalam JSON valid tanpa teks tambahan dengan skema:
{
  "title": "Judul YouTube klik-tinggi ramah anak maksimal 72 karakter (tanpa clickbait menyesatkan)",
  "description": "Deskripsi lengkap berbahasa Indonesia (2-3 paragraf singkat + pesan edukasi untuk orang tua)",
  "tags": ["minimal 8 tag relevan tanpa #"],
  "hashtags": ["#Tag1", "#Tag2", "#Tag3", "#Tag4"],
  "thumbnailHeadline": "2-4 kata kapital singkat untuk thumbnail"
}`;

      const userPrompt = `Platform: ${input.platform}
Ide Episode: ${JSON.stringify(input.idea)}
Buat metadata SEO Bahasa Indonesia yang natural, aman untuk anak, tidak spam keyword.`;

      const llm = await callFreeTierLLM<Partial<SeoOutput>>({
        systemPrompt,
        userPrompt,
        expectJson: true,
        temperature: 0.65,
        maxTokens: 1200,
      });

      if (!llm.ok) {
        return NextResponse.json(llm, { status: llm.httpStatus });
      }

      const output: SeoOutput = {
        title: String(llm.parsed?.title || input.idea.title).trim().slice(0, 95),
        description: String(
          llm.parsed?.description ||
            `${input.idea.title}. ${input.idea.moralLesson}`
        ).trim(),
        tags: Array.isArray(llm.parsed?.tags)
          ? llm.parsed.tags.map((t) => String(t).replace(/^#/, "").trim()).filter(Boolean)
          : ["kartun anak", "edukasi anak", "animasi indonesia"],
        hashtags: Array.isArray(llm.parsed?.hashtags)
          ? llm.parsed.hashtags
              .map((h) => {
                const clean = String(h).trim();
                return clean.startsWith("#") ? clean : `#${clean}`;
              })
              .filter(Boolean)
          : ["#KartunAnak", "#EdukasiAnak", "#AnimasiIndonesia"],
        thumbnailHeadline: String(
          llm.parsed?.thumbnailHeadline || input.idea.title.split(" ").slice(0, 3).join(" ")
        )
          .toUpperCase()
          .trim()
          .slice(0, 32),
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

    /* ==================== DIVISI 3: NASKAH ==================== */
    if (division === "script") {
      const input = body as unknown as ScriptInput;
      if (!input.idea?.title || !input.seo?.title) {
        return NextResponse.json(
          { ok: false, error: "Hasil Riset & SEO wajib tersedia sebelum menulis Naskah." },
          { status: 400 }
        );
      }

      const isLong = input.platform === "youtube_landscape";
      const targetSceneCount = isLong ? 6 : 5;

      const bossHints = input.bossOriginalElements
        ? [
            input.bossOriginalElements.customIdea &&
              `Ide asli Bos: ${input.bossOriginalElements.customIdea}`,
            input.bossOriginalElements.customTwist &&
              `Twist cerita dari Bos: ${input.bossOriginalElements.customTwist}`,
            input.bossOriginalElements.customVoiceLine &&
              `Kalimat khas Bos: ${input.bossOriginalElements.customVoiceLine}`,
            input.bossOriginalElements.customCharacter &&
              `Karakter tambahan Bos: ${input.bossOriginalElements.customCharacter}`,
          ]
            .filter(Boolean)
            .join("\n")
        : "";

      const systemPrompt = `Anda adalah Penulis Naskah Animasi Anak profesional berbahasa Indonesia (100% ramah anak, ceria, edukatif, bebas kekerasan & kata kasar).
Balas HANYA dalam JSON valid tanpa teks tambahan dengan skema:
{
  "summary": "Ringkasan plot 2-3 kalimat untuk arsip anti-duplikat",
  "storyStructure": "Struktur cerita episode ini",
  "setting": "Latar lokasi utama",
  "supportingCharacter": "Karakter pendukung utama",
  "moralLesson": "Pesan moral positif",
  "scenes": [
    {
      "sceneNumber": 1,
      "label": "Nama adegan singkat",
      "durationSec": 5,
      "narration": "Dialog / narasi Bahasa Indonesia yang ceria dan alami untuk dibacakan TTS",
      "subtitle": "Teks subtitle pendek 4-9 kata untuk layar",
      "visualCue": "Arahan visual animasi per adegan",
      "mood": "intro | problem | action | solve | celebrate"
    }
  ]
}
WAJIB buat tepat ${targetSceneCount} adegan dengan durasi tiap adegan antara 4-8 detik.`;

      const userPrompt = `Judul SEO: ${input.seo.title}
Konsep Riset: ${JSON.stringify(input.idea)}
Platform: ${input.platform}
${bossHints ? `Elemen Orisinal dari Bos (WAJIB dimasukkan ke cerita):\n${bossHints}\n` : ""}
Ringkasan episode sebelumnya (WAJIB berbeda plot & kalimat):
${JSON.stringify((input.previousSummaries ?? []).slice(0, 6))}

Tulis naskah lengkap per adegan Bahasa Indonesia yang segar, komunikatif untuk anak, dan tidak generik.`;

      const llm = await callFreeTierLLM<Partial<ScriptOutput>>({
        systemPrompt,
        userPrompt,
        expectJson: true,
        temperature: 0.78,
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
            error: "AI menghasilkan kurang dari 4 adegan naskah. Klik Retry pada Divisi Naskah.",
            attempts: llm.attempts,
          },
          { status: 502 }
        );
      }

      const scenes: PipelineScene[] = rawScenes.map((s, idx) => ({
        sceneNumber: idx + 1,
        label: String(s.label || `Adegan ${idx + 1}`).trim(),
        durationSec: Math.min(12, Math.max(4, Number(s.durationSec) || 5)),
        narration: String(s.narration || "").trim(),
        subtitle: String(s.subtitle || s.narration || "").trim().slice(0, 72),
        visualCue: String(s.visualCue || input.idea.setting).trim(),
        mood: moods.includes(s.mood as PipelineScene["mood"])
          ? (s.mood as PipelineScene["mood"])
          : moods[Math.min(idx, moods.length - 1)],
      }));

      const totalDurationSec = scenes.reduce((acc, s) => acc + s.durationSec, 0);
      const output: ScriptOutput = {
        summary: String(
          llm.parsed?.summary ||
            `${input.seo.title}: ${input.idea.angle} di ${input.idea.setting}.`
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

    /* ==================== DIVISI 7: QC ==================== */
    if (division === "qc") {
      const input = body as unknown as QcInput;
      const start = Date.now();
      const deterministic = runDeterministicQc(input);

      // Optional AI editorial review if API key is configured; deterministic blockers always stand
      let aiReviewNote = "Pemeriksaan otomatis (durasi, kata terlarang, keamanan anak, dan anti-duplikat) selesai.";
      let provider: string = "deterministic-qc";
      let model: string = "rules-v1";
      let tokensUsed = 0;

      const llm = await callFreeTierLLM<{
        childSafe?: boolean;
        editorialNote?: string;
        concerns?: string[];
      }>({
        systemPrompt: `Anda adalah Auditor QC Konten YouTube Anak. Evaluasi keamanan anak & keunikan naskah secara objektif.
Balas HANYA JSON: { "childSafe": true/false, "editorialNote": "catatan singkat 1-2 kalimat", "concerns": [] }`,
        userPrompt: `Judul: ${input.title}
Ringkasan: ${input.summary}
Pesan Moral: ${input.moralLesson}
Adegan: ${JSON.stringify(input.scenes.map((s) => s.narration))}`,
        expectJson: true,
        temperature: 0.2,
        maxTokens: 450,
        timeoutMs: 14000,
      });

      if (llm.ok) {
        provider = llm.provider;
        model = llm.model;
        tokensUsed = llm.usage.totalTokens;
        if (llm.parsed?.editorialNote) {
          aiReviewNote = String(llm.parsed.editorialNote);
        }
        if (llm.parsed?.childSafe === false) {
          deterministic.passed = false;
          const concerns = Array.isArray(llm.parsed.concerns)
            ? llm.parsed.concerns.join("; ")
            : "Dinilai kurang sesuai untuk anak oleh reviewer AI.";
          deterministic.blockedReasons.push(concerns);
          deterministic.checks.push({
            id: "ai-safety-review",
            label: "Audit Editorial AI Ramah Anak",
            passed: false,
            severity: "blocker",
            detail: concerns,
          });
        } else {
          deterministic.checks.push({
            id: "ai-safety-review",
            label: "Audit Editorial AI Ramah Anak",
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
          usage: {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: tokensUsed,
          },
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
