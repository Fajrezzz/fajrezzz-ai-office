/**
 * DESIGN INTELLIGENCE — audit UI/UX terukur (v9.3)
 *
 * Diadopsi dari pola `nextlevelbuilder/ui-ux-pro-max-skill`: setiap tipe produk
 * punya playbook (palet, skala tipografi, anti-pattern) dan setiap klaim desain
 * harus bisa diukur — kontras WCAG, ukuran target sentuh, ukuran teks minimum.
 *
 * Dipakai untuk memeriksa UI kita sendiri (termasuk tampilan HP 722×1600) dan
 * sebagai direktif prompt saat agent merancang panel/thumbnail baru.
 */

export type ProductTypeId =
  | "content-studio"
  | "video-editor"
  | "analytics-dashboard"
  | "landing-page";

export interface DesignPlaybook {
  id: ProductTypeId;
  label: string;
  palette: { surface: string; ink: string; muted: string; accent: string };
  typeScalePx: { body: number; label: number; heading: number };
  layoutRule: string;
  antiPatterns: string[];
}

export const DESIGN_PLAYBOOKS: Record<ProductTypeId, DesignPlaybook> = {
  "content-studio": {
    id: "content-studio",
    label: "Content Studio / Studio Produksi Video",
    palette: {
      surface: "#0B1220",
      ink: "#F8FAFC",
      muted: "#94A3B8",
      accent: "#22D3EE",
    },
    typeScalePx: { body: 14, label: 11, heading: 20 },
    layoutRule:
      "Panel kontrol di tepi, preview di tengah, aksi utama satu warna aksen; progres & status selalu terlihat tanpa scroll.",
    antiPatterns: [
      "Tombol utama lebih kecil dari 44px di layar sentuh",
      "Teks abu-abu di atas hitam dengan kontras < 4.5:1",
      "Lebih dari 2 warna aksen dalam satu panel",
    ],
  },
  "video-editor": {
    id: "video-editor",
    label: "Video Editor / Timeline",
    palette: {
      surface: "#111113",
      ink: "#F5F5F4",
      muted: "#A1A1AA",
      accent: "#F5A623",
    },
    typeScalePx: { body: 13, label: 11, heading: 16 },
    layoutRule: "Preview 9:16 dominan, timeline di bawah, kontrol render sticky di bawah layar.",
    antiPatterns: ["Scrubber lebih tipis dari 24px", "Angka FPS/bitrate tanpa satuan"],
  },
  "analytics-dashboard": {
    id: "analytics-dashboard",
    label: "Analytics Dashboard",
    palette: {
      surface: "#0F1115",
      ink: "#F1F5F9",
      muted: "#94A3B8",
      accent: "#2D6BFF",
    },
    typeScalePx: { body: 13, label: 10, heading: 18 },
    layoutRule: "KPI dulu, tren kedua, detail terakhir; satu sumbu warna per metrik.",
    antiPatterns: ["Rainbow ramp untuk data biasa", "Grafik tanpa label sumbu/satuan"],
  },
  "landing-page": {
    id: "landing-page",
    label: "Landing Page",
    palette: {
      surface: "#F6F1E7",
      ink: "#111113",
      muted: "#6B6C63",
      accent: "#E23A2E",
    },
    typeScalePx: { body: 16, label: 12, heading: 34 },
    layoutRule: "Satu janji utama di atas lipatan, bukti konkret, lalu satu ajakan bertindak.",
    antiPatterns: ["Hero penuh teks tanpa hierarki", "Dua CTA bersaing bersebelahan"],
  },
};

function normalizeHex(hex: string): string | null {
  const value = hex.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(value)) {
    return `#${value
      .split("")
      .map((c) => c + c)
      .join("")}`.toUpperCase();
  }
  if (/^[0-9a-f]{6}$/i.test(value)) return `#${value.toUpperCase()}`;
  return null;
}

