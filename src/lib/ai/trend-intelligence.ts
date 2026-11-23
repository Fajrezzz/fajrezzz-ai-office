import type { TrendSourceRecord } from "@/types/pipeline";

export interface TrendRankingBreakdown {
  freshnessScore: number;      // 0-25 (Kebaruan)
  relevanceScore: number;      // 0-25 (Relevansi AI Agent / Claude Code)
  attentionScore: number;      // 0-20 (Potensi menarik perhatian tanpa clickbait)
  sourceQualityScore: number;  // 0-15 (Kualitas sumber resmi vs komunitas)
  demoEaseScore: number;       // 0-15 (Kemudahan demonstrasi visual nyata)
  totalScore: number;          // 0-100
}

export interface RankedTrendSourceRecord extends TrendSourceRecord {
  ranking: TrendRankingBreakdown;
}

export interface TrendIntelligenceReport {
  fetchedAt: string;
  verifiedOnline: boolean;
  verificationNote: string;
  officialCount: number;
  communityCount: number;
  items: RankedTrendSourceRecord[];
}

interface OfficialRepoTarget {
  owner: string;
  repo: string;
  label: string;
  tags: string[];
}

const OFFICIAL_AI_REPOS: OfficialRepoTarget[] = [
  {
    owner: "anthropics",
    repo: "claude-code",
    label: "Anthropic Claude Code (Official GitHub)",
    tags: ["Claude Code", "Anthropic", "Terminal AI", "AI Coding Agent"],
  },
  {
    owner: "openai",
    repo: "codex",
    label: "OpenAI Codex CLI (Official GitHub)",
    tags: ["OpenAI", "Codex", "AI Coding", "CLI Agent"],
  },
  {
    owner: "google-gemini",
    repo: "gemini-cli",
    label: "Google Gemini CLI (Official GitHub)",
    tags: ["Gemini", "Google AI", "Terminal Agent", "Open Source"],
  },
  {
    owner: "All-Hands-AI",
    repo: "OpenHands",
    label: "OpenHands Autonomous SWE Agent (GitHub)",
    tags: ["AI Agent", "Autonomous SWE", "GitHub Automation"],
  },
  {
    owner: "cline",
    repo: "cline",
    label: "Cline Autonomous Coding Agent (GitHub)",
    tags: ["Cline", "VS Code AI", "Autonomous Coding"],
  },
  {
    owner: "browser-use",
    repo: "browser-use",
    label: "Browser-Use AI Web Agent (GitHub)",
    tags: ["Browser Agent", "AI Automation", "Workflow"],
  },
  {
    owner: "langchain-ai",
    repo: "langgraph",
    label: "LangGraph Multi-Agent Framework (GitHub)",
    tags: ["Multi-Agent", "Orchestration", "AI Workflow"],
  },
  {
    owner: "crewAIInc",
    repo: "crewAI",
    label: "CrewAI Multi-Agent Employees (GitHub)",
    tags: ["Multi-Agent", "Virtual Employees", "Automation"],
  },
];

function computeFreshnessDays(isoDate: string | null | undefined): number {
  if (!isoDate) return 999;
  const ts = Date.parse(isoDate);
  if (Number.isNaN(ts)) return 999;
  const diffMs = Math.max(0, Date.now() - ts);
  return Math.round((diffMs / (1000 * 60 * 60 * 24)) * 10) / 10;
}

