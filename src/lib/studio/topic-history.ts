/**
 * FAJREZZZ AI OFFICE — TOPIC HISTORY STORE (v10)
 *
 * Masalah nyata yang diperbaiki: anti-repetisi sebelumnya hanya memakai
 * `pastTopics` (maks 25 judul) yang dikirim dari browser — tidak ada riwayat
 * persisten, tidak ada kategori/sudut/hook, dan hilang saat halaman ditutup.
 *
 * Di sini riwayat punya skema lengkap + backend yang bisa dipilih, DENGAN
 * KEJUJURAN soal daya tahan penyimpanan:
 *
 *   - `file`    → JSON di disk (dev/CLI). Persisten di mesin, hilang di Vercel
 *                 karena filesystem serverless read-only (kecuali /tmp).
 *   - `browser` → localStorage. Persisten antar-reload, TAPI per-browser,
 *                 tidak lintas perangkat, dan hilang bila data situs dibersihkan.
 *   - `supabase`→ (belum aktif) butuh tabel + service role key. Placeholder
 *                 jujur: `durability: "not-configured"` → TIDAK dipakai.
 *   - `memory`  → hanya untuk test; hilang saat proses mati.
 *
 * Kesimpulan yang harus dilaporkan ke Bos: riwayat yang benar-benar lintas
 * perangkat/deploy memerlukan database (Supabase/KV). Sampai itu dipasang,
 * aplikasi memakai `browser` dan menampilkan label daya tahan di dashboard.
 */

import type { TopicHistoryRecord } from "./topic-intelligence.ts";
import { HISTORY_COMPARISON_WINDOW } from "./topic-intelligence.ts";

export type HistoryDurability =
  | "persistent-device"
  | "persistent-disk-dev"
  | "persistent-cloud"
  | "ephemeral";

export interface HistoryBackend {
  name: "browser" | "file" | "memory" | "supabase";
  durability: HistoryDurability;
  load(): Promise<TopicHistoryRecord[]>;
  save(records: TopicHistoryRecord[]): Promise<void>;
}

export const TOPIC_HISTORY_STORAGE_KEY = "fajrezzz_topic_history_v10";
export const MAX_HISTORY_RECORDS = 200;

/* ---------------------------- memory (test) ------------------------------- */

export function createMemoryBackend(seed: TopicHistoryRecord[] = []): HistoryBackend {
  let records = [...seed];
  return {
    name: "memory",
    durability: "ephemeral",
    async load() {
      return [...records];
    },
    async save(next) {
      records = [...next];
    },
  };
}

/* ---------------------------- browser (localStorage) ----------------------- */

export function createBrowserBackend(): HistoryBackend {
  const hasWindow = typeof window !== "undefined" && Boolean(window.localStorage);
  return {
    name: "browser",
    durability: hasWindow ? "persistent-device" : "ephemeral",
    async load() {
      if (!hasWindow) return [];
      try {
        const raw = window.localStorage.getItem(TOPIC_HISTORY_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as TopicHistoryRecord[]) : [];
      } catch {
        return [];
      }
    },
    async save(next) {
      if (!hasWindow) return;
      try {
        window.localStorage.setItem(
          TOPIC_HISTORY_STORAGE_KEY,
          JSON.stringify(next.slice(-MAX_HISTORY_RECORDS))
        );
      } catch {
        /* quota exceeded — riwayat lama tetap dipertahankan sebisa mungkin */
      }
    },
  };
}

/* ---------------------------- file (CLI / dev) ----------------------------- */

export interface FileBackendOptions {
  /** Path JSON. Default `<cwd>/.studio-data/topic-history.json`. */
  filePath?: string;
  /** Implementasi fs diinject supaya modul tetap murni & mudah diuji. */
  fsModule?: {
    readFileSync: (p: string, enc: "utf8") => string;
    writeFileSync: (p: string, data: string, enc: "utf8") => void;
    mkdirSync: (p: string, opts: { recursive: boolean }) => void;
    existsSync: (p: string) => boolean;
  };
  defaultPath?: string;
}