/** Luminans relatif WCAG 2.x. Warna tidak valid → null (bukan diam-diam 0). */
export function relativeLuminance(hex: string): number | null {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  const channels = [1, 3, 5].map((i) => {
    const c = parseInt(normalized.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** Rasio kontras WCAG (1–21). Null kalau salah satu warna tidak valid. */
export function contrastRatio(foreground: string, background: string): number | null {
  const lf = relativeLuminance(foreground);
  const lb = relativeLuminance(background);
  if (lf === null || lb === null) return null;
  const lighter = Math.max(lf, lb);
  const darker = Math.min(lf, lb);
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

export type WcagLevel = "AAA" | "AA" | "AA-large" | "gagal";

export function wcagLevel(ratio: number, largeText = false): WcagLevel {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (largeText && ratio >= 3) return "AA-large";
  if (ratio >= 3) return "AA-large";
  return "gagal";
}

export interface DesignAuditInput {
  playbook?: ProductTypeId;
  /** pasangan warna yang benar-benar dipakai di layar */
  pairs?: Array<{ label: string; fg: string; bg: string; largeText?: boolean }>;
  /** ukuran tombol terkecil (px CSS) di layar sentuh */
  minTapPx?: number;
  /** ukuran teks terkecil (px CSS) */
  minTextPx?: number;
}

export interface DesignAuditIssue {
  id: string;
  label: string;
  severity: "info" | "warning" | "error";
  detail: string;
}

export interface DesignAuditResult {
  playbook: ProductTypeId;
  passed: boolean;
  issues: DesignAuditIssue[];
  checkedPairs: number;
}

/** Audit terukur: kontras, target sentuh, ukuran teks minimum. */
export function auditDesign(input: DesignAuditInput = {}): DesignAuditResult {
  const playbookId = input.playbook ?? "content-studio";
  const playbook = DESIGN_PLAYBOOKS[playbookId];
  const pairs =
    input.pairs ??
    [
      { label: "Teks utama", fg: playbook.palette.ink, bg: playbook.palette.surface },
      { label: "Teks sekunder", fg: playbook.palette.muted, bg: playbook.palette.surface },
      { label: "Aksen di permukaan", fg: playbook.palette.accent, bg: playbook.palette.surface },
    ];
  const issues: DesignAuditIssue[] = [];

  for (const pair of pairs) {
    const ratio = contrastRatio(pair.fg, pair.bg);
    if (ratio === null) {
      issues.push({
        id: `warna-invalid:${pair.label}`,
        label: `Warna tidak valid (${pair.label})`,
        severity: "error",
        detail: `${pair.fg} / ${pair.bg} bukan hex 3/6 digit.`,
      });
      continue;
    }
    const level = wcagLevel(ratio, pair.largeText ?? false);
    if (ratio < 4.5) {
      issues.push({
        id: `kontras:${pair.label}`,
        label: `Kontras kurang: ${pair.label}`,
        severity: ratio < 3 ? "error" : "warning",
        detail: `${ratio}:1 (${level}). Target minimal 4.5:1 untuk teks normal.`,
      });
    }
  }

  const minTap = input.minTapPx ?? 44;
  if (minTap < 44) {
    issues.push({
      id: "tap-target",
      label: "Target sentuh terlalu kecil",
      severity: "error",
      detail: `${minTap}px < 44px — di HP 722×1600 gampang salah tekan.`,
    });
  }

  const minText = input.minTextPx ?? 12;
  if (minText < 11) {
    issues.push({
      id: "ukuran-teks",
      label: "Teks terlalu kecil",
      severity: "warning",
      detail: `${minText}px — label sekunder minimal 11px, body minimal 13px.`,
    });
  }

  return {
    playbook: playbookId,
    passed: issues.every((i) => i.severity !== "error"),
    issues,
    checkedPairs: pairs.length,
  };
}

/** Blok prompt saat agent merancang panel/thumbnail baru. */
export function buildDesignPromptBlock(playbookId: ProductTypeId = "content-studio"): string {
  const p = DESIGN_PLAYBOOKS[playbookId];
  return [
    `[ui-ux-pro-max] Playbook UI: ${p.label}`,
    `- Palet: surface ${p.palette.surface}, ink ${p.palette.ink}, muted ${p.palette.muted}, aksen ${p.palette.accent} (maks 1 aksen tambahan).`,
    `- Skala teks: body ${p.typeScalePx.body}px, label ${p.typeScalePx.label}px, heading ${p.typeScalePx.heading}px.`,
    `- Aturan layout: ${p.layoutRule}`,
    `- Wajib: kontras teks ≥ 4.5:1, target sentuh ≥ 44px (layar HP 722×1600).`,
    `- Anti-pattern: ${p.antiPatterns.join("; ")}.`,
  ].join("\n");
}