function cleanExcerpt(text: string | null | undefined, maxLen = 220): string {
  if (!text) return "";
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`]/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

async function fetchGitHubOfficialRelease(
  target: OfficialRepoTarget,
  timeoutMs = 5500
): Promise<TrendSourceRecord | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "Fajrezzz-AI-Office-Trend-Intelligence/3.0",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    // 1. Prefer official latest release (exact version + release notes + published date)
    const relRes = await fetch(
      `https://api.github.com/repos/${target.owner}/${target.repo}/releases/latest`,
      { headers, signal: controller.signal, cache: "no-store" }
    );

    if (relRes.ok) {
      const rel = (await relRes.json()) as {
        tag_name?: string;
        name?: string;
        body?: string;
        html_url?: string;
        published_at?: string;
      };
      const publishedAt = rel.published_at || new Date().toISOString();
      const freshnessDays = computeFreshnessDays(publishedAt);
      const tag = rel.tag_name || rel.name || "latest";
      const excerpt = cleanExcerpt(rel.body, 200);
      return {
        id: `gh-rel-${target.owner}-${target.repo}-${tag}`,
        title: `${target.owner}/${target.repo} rilis resmi ${tag}${
          rel.name && rel.name !== tag ? ` — ${rel.name}` : ""
        }`,
        sourceName: target.label,
        sourceUrl:
          rel.html_url || `https://github.com/${target.owner}/${target.repo}/releases`,
        publishedAt,
        freshnessDays,
        classification: "official_release",
        verified: true,
        summary:
          excerpt ||
          `Rilis resmi ${tag} dari repositori ${target.owner}/${target.repo} di GitHub.`,
        tags: target.tags,
      };
    }

    // 2. Fallback to official repository metadata (pushed_at + description)
    const repoRes = await fetch(
      `https://api.github.com/repos/${target.owner}/${target.repo}`,
      { headers, signal: controller.signal, cache: "no-store" }
    );
    if (!repoRes.ok) return null;
    const repo = (await repoRes.json()) as {
      full_name?: string;
      description?: string;
      html_url?: string;
      pushed_at?: string;
      stargazers_count?: number;
    };
    const publishedAt = repo.pushed_at || new Date().toISOString();
    const freshnessDays = computeFreshnessDays(publishedAt);
    const stars = repo.stargazers_count
      ? ` (${repo.stargazers_count.toLocaleString("en-US")} GitHub stars)`
      : "";
    return {
      id: `gh-repo-${target.owner}-${target.repo}`,
      title: `Update repositori resmi ${repo.full_name || `${target.owner}/${target.repo}`}${stars}`,
      sourceName: target.label,
      sourceUrl: repo.html_url || `https://github.com/${target.owner}/${target.repo}`,
      publishedAt,
      freshnessDays,
      classification: "official_release",
      verified: true,
      summary:
        cleanExcerpt(repo.description, 200) ||
        `Repositori resmi ${target.owner}/${target.repo} aktif diperbarui.`,
      tags: target.tags,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchHackerNewsCommunityTrends(
  timeoutMs = 4500
): Promise<TrendSourceRecord[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const sinceEpoch = Math.floor((Date.now() - 21 * 24 * 60 * 60 * 1000) / 1000);
    const url = `https://hn.algolia.com/api/v1/search?query=Claude+Code+AI+agent&tags=story&numericFilters=created_at_i>${sinceEpoch},points>25&hitsPerPage=6`;
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      hits?: Array<{
        objectID?: string;
        title?: string;
        url?: string;
        created_at?: string;
        points?: number;
        num_comments?: number;
      }>;
    };
    const hits = Array.isArray(data.hits) ? data.hits : [];
    return hits
      .filter((h) => h.title && h.created_at)
      .slice(0, 5)
      .map((h) => {
        const publishedAt = h.created_at!;
        return {
          id: `hn-${h.objectID || Math.random().toString(36).slice(2, 8)}`,
          title: String(h.title).trim(),
          sourceName: `Hacker News Community (${h.points ?? 0} pts, ${h.num_comments ?? 0} komentar)`,
          sourceUrl:
            h.url || `https://news.ycombinator.com/item?id=${h.objectID || ""}`,
          publishedAt,
          freshnessDays: computeFreshnessDays(publishedAt),
          classification: "community_discussion" as const,
          verified: true,
          summary: `Diskusi aktif komunitas developer mengenai ${String(h.title).trim()}.`,
          tags: ["Community", "AI Agent", "Claude Code", "Developer Trend"],
        };
      });
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Phase 6 — Transparent 5-Factor Topic Ranking Engine (0–100).
 * Never promises viral views or fabricates traffic counts!
 * Ranks purely on: Kebaruan, Relevansi AI Agent/Claude Code, Potensi Menarik Perhatian,
 * Kualitas Sumber, dan Kemudahan Demonstrasi Nyata.
 */
export function scoreTrendTopic(item: TrendSourceRecord): TrendRankingBreakdown {
  const text = `${item.title} ${item.summary} ${item.tags.join(" ")}`.toLowerCase();

  // 1. Kebaruan (0-25)
  const freshnessScore =
    item.freshnessDays <= 3
      ? 25
      : item.freshnessDays <= 7
      ? 22
      : item.freshnessDays <= 14
      ? 18
      : item.freshnessDays <= 30
      ? 13
      : item.freshnessDays <= 60
      ? 8
      : 4;

  // 2. Relevansi AI Agent / Claude Code / Coding Agent / Multi-Agent (0-25)
  let relevanceScore = 8;
  if (/claude[- ]?code|anthropic/.test(text)) relevanceScore += 9;
  if (/ai agent|coding agent|multi-agent|autonomous|openhands|cline|codex|gemini-cli/.test(text)) {
    relevanceScore += 8;
  }
  relevanceScore = Math.min(25, relevanceScore);

  // 3. Potensi Menarik Perhatian (0-20): rilis versi baru, fitur baru, benchmark/eksperimen nyata
  let attentionScore = 8;
  if (/rilis resmi|release|v\d+\.\d+|added|new|support/.test(text)) attentionScore += 6;
  if (/browser|terminal|github|workflow|automation|mcp|tool/.test(text)) attentionScore += 6;
  attentionScore = Math.min(20, attentionScore);

  // 4. Kualitas Sumber (0-15)
  const sourceQualityScore = !item.verified
    ? 2
    : item.classification === "official_release"
    ? 15
    : item.classification === "community_discussion"
    ? 10
    : 5;

  // 5. Kemudahan Demonstrasi Nyata (0-15): CLI, GitHub PR, kode, diagram arsitektur
  let demoEaseScore = 5;
  if (/cli|terminal|bash|command|install|git|pr|code|diff/.test(text)) demoEaseScore += 6;
  if (/agent|workflow|multi-agent|browser|mcp/.test(text)) demoEaseScore += 4;
  demoEaseScore = Math.min(15, demoEaseScore);

  const totalScore =
    freshnessScore + relevanceScore + attentionScore + sourceQualityScore + demoEaseScore;

  return {
    freshnessScore,
    relevanceScore,
    attentionScore,
    sourceQualityScore,
    demoEaseScore,
    totalScore,
  };
}

export function rankTrendTopics(items: TrendSourceRecord[]): RankedTrendSourceRecord[] {
  return items
    .map((item) => ({
      ...item,
      ranking: scoreTrendTopic(item),
    }))
    .sort((a, b) => b.ranking.totalScore - a.ranking.totalScore);
}

/**
 * Trend Intelligence Division:
 * - Queries REAL official GitHub releases + Hacker News community discussions
 * - Filters stale items (> 90 days) so old news is NEVER disguised as breaking news
 * - Ranks topics transparently via 5-factor editorial scoring (zero fake views!)
 * - Explicitly marks unverified if offline
 */
export async function fetchLiveAiTrends(maxFreshnessDays = 90): Promise<TrendIntelligenceReport> {
  const fetchedAt = new Date().toISOString();

  const [repoResults, hnResults] = await Promise.all([
    Promise.all(OFFICIAL_AI_REPOS.map((t) => fetchGitHubOfficialRelease(t))),
    fetchHackerNewsCommunityTrends(),
  ]);

  const verifiedOfficial = repoResults
    .filter((item): item is TrendSourceRecord => item !== null)
    .filter((item) => item.freshnessDays <= maxFreshnessDays);

  const verifiedCommunity = hnResults.filter(
    (item) => item.freshnessDays <= Math.min(30, maxFreshnessDays)
  );

  const ranked = rankTrendTopics([...verifiedOfficial, ...verifiedCommunity]);

  if (ranked.length === 0) {
    return {
      fetchedAt,
      verifiedOnline: false,
      verificationNote:
        "Akses data tren online aktual belum dapat diverifikasi saat ini (API sumber resmi tidak merespons). Sistem tidak mengarang berita baru atau angka viralitas.",
      officialCount: 0,
      communityCount: 0,
      items: [],
    };
  }

  return {
    fetchedAt,
    verifiedOnline: true,
    verificationNote: `Terverifikasi ${verifiedOfficial.length} sumber resmi GitHub & ${verifiedCommunity.length} diskusi komunitas segar (diperingkat berdasarkan 5 faktor objektif).`,
    officialCount: verifiedOfficial.length,
    communityCount: verifiedCommunity.length,
    items: ranked,
  };
}

/**
 * Pure helper for unit tests & QC: checks whether a trend item is fresh & properly attributed.
 */
export function evaluateTrendFreshness(
  item: Pick<TrendSourceRecord, "publishedAt" | "verified" | "classification">,
  nowMs = Date.now(),
  maxAgeDays = 60
): { fresh: boolean; ageDays: number; warning: string | null } {
  const ts = Date.parse(item.publishedAt);
  if (Number.isNaN(ts)) {
    return {
      fresh: false,
      ageDays: 999,
      warning: "Tanggal publikasi sumber tidak valid — belum dapat diverifikasi.",
    };
  }
  const ageDays = Math.max(0, Math.round(((nowMs - ts) / 86_400_000) * 10) / 10);
  if (!item.verified) {
    return {
      fresh: false,
      ageDays,
      warning: "Sumber belum terverifikasi secara online.",
    };
  }
  if (ageDays > maxAgeDays) {
    return {
      fresh: false,
      ageDays,
      warning: `Berita berusia ${ageDays} hari (melebihi batas ${maxAgeDays} hari) — hindari mengemas berita lama seolah baru.`,
    };
  }
  return { fresh: true, ageDays, warning: null };
}
