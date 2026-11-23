/**
 * STUDIO v10 — DRY RUN (tanpa ffmpeg, tanpa API key)
 *
 * Menjalankan seluruh jalur *keputusan* Auto-Pilot (tren → skor topik →
 * verifikasi sumber struktural → naskah → audit → blueprint → editing →
 * subtitle → QC) memakai bank kandidat yang sumbernya benar-benar dibuka,
 * lalu menulis bukti ke `docs/reports/studio-v10/`:
 *
 *   - run.json            : seluruh trace tahap + artefak episode
 *   - naskah-<n>.md       : naskah + audit + sumber
 *   - storyboard-<n>.svg  : papan cerita (placeholder warna, bukan video)
 *   - perbandingan.md     : uji anti-repetisi antar episode
 *   - skill-audit.md      : 26 skill + status berbasis bukti
 *
 * Menjalankan: npm run studio:dry-run
 */

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { CANDIDATE_BANK, CANDIDATE_BANK_VERIFIED_AT } from "../src/lib/studio/candidate-bank.ts";
import { runAutopilotPipeline, detectCapabilities } from "../src/lib/studio/autopilot-pipeline.ts";
import { runSkillAudit } from "../src/lib/studio/skill-audit.ts";
import { compareEpisodes } from "../src/lib/studio/episode-factory.ts";
import {
  appendTopicHistory,
  createFileBackend,
  loadTopicHistory,
  summarizeHistory,
} from "../src/lib/studio/topic-history.ts";
import { describeBlueprint } from "../src/lib/studio/creative-blueprint.ts";
import { describeEditingPlan } from "../src/lib/studio/dynamic-editing.ts";

const root = process.cwd();
const outDir = path.join(root, "docs/reports/studio-v10");
const dataDir = path.join(root, ".studio-data");
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(dataDir, { recursive: true });

