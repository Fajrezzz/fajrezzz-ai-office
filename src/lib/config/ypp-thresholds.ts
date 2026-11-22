/**
 * Konstanta ambang batas YouTube Partner Program (YPP).
 * Disimpan terpisah agar mudah diperbarui kapan saja jika YouTube mengubah aturan.
 */

export const YPP_TARGET_DEADLINE_ISO = "2027-02-01T00:00:00+07:00";
export const YPP_TARGET_DEADLINE_LABEL = "1 Februari 2027";

export interface YppThresholdSpec {
  id: "ad_revenue" | "fan_funding";
  label: string;
  description: string;
  subscribers: number;
  watchHours365d: number;
  shortsViews90d: number;
}

/** Syarat Monetisasi Iklan Penuh (AdSense + Shorts Ad Revenue Sharing) */
export const YPP_AD_REVENUE_THRESHOLDS: YppThresholdSpec = {
  id: "ad_revenue",
  label: "YPP Monetisasi Iklan Penuh",
  description:
    "Butuh 1.000 subscriber + salah satu dari: 4.000 jam tayang (365 hari) ATAU 10 juta tayangan Shorts publik (90 hari).",
  subscribers: 1_000,
  watchHours365d: 4_000,
  shortsViews90d: 10_000_000,
};

/** Syarat Akses Awal YPP (Fan Funding / Super Chat / Membership) */
export const YPP_FAN_FUNDING_THRESHOLDS: YppThresholdSpec = {
  id: "fan_funding",
  label: "YPP Akses Awal (Fan Funding)",
  description:
    "Butuh 500 subscriber + salah satu dari: 3.000 jam tayang (365 hari) ATAU 3 juta tayangan Shorts publik (90 hari).",
  subscribers: 500,
  watchHours365d: 3_000,
  shortsViews90d: 3_000_000,
};

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

export function getCountdownToYppDeadline(now = new Date()): CountdownParts {
  const targetMs = new Date(YPP_TARGET_DEADLINE_ISO).getTime();
  const diff = targetMs - now.getTime();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { days, hours, minutes, seconds, expired: false };
}