export function createFileBackend(options: FileBackendOptions = {}): HistoryBackend {
  const path = options.filePath ?? options.defaultPath ?? ".studio-data/topic-history.json";
  const fs = options.fsModule;
  return {
    name: "file",
    durability: fs ? "persistent-disk-dev" : "ephemeral",
    async load() {
      if (!fs) return [];
      try {
        if (!fs.existsSync(path)) return [];
        const raw = fs.readFileSync(path, "utf8");
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as TopicHistoryRecord[]) : [];
      } catch {
        return [];
      }
    },
    async save(next) {
      if (!fs) return;
      try {
        const dir = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : ".";
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path, JSON.stringify(next.slice(-MAX_HISTORY_RECORDS), null, 2), "utf8");
      } catch {
        /* biarkan gagal diam-diam: daya tahan sudah dilaporkan ke dashboard */
      }
    },
  };
}

/** Supabase belum aktif — jangan mengaku persistensi cloud kalau belum ada tabel. */
export function createSupabaseBackendPlaceholder(): HistoryBackend {
  return {
    name: "supabase",
    durability: "ephemeral",
    async load() {
      return [];
    },
    async save() {
      /* no-op: menunggu skema tabel `studio_topic_history` + service role key */
    },
  };
}

/* ---------------------------- akses tingkat tinggi ------------------------- */

export interface LoadedHistory {
  records: TopicHistoryRecord[];
  backend: HistoryBackend["name"];
  durability: HistoryDurability;
  note: string;
}

export async function loadTopicHistory(backend: HistoryBackend): Promise<LoadedHistory> {
  const records = await backend.load();
  const sorted = [...records].sort((a, b) => Date.parse(a.producedAt) - Date.parse(b.producedAt));
  const notes: Record<HistoryDurability, string> = {
    "persistent-cloud": "Riwayat tersimpan di database — aman lintas perangkat & deploy.",
    "persistent-disk-dev": "Riwayat tersimpan sebagai file JSON di disk (khusus dev/CLI).",
    "persistent-device":
      "Riwayat tersimpan di localStorage browser ini. Hilang bila data situs dibersihkan atau dibuka dari perangkat lain.",
    ephemeral: "Riwayat HANYA di memori — hilang saat proses berhenti. Jangan dipakai di produksi.",
  };
  return {
    records: sorted.slice(-MAX_HISTORY_RECORDS),
    backend: backend.name,
    durability: backend.durability,
    note: notes[backend.durability],
  };
}

export async function appendTopicHistory(
  backend: HistoryBackend,
  record: TopicHistoryRecord
): Promise<TopicHistoryRecord[]> {
  const existing = await backend.load();
  const deduped = existing.filter((r) => r.episodeId !== record.episodeId);
  const next = [...deduped, record]
    .sort((a, b) => Date.parse(a.producedAt) - Date.parse(b.producedAt))
    .slice(-MAX_HISTORY_RECORDS);
  await backend.save(next);
  return next;
}

/** 30 episode terbaru — jendela pembanding anti-repetisi. */
export function recentWindow(
  records: TopicHistoryRecord[],
  window = HISTORY_COMPARISON_WINDOW
): TopicHistoryRecord[] {
  return [...records]
    .sort((a, b) => Date.parse(b.producedAt) - Date.parse(a.producedAt))
    .slice(0, window);
}

/** Statistik ringkas untuk dashboard. */
export function summarizeHistory(records: TopicHistoryRecord[]): {
  total: number;
  byCategory: { category: string; count: number }[];
  byStatus: Record<string, number>;
  lastProducedAt: string | null;
} {
  const byCategory = new Map<string, number>();
  const byStatus: Record<string, number> = {};
  let lastProducedAt: string | null = null;
  for (const r of records) {
    byCategory.set(r.category, (byCategory.get(r.category) ?? 0) + 1);
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    if (!lastProducedAt || Date.parse(r.producedAt) > Date.parse(lastProducedAt)) lastProducedAt = r.producedAt;
  }
  return {
    total: records.length,
    byCategory: [...byCategory.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count),
    byStatus,
    lastProducedAt,
  };
}