/* ------------------------------------------------------------------ */
/* PNG encoder kecil (tanpa dependensi) — untuk papan cerita          */
/* ------------------------------------------------------------------ */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(width: number, height: number, rgb: (x: number, y: number) => [number, number, number]): Buffer {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  let offset = 0;
  for (let y = 0; y < height; y += 1) {
    raw[offset] = 0;
    offset += 1;
    for (let x = 0; x < width; x += 1) {
      const [r, g, b] = rgb(x, y);
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
      offset += 3;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

/* ------------------------------------------------------------------ */
/* Jalankan audit skill + pipeline                                    */
/* ------------------------------------------------------------------ */
const audit = runSkillAudit({ rootDir: root });
const caps = detectCapabilities(process.env);
const historyBackend = createFileBackend({
  filePath: path.join(dataDir, "topic-history.json"),
  fsModule: fs,
});
const historyBefore = await loadTopicHistory(historyBackend);

const run = runAutopilotPipeline({
  candidates: CANDIDATE_BANK,
  history: historyBefore.records,
  capabilities: caps,
  skillAudit: audit,
  episodesToBuild: 3,
  episodeNumberStart: historyBefore.records.length + 1,
});

for (const episode of run.episodes) {
  await appendTopicHistory(historyBackend, episode.historyRecord);
}
const historyAfter = await loadTopicHistory(historyBackend);

/* ------------------------------------------------------------------ */
/* Tulis artefak                                                      */
/* ------------------------------------------------------------------ */
fs.writeFileSync(
  path.join(outDir, "run.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      candidateBankVerifiedAt: CANDIDATE_BANK_VERIFIED_AT,
      capabilities: caps,
      historyBefore: { count: historyBefore.records.length, durability: historyBefore.durability, note: historyBefore.note },
      run,
      audit: {
        counts: audit.counts,
        verifiedActiveCount: audit.verifiedActiveCount,
        honestSummary: audit.honestSummary,
      },
    },
    null,
    2
  ),
  "utf8"
);

/* Naskah per episode */
for (const [i, episode] of run.episodes.entries()) {
  const lines = [
    `# Naskah episode ${i + 1} — ${episode.candidate.title}`,
    "",
    `- Kategori: ${episode.candidate.category}`,
    `- Sudut: ${episode.candidate.angle}`,
    `- Blueprint: ${episode.summary.blueprintLine}`,
    `- Editing: ${episode.summary.editingLine}`,
    `- Generator: ${episode.script.generator}`,
    `- Skor audit naskah: ${episode.scriptAudit.score} (${episode.scriptAudit.passes ? "lulus" : "belum lulus"})`,
    `- Estimasi durasi: ${episode.summary.estimatedDurationSec}s`,
    "",
    "## Naskah",
    "",
    ...episode.script.lines.map((l) => `**[${l.beat}]** ${l.text}${l.claimBearing ? " _(klaim bersumber)_" : ""}`),
    "",
    "## Temuan audit",
    "",
    episode.scriptAudit.findings.length
      ? episode.scriptAudit.findings.map((f) => `- ${f.severity.toUpperCase()} ${f.code}: ${f.message}`).join("\n")
      : "- Tidak ada temuan.",
    "",
    "## Sumber",
    "",
    ...episode.candidate.sources.map((s) => `- ${s.name} — ${s.url} (${s.kind}, ${s.publishedAt})`),
    "",
    "## Subtitle (10 cue pertama)",
    "",
    ...episode.subtitleCues.slice(0, 10).map((c) => `- ${c.startSec}s–${c.endSec}s: ${c.word}${c.highlight ? " *" : ""}`),
    "",
    `> ${episode.script.disclaimer ?? ""}`,
  ];
  fs.writeFileSync(path.join(outDir, `naskah-${i + 1}.md`), lines.join("\n"), "utf8");

  /* Papan cerita 4 panel, warna per scene (placeholder, bukan video) */
  const scenes = episode.editingPlan.scenes;
  const panelW = 240;
  const panelH = 426;
  const gap = 12;
  const cols = 4;
  const width = cols * panelW + (cols + 1) * gap;
  const height = panelH + gap * 2;
  const palette = [episode.blueprint.palette.bg, episode.blueprint.palette.support, episode.blueprint.palette.accent, episode.blueprint.palette.fg].map(hexToRgb);
  const png = encodePng(width, height, (x, y) => {
    const innerX = x - gap;
    const col = innerX < 0 ? -1 : Math.floor(innerX / (panelW + gap));
    const localX = innerX - col * (panelW + gap);
    const localY = y - gap;
    if (col < 0 || col >= cols || localX < 0 || localX > panelW || localY < 0 || localY > panelH) {
      return [10, 10, 14];
    }
    const scene = scenes[Math.min(scenes.length - 1, Math.floor((col / cols) * scenes.length))];
    const base = palette[scene ? scene.index % palette.length : 0] ?? [24, 24, 32];
    // pita horisontal mewakili jumlah potongan (cutIntervalSec)
    const bandHeight = Math.max(6, Math.round(panelH / (scene?.cutIntervalSec ?? 2)));
    const bandIndex = Math.floor(localY / bandHeight);
    const shade = bandIndex % 2 === 0 ? 1 : 0.82;
    // garis vertikal = transisi masuk
    const edge = localX > panelW - 6 ? 1.35 : 1;
    return [
      Math.min(255, Math.round(base[0] * shade * edge)),
      Math.min(255, Math.round(base[1] * shade * edge)),
      Math.min(255, Math.round(base[2] * shade * edge)),
    ];
  });
  fs.writeFileSync(path.join(outDir, `storyboard-${i + 1}.png`), png);
  fs.writeFileSync(
    path.join(outDir, `storyboard-${i + 1}.md`),
    [
      `# Papan cerita episode ${i + 1} — ${episode.candidate.title}`,
      "",
      describeBlueprint(episode.blueprint),
      "",
      describeEditingPlan(episode.editingPlan),
      "",
      "| # | Beat | Durasi | Kamera | Transisi keluar | Tipografi | Aset | Musik |",
      "|---|---|---|---|---|---|---|---|",
      ...scenes.map(
        (s) =>
          `| ${s.index} | ${s.beat} | ${s.durationSec}s | ${s.camera} | ${s.transitionOut} | ${s.typography} | ${s.asset} | ${s.musicIntensity} |`
      ),
      "",
      "_Gambar storyboard-*.png adalah placeholder warna/ritme, BUKAN frame video. Frame nyata butuh renderer + ffmpeg._",
    ].join("\n"),
    "utf8"
  );
}

/* Perbandingan antar episode */
const pairs: { label: string; a: number; b: number }[] = [];
for (let i = 0; i < run.episodes.length; i += 1) {
  for (let j = i + 1; j < run.episodes.length; j += 1) pairs.push({ label: `${i + 1} vs ${j + 1}`, a: i, b: j });
}
const comparisons = pairs.map((p) => ({
  label: p.label,
  ...compareEpisodes(run.episodes[p.a], run.episodes[p.b]),
}));

fs.writeFileSync(
  path.join(outDir, "perbandingan.md"),
  [
    "# Uji anti-repetisi — 3 episode",
    "",
    `Riwayat sebelum run: ${historyBefore.records.length} episode (${historyBefore.durability}).`,
    `Riwayat sesudah run: ${historyAfter.records.length} episode.`,
    "",
    "| Pasangan | Kemiripan topik | Kemiripan blueprint | Editing sama? | Kemiripan naskah | Gaya visual sama? | Hook sama? | Struktur sama? | Tipografi sama? | Transisi sama? | Vonis |",
    "|---|---|---|---|---|---|---|---|---|---|---|",
    ...comparisons.map(
      (c) =>
        `| ${c.label} | ${c.topicSimilarity} | ${c.blueprintSimilarity} | ${c.sameEditingSignature ? "YA" : "tidak"} | ${c.scriptSimilarity} | ${c.sameVisualStyle ? "YA" : "tidak"} | ${c.sameHookStyle ? "YA" : "tidak"} | ${c.sameNarrativeStructure ? "YA" : "tidak"} | ${c.sameTypography ? "YA" : "tidak"} | ${c.sameTransitionLanguage ? "YA" : "tidak"} | ${c.verdict} |`
    ),
    "",
    "## Catatan",
    ...comparisons.flatMap((c) => [`- ${c.label}: ${c.notes.length ? c.notes.join("; ") : "tidak ada elemen yang identik"}`]),
    "",
    "## Rekaman keputusan topik",
    ...run.selection.map(
      (s, i) =>
        `- Episode ${i + 1}: dipilih "${s.chosen?.title ?? "-"}" skor ${s.score?.total ?? "-"} (dibandingkan ${s.comparedEpisodes} episode; ${s.rejected.length} kandidat ditolak)`
    ),
    "",
    "## Ringkasan riwayat",
    "```json",
    JSON.stringify(summarizeHistory(historyAfter.records), null, 2),
    "```",
  ].join("\n"),
  "utf8"
);

/* Audit skill */
fs.writeFileSync(
  path.join(outDir, "skill-audit.md"),
  [
    "# Audit 26 skill — berbasis bukti",
    "",
    audit.honestSummary,
    "",
    `Dijalankan: ${audit.generatedAt} (${audit.durationMs} ms)`,
    "",
    "| # | Skill | Repo | Lisensi | Status | Bukti |",
    "|---|---|---|---|---|---|",
    ...audit.entries.map(
      (e, i) => `| ${i + 1} | ${e.name} | ${e.repo} | ${e.license} | **${e.status}** | ${e.evidence.join(" <br> ").replace(/\|/g, "\\|")} |`
    ),
    "",
    "## Hitungan status",
    "```json",
    JSON.stringify(audit.counts, null, 2),
    "```",
  ].join("\n"),
  "utf8"
);

/* ------------------------------------------------------------------ */
/* Ringkasan konsol                                                   */
/* ------------------------------------------------------------------ */
console.log("=== STUDIO v10 DRY RUN ===");
console.log(run.honestSummary);
console.log(`Riwayat: ${historyBefore.records.length} → ${historyAfter.records.length} (${historyAfter.durability})`);
console.log(audit.honestSummary);
for (const c of comparisons) console.log(`  ${c.label}: topik ${c.topicSimilarity}, blueprint ${c.blueprintSimilarity}, ${c.verdict}`);
for (const s of run.stages.slice(0, 14)) console.log(`  [${s.step.toString().padStart(2)}] ${s.stage}: ${s.status}${s.error ? ` — ${s.error}` : ""}`);
console.log(`Artefak: ${path.relative(root, outDir)}`);
