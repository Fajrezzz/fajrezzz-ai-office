/**
 * RECALL BERBOBOT — adopsi inti retrieval `rohitg00/agentmemory`
 * (persistent memory untuk agent) tanpa daemon/MCP eksternal.
 *
 * Skor = kemiripan kata kunci + kebaruan + bobot jenis memori.
 * Modul ini sengaja bebas alias "@/" supaya bisa diuji langsung dengan
 * `node --experimental-strip-types`.
 */

export interface MemoryRecallEntry {
  id: string;
  timestamp: string;
  kind: "episode" | "thought" | "qc_learning" | "topic_selected";
  actor: string;
  summary: string;
  skillsUsed: string[];
}

export interface MemoryRecallState {
  entries: MemoryRecallEntry[];
}

const KIND_BOOST: Record<MemoryRecallEntry["kind"], number> = {
  qc_learning: 0.6,
  episode: 0.4,
  topic_selected: 0.3,
  thought: 0.2,
};

export function buildMemoryRecallForState(
  query: string,
  state: MemoryRecallState,
  limit = 5,
  nowMs: number = Date.now()
): MemoryRecallEntry[] {
  if (state.entries.length === 0) return [];
  const tokens = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3);
  if (tokens.length === 0) return [];

  const scored = state.entries.map((entry) => {
    const haystack = `${entry.summary} ${entry.actor} ${entry.kind}`.toLowerCase();
    const overlap = tokens.reduce(
      (acc, token) => (haystack.includes(token) ? acc + 1 : acc),
      0
    );
    const ageDays = Math.max(
      0,
      (nowMs - new Date(entry.timestamp).getTime()) / 86_400_000
    );
    const recency = Math.max(0, 1 - ageDays / 30);
    return {
      entry,
      score: overlap * 1.5 + recency + KIND_BOOST[entry.kind],
      overlap,
    };
  });

  return scored
    .filter((s) => s.overlap > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.entry);
}
