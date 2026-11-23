"use client";

import { INSTALLED_GITHUB_SKILLS } from "@/lib/ai/github-skills-registry";

/**
 * Persistent Long-Term AI Memory Engine
 * Inspired by `akitaonrails/ai-memory` (cross-provider long-term ledger)
 * and `thedotmack/claude-mem` (automatic session capture, compression & context injection).
 */

import {
  buildMemoryRecallForState,
  type MemoryRecallEntry,
} from "@/lib/ai/memory-recall";

const MEMORY_STORAGE_KEY = "fajrezzz_ai_long_term_memory_v1";

export interface MemoryEntry {
  id: string;
  timestamp: string;
  kind: "episode" | "thought" | "qc_learning" | "topic_selected";
  actor: string;
  summary: string;
  skillsUsed: string[];
}

export interface AgentLongTermMemoryState {
  entries: MemoryEntry[];
  completedTopics: string[];
  skillHitCounts: Record<string, number>;
  lastUpdatedAt: string | null;
}

const DEFAULT_MEMORY: AgentLongTermMemoryState = {
  entries: [],
  completedTopics: [],
  skillHitCounts: {},
  lastUpdatedAt: null,
};

export function loadLongTermMemory(): AgentLongTermMemoryState {
  if (typeof window === "undefined") return DEFAULT_MEMORY;
  try {
    const raw = window.localStorage.getItem(MEMORY_STORAGE_KEY);
    if (!raw) return DEFAULT_MEMORY;
    const parsed = JSON.parse(raw) as Partial<AgentLongTermMemoryState>;
    return {
      entries: Array.isArray(parsed.entries) ? parsed.entries.slice(0, 60) : [],
      completedTopics: Array.isArray(parsed.completedTopics)
        ? parsed.completedTopics.slice(0, 40)
        : [],
      skillHitCounts:
        parsed.skillHitCounts && typeof parsed.skillHitCounts === "object"
          ? parsed.skillHitCounts
          : {},
      lastUpdatedAt: parsed.lastUpdatedAt ?? null,
    };
  } catch {
    return DEFAULT_MEMORY;
  }
}

export function saveLongTermMemory(state: AgentLongTermMemoryState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage quota
  }
}

export function recordMemoryEvent(params: {
  kind: MemoryEntry["kind"];
  actor: string;
  summary: string;
  topic?: string;
  skillsUsed?: string[];
}): AgentLongTermMemoryState {
  const cur = loadLongTermMemory();
  const skills = params.skillsUsed ?? [];
  const nextCounts = { ...cur.skillHitCounts };
  for (const repo of skills) {
    nextCounts[repo] = (nextCounts[repo] ?? 0) + 1;
  }

  const nextEntry: MemoryEntry = {
    id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    kind: params.kind,
    actor: params.actor,
    summary: params.summary.slice(0, 220),
    skillsUsed: skills,
  };

  const nextTopics = params.topic
    ? Array.from(new Set([params.topic.trim(), ...cur.completedTopics])).slice(0, 40)
    : cur.completedTopics;

  const next: AgentLongTermMemoryState = {
    entries: [nextEntry, ...cur.entries].slice(0, 60),
    completedTopics: nextTopics,
    skillHitCounts: nextCounts,
    lastUpdatedAt: nextEntry.timestamp,
  };
  saveLongTermMemory(next);
  return next;
}

/**
 * Compress recent long-term memories into short bullet strings for LLM context injection
 * (`claude-mem` / `ai-memory` pattern).
 */
export function buildCompressedMemoryContext(limit = 8): string[] {
  const mem = loadLongTermMemory();
  return mem.entries
    .slice(0, limit)
    .map((e) => `[${e.kind}|${e.actor}] ${e.summary}`);
}

/**
 * RECALL BERBOBOT (pola `rohitg00/agentmemory`) — lihat `memory-recall.ts`.
 */
export function buildMemoryRecall(
  query: string,
  limit = 5,
  state?: AgentLongTermMemoryState
): MemoryRecallEntry[] {
  return buildMemoryRecallForState(query, state ?? loadLongTermMemory(), limit);
}

export function getTotalSkillActivations(): number {
  const mem = loadLongTermMemory();
  return Object.values(mem.skillHitCounts).reduce((a, b) => a + b, 0);
}

export function getInstalledSkillIds(): string[] {
  return INSTALLED_GITHUB_SKILLS.map((s) => s.repo);
}
