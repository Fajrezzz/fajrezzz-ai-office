/**
 * VISUAL PROSEDURAL — digambar per frame di Node lalu dikirim ke ffmpeg
 * sebagai rawvideo RGB24 (360x640), di-upscale ke 1080x1920 oleh ffmpeg.
 *
 * Kenapa low-res: bagian ini hanya mengurus cahaya, embun, embun beku, dan
 * partikel (semuanya lembut), jadi upscale lanczos tidak merusak apa pun.
 * Semua teks digambar ffmpeg di resolusi penuh, jadi tetap tajam.
 */

export type RGB = [number, number, number];

export const VW = 360;
export const VH = 640;
/** Kanvas akhir 1080x1920 → faktor 3. */
export const SCALE = 3;

export function rgb(hex: string): RGB {
  const c = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16)) as RGB;
}

export function mix(a: RGB, b: RGB, t: number): RGB {
  const k = Math.max(0, Math.min(1, t));
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function easeOut(v: number): number {
  const t = clamp01(v);
  return 1 - (1 - t) * (1 - t) * (1 - t);
}

/** PRNG deterministik supaya tiap render menghasilkan visual yang sama. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BG_CACHE = new Map<string, Float32Array>();

export class Frame {
  readonly data: Float32Array;

  constructor() {
    this.data = new Float32Array(VW * VH * 3);
  }

  /** Gradasi vertikal + vignette lembut, dipakai semua scene (di-cache per palet). */
  background(top: RGB, bottom: RGB, glowAt?: { x: number; y: number; r: number; color: RGB; strength: number }): void {
    const key = `${top.join(",")}|${bottom.join(",")}|${glowAt ? `${glowAt.x},${glowAt.y},${glowAt.r},${glowAt.color.join(",")},${glowAt.strength}` : "-"}`;
    let cached = BG_CACHE.get(key);
    if (!cached) {
      const frame = new Frame();
      const d = frame.data;
      for (let y = 0; y < VH; y += 1) {
        const vy = y / (VH - 1);
        const k = 0.15 * vy + 0.85 * vy * vy;
        const base = mix(top, bottom, k);
        for (let x = 0; x < VW; x += 1) {
          const idx = (y * VW + x) * 3;
          d[idx] = base[0];
          d[idx + 1] = base[1];
          d[idx + 2] = base[2];
        }
      }
      if (glowAt) frame.glow(glowAt.x, glowAt.y, glowAt.r, glowAt.color, glowAt.strength);
      frame.vignette(0.55);
      cached = frame.data;
      BG_CACHE.set(key, cached);
    }
    this.data.set(cached);
  }

  vignette(strength: number): void {
    const d = this.data;
    for (let y = 0; y < VH; y += 1) {
      const dy = (y - VH / 2) / (VH / 2);
      for (let x = 0; x < VW; x += 1) {
        const dx = (x - VW / 2) / (VW / 2);
        const v = Math.min(1, (dx * dx + dy * dy) * 0.45);
        const f = 1 - v * strength;
        const idx = (y * VW + x) * 3;
        d[idx] *= f;
        d[idx + 1] *= f;
        d[idx + 2] *= f;
      }
    }
  }

  blend(x: number, y: number, color: RGB, alpha: number): void {
    const xi = x | 0;
    const yi = y | 0;
    if (xi < 0 || yi < 0 || xi >= VW || yi >= VH) return;
    const idx = (yi * VW + xi) * 3;
    const a = alpha < 0 ? 0 : alpha > 1 ? 1 : alpha;
    const d = this.data;
    d[idx] += (color[0] - d[idx]) * a;
    d[idx + 1] += (color[1] - d[idx + 1]) * a;
    d[idx + 2] += (color[2] - d[idx + 2]) * a;
  }

  glow(cx: number, cy: number, radius: number, color: RGB, strength: number): void {
    const d = this.data;
    const x0 = Math.max(0, Math.floor(cx - radius));
    const x1 = Math.min(VW - 1, Math.ceil(cx + radius));
    const y0 = Math.max(0, Math.floor(cy - radius));
    const y1 = Math.min(VH - 1, Math.ceil(cy + radius));
    const r2 = radius * radius;
    for (let y = y0; y <= y1; y += 1) {
      const dy = y - cy;
      for (let x = x0; x <= x1; x += 1) {
        const dx = x - cx;
        const dist2 = dx * dx + dy * dy;
        if (dist2 > r2) continue;
        const f = 1 - Math.sqrt(dist2) / radius;
        const a = f * f * strength;
        const idx = (y * VW + x) * 3;
        d[idx] += (color[0] - d[idx]) * a;
        d[idx + 1] += (color[1] - d[idx + 1]) * a;
        d[idx + 2] += (color[2] - d[idx + 2]) * a;
      }
    }
  }

  rect(x: number, y: number, w: number, h: number, color: RGB, alpha: number): void {
    const x0 = Math.max(0, Math.round(x));
    const y0 = Math.max(0, Math.round(y));
    const x1 = Math.min(VW, Math.round(x + w));
    const y1 = Math.min(VH, Math.round(y + h));
    for (let yy = y0; yy < y1; yy += 1) {
      for (let xx = x0; xx < x1; xx += 1) this.blend(xx, yy, color, alpha);
    }
  }

  roundRect(x: number, y: number, w: number, h: number, r: number, color: RGB, alpha: number): void {
    const x0 = Math.max(0, Math.floor(x));
    const y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(VW, Math.ceil(x + w));
    const y1 = Math.min(VH, Math.ceil(y + h));
    for (let yy = y0; yy < y1; yy += 1) {
      for (let xx = x0; xx < x1; xx += 1) {
        const px = xx - x + 0.5;
        const py = yy - y + 0.5;
        const cx = Math.min(Math.max(px, r), w - r);
        const cy = Math.min(Math.max(py, r), h - r);
        const dx = px - cx;
        const dy = py - cy;
        if (dx * dx + dy * dy > r * r) continue;
        this.blend(xx, yy, color, alpha);
      }
    }
  }

  /** Garis tebal: stempel lingkaran kecil di sepanjang segmen. */
  line(x0: number, y0: number, x1: number, y1: number, color: RGB, alpha: number, thickness = 1.6): void {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.ceil(len * 2));
    const r = thickness / 2;
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const cx = x0 + (x1 - x0) * t;
      const cy = y0 + (y1 - y0) * t;
      for (let oy = -r; oy <= r; oy += 0.5) {
        for (let ox = -r; ox <= r; ox += 0.5) {
          if (ox * ox + oy * oy > r * r) continue;
          this.blend(cx + ox, cy + oy, color, alpha);
        }
      }
    }
  }

  /** Segmen garis dengan ujung membulat, alpha di ujung mengecil (cahaya). */
  taperLine(x0: number, y0: number, x1: number, y1: number, color: RGB, alpha: number, thickness: number): void {
    const steps = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const cx = x0 + (x1 - x0) * t;
      const cy = y0 + (y1 - y0) * t;
      const a = alpha * (1 - t * 0.7);
      const r = (thickness / 2) * (1 - t * 0.6);
      for (let oy = -r; oy <= r; oy += 0.5) {
        for (let ox = -r; ox <= r; ox += 0.5) {
          if (ox * ox + oy * oy > r * r) continue;
          this.blend(cx + ox, cy + oy, color, a);
        }
      }
    }
  }

  /** Tetesan embun: bulat, sedikit memanjang, dengan kilau di kiri atas. */
  droplet(cx: number, cy: number, r: number, color: RGB, alpha = 0.9): void {
    const rx = r;
    const ry = r * 1.12;
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
        const nx = (x + 0.5 - cx) / rx;
        const ny = (y + 0.5 - cy) / ry;
        const d = nx * nx + ny * ny;
        if (d > 1) continue;
        // tepi lebih tipis, tengah lebih pekat
        const edge = 1 - Math.pow(d, 3);
        this.blend(x, y, mix(color, [235, 250, 255], 0.15), alpha * edge);
      }
    }
    this.glow(cx - rx * 0.3, cy - ry * 0.35, Math.max(1.2, r * 0.55), [240, 252, 255], 0.75 * alpha);
  }

  /** Kristal es: garis bercabang (dipakai scene "ice"). */
  crystal(x: number, y: number, angle: number, length: number, depth: number, color: RGB, alpha: number): void {
    if (depth <= 0 || length < 2) return;
    const x1 = x + Math.cos(angle) * length;
    const y1 = y + Math.sin(angle) * length;
    this.taperLine(x, y, x1, y1, color, alpha, Math.max(0.7, length * 0.1));
    const branches = depth > 2 ? 2 : 3;
    for (let i = 1; i <= branches; i += 1) {
      const t = i / (branches + 1);
      const bx = x + (x1 - x) * t;
      const by = y + (y1 - y) * t;
      const spread = depth > 2 ? 0.9 : 0.55;
      this.crystal(bx, by, angle + spread, length * 0.42, depth - 1, color, alpha * 0.8);
      this.crystal(bx, by, angle - spread, length * 0.42, depth - 1, color, alpha * 0.8);
    }
  }

  /** Ubah ke RGB24 + grain halus. */
  toRgb(out: Uint8Array, seed = 1): void {
    const d = this.data;
    let idx = 0;
    for (let y = 0; y < VH; y += 1) {
      for (let x = 0; x < VW; x += 1) {
        const noise = ((x * 374761393 + y * 668265263 + seed * 2654435761) ^ ((x * 1274126177 + y * 1103515245) >>> 13)) >>> 0;
        const grain = ((noise % 1000) / 1000) * 8 - 4;
        for (let c = 0; c < 3; c += 1) {
          const v = d[idx + c] + grain;
          out[idx + c] = v <= 0 ? 0 : v >= 255 ? 255 : v | 0;
        }
        idx += 3;
      }
    }
  }
}

/* ------------------------------ data per scene ----------------------------- */

interface Drop {
  x: number;
  y: number;
  r: number;
  appear: number;
  slide: number;
}

interface Mote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  ph: number;
}

const CACHE = new Map<string, unknown>();

function cached<T>(key: string, make: () => T): T {
  if (!CACHE.has(key)) CACHE.set(key, make());
  return CACHE.get(key) as T;
}

const CYAN = rgb("#35e0ff");
const ICE = rgb("#cdf3ff");
const ORANGE = rgb("#ff5a1f");
const WARM = rgb("#ffb27a");

/* ---------------------------------- scenes -------------------------------- */

function hook(f: Frame, t: number, d: number): void {
  const p = clamp01(t / d);
  f.background(rgb("#04060b"), rgb("#0a1622"), { x: 210, y: 380, r: 260, color: CYAN, strength: 0.16 });

  const drops = cached<Drop[]>("hook-drops", () => {
    const rand = rng(7);
    return Array.from({ length: 26 }, () => ({
      x: 118 + rand() * 124,
      y: 250 + rand() * 200,
      r: 1.2 + rand() * 2.6,
      appear: 0.9 + rand() * 0.55,
      slide: 2 + rand() * 9,
    }));
  });

  // bodi HP (tampak belakang)
  f.roundRect(104, 232, 152, 292, 22, rgb("#0d1219"), 1);
  f.roundRect(104, 232, 152, 292, 22, rgb("#222c3a"), 1);
  f.roundRect(109, 237, 142, 282, 18, rgb("#0b0f16"), 1);

  // modul kamera
  f.roundRect(120, 250, 42, 42, 10, rgb("#05080c"), 0.95);
  f.roundRect(126, 256, 12, 12, 6, rgb("#1b2a3a"), 1);
  f.roundRect(142, 256, 12, 12, 6, rgb("#1b2a3a"), 1);
  f.roundRect(126, 272, 12, 12, 6, rgb("#1b2a3a"), 1);

  // lempeng dingin di belakang HP
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
  f.glow(180, 372, 96, CYAN, 0.1 + pulse * 0.1);
  f.roundRect(126, 318, 108, 84, 12, rgb("#0b2733"), 1);
  f.roundRect(126, 318, 108, 84, 12, CYAN, 0.12 + pulse * 0.1);

  // garis retak embun tumbuh pelan
  if (p > 0.25) {
    f.glow(180, 360, 60, ICE, 0.05 * easeOut((p - 0.25) / 0.5));
  }

  for (const drop of drops) {
    const local = t - drop.appear;
    if (local < 0) continue;
    const grow = clamp01(local / 0.9);
    const y = drop.y + (local * drop.slide * 0.55) % 150;
    if (y > 500) continue;
    f.droplet(drop.x, y, drop.r * (0.5 + grow * 0.6), mix(CYAN, ICE, 0.55), 0.72 * grow);
    if (y + drop.r * 2 < 508) {
      f.blend(drop.x, y + drop.r * 1.9, mix(CYAN, ICE, 0.4), 0.35 * grow);
    }
  }

  // embun menetes dari tepi bawah lempeng
  const dripT = (t * 0.55) % 1.8;
  if (t > 2) {
    f.blend(170, 402 + dripT * 34, CYAN, 0.5 * (1 - dripT / 1.8));
    f.blend(196, 402 + ((t * 0.42) % 1.4) * 40, CYAN, 0.4 * (1 - ((t * 0.42) % 1.4) / 1.4));
  }

  // uap tipis naik
  for (let i = 0; i < 10; i += 1) {
    const ph = (t * 0.12 + i * 0.37) % 1;
    f.blend(60 + ((i * 53 + t * 7) % 240), 520 - ph * 130, rgb("#6b8496"), 0.1 * (1 - ph));
  }
}

function peltier(f: Frame, t: number): void {
  f.background(rgb("#05070c"), rgb("#0b1119"), { x: 180, y: 300, r: 300, color: rgb("#12283a"), strength: 0.4 });

  const hotY = 248;
  const coldY = 398;
  const left = 62;
  const width = 236;

  // pilar semikonduktor n/p
  for (let i = 0; i < 16; i += 1) {
    const x = left + 6 + i * ((width - 12) / 16);
    const grad = i / 15;
    const color = mix(rgb("#2b4a63"), rgb("#6b3a2a"), grad);
    f.rect(x, hotY + 12, 8, coldY - hotY - 12, color, 0.85);
  }

  // pelat keramik
  f.rect(left - 10, hotY, width + 20, 12, rgb("#2a1c18"), 1);
  f.rect(left, hotY, width, 12, mix(ORANGE, WARM, 0.3), 0.95);
  f.glow(180, hotY + 6, 150, ORANGE, 0.3);

  f.rect(left - 10, coldY, width + 20, 12, rgb("#0d2630"), 1);
  f.rect(left, coldY, width, 12, mix(CYAN, ICE, 0.25), 0.95);
  f.glow(180, coldY + 6, 150, CYAN, 0.28);

  // partikel panas naik dari sisi dingin ke sisi panas
  for (let i = 0; i < 22; i += 1) {
    const offset = i / 22;
    const travel = ((t * 0.42 + offset) % 1);
    const x = left + 10 + ((i * 37) % (width - 20));
    const y = coldY - travel * (coldY - hotY - 12);
    const color = mix(CYAN, ORANGE, travel);
    f.glow(x, y, 7, color, 0.55);
    f.blend(x, y, mix(color, [255, 255, 255], 0.5), 0.9);
  }

  // shimmer panas di atas sisi panas
  for (let i = 0; i < 4; i += 1) {
    const baseY = hotY - 6 - i * 16;
    for (let x = left; x < left + width; x += 2) {
      const y = baseY + Math.sin((x + t * 90) * 0.06 + i) * 3;
      f.blend(x, y, ORANGE, 0.09 - i * 0.015);
    }
  }

  // embun menempel di sisi dingin
  for (let i = 0; i < 12; i += 1) {
    const x = left + 12 + ((i * 61 + t * 3) % (width - 24));
    f.droplet(x, coldY + 18 + (i % 3) * 4, 1.4 + (i % 3) * 0.5, mix(CYAN, ICE, 0.6), 0.55);
  }
}

function vapor(f: Frame, t: number, d: number): void {
  f.background(rgb("#070a10"), rgb("#0d141d"), { x: 180, y: 300, r: 280, color: rgb("#16303a"), strength: 0.35 });

  const motes = cached<Mote[]>("vapor-motes", () => {
    const rand = rng(21);
    return Array.from({ length: 170 }, () => ({
      x: rand() * VW,
      y: 200 + rand() * 280,
      vx: (rand() - 0.5) * 10,
      vy: (rand() - 0.5) * 6,
      r: 0.7 + rand() * 1.5,
      ph: rand() * Math.PI * 2,
    }));
  });

  const plateY = 420;
  const plateX = 88;
  const plateW = 184;

  for (const m of motes) {
    const x = m.x + Math.sin(t * 0.4 + m.ph) * 14 + m.vx * (t % 6);
    const y = m.y + Math.cos(t * 0.32 + m.ph) * 10 + m.vy * (t % 5);
    const dx = Math.abs(x - (plateX + plateW / 2));
    const near = dx < plateW * 0.7 && y > plateY - 70 && y < plateY + 30;
    if (near) continue; // sudah jadi tetes di pelat
    const fade = 0.28 + 0.16 * Math.sin(t * 1.3 + m.ph);
    f.blend(x, y, rgb("#9db4c6"), fade);
    f.glow(x, y, 4.5, rgb("#5d7d93"), 0.16);
    // ekor gerak tipis
    f.blend(x - m.vx * 0.12, y - m.vy * 0.12, rgb("#7e93a8"), fade * 0.45);
  }

  // pelat dingin
  const pulse = 0.5 + 0.5 * Math.sin(t * 1.7);
  f.glow(180, plateY + 6, 130, CYAN, 0.12 + pulse * 0.08);
  for (let y = 0; y < 26; y += 1) {
    f.roundRect(plateX, plateY + y, plateW, 1, 0, mix(rgb("#1b4a5a"), rgb("#0a1c25"), y / 26), 1);
  }
  f.roundRect(plateX, plateY, plateW, 4, 2, ICE, 0.5);
  f.roundRect(plateX, plateY, plateW, 26, 8, CYAN, 0.12 + pulse * 0.07);

  // uap yang ketemu pelat berubah jadi tetes
  const count = Math.floor(clamp01((t - 1.2) / (d * 0.55)) * 16);
  for (let i = 0; i < count; i += 1) {
    const x = plateX + 12 + ((i * 71) % (plateW - 24)) + Math.sin(i * 2.3) * 5;
    const wob = Math.sin(t * 1.4 + i) * 1.6;
    f.droplet(x + wob, plateY - 2 - (i % 3) * 2, 1.7 + (i % 3) * 0.6, mix(CYAN, ICE, 0.5), 0.85);
  }

  // kabut tipis di atas pelat
  for (let i = 0; i < 3; i += 1) {
    const y = plateY - 12 - i * 10;
    for (let x = plateX; x < plateX + plateW; x += 3) {
      f.blend(x, y + Math.sin((x + t * 40 + i * 30) * 0.05) * 2, CYAN, 0.06 - i * 0.015);
    }
  }
}

function dewpoint(f: Frame, t: number, d: number): void {
  f.background(rgb("#05070c"), rgb("#0a1018"), { x: 180, y: 400, r: 260, color: rgb("#12333f"), strength: 0.3 });

  const tubeX0 = 100;
  const tubeX1 = 300;
  const tubeY = 366;
  const tubeH = 18;
  const dewK = 13 / 30; // 17°C pada skala 30°C → 0°C
  const dewX = tubeX0 + dewK * (tubeX1 - tubeX0);

  // suhu pelat turun dari 30°C ke 8°C
  const p = easeOut(t / Math.max(0.1, d * 0.95));
  const tempC = 30 - 21 * p;
  const kTemp = (30 - tempC) / 30;
  const markerX = tubeX0 + kTemp * (tubeX1 - tubeX0);

  // dudukan termometer
  f.roundRect(tubeX0 - 12, tubeY - 8, tubeX1 - tubeX0 + 24, tubeH + 16, 10, rgb("#0b1119"), 1);
  f.roundRect(tubeX0 - 12, tubeY - 8, tubeX1 - tubeX0 + 24, tubeH + 16, 10, rgb("#24313f"), 0.9);

  // skala warna: 30°C (hangat) → 0°C (beku)
  for (let x = tubeX0; x < tubeX1; x += 1) {
    const k = (x - tubeX0) / (tubeX1 - tubeX0);
    const color = k < dewK ? mix(ORANGE, rgb("#8fd6ea"), k / dewK) : mix(rgb("#8fd6ea"), ICE, (k - dewK) / (1 - dewK));
    f.rect(x, tubeY - 5, 1, 3, color, 0.75);
  }

  // cairan mengikuti suhu pelat
  for (let x = tubeX0; x < markerX; x += 1) {
    const k = (x - tubeX0) / (tubeX1 - tubeX0);
    f.rect(x, tubeY + 3, 1, tubeH - 6, mix(CYAN, ICE, k), 0.92);
  }

  // bohlam
  const bulbR = 17;
  for (let y = -bulbR; y <= bulbR; y += 1) {
    for (let x = -bulbR; x <= bulbR; x += 1) {
      const dist = Math.hypot(x, y);
      if (dist > bulbR) continue;
      const edge = 1 - Math.pow(dist / bulbR, 6);
      f.blend(tubeX0 + x, tubeY + tubeH / 2 + y, mix(CYAN, ICE, 0.3), 0.45 + edge * 0.45);
    }
  }
  f.glow(tubeX0, tubeY + tubeH / 2, bulbR * 1.9, CYAN, 0.3);

  // garis bantu skala
  for (let i = 0; i <= 4; i += 1) {
    const x = tubeX0 + (i / 4) * (tubeX1 - tubeX0);
    f.rect(x, tubeY - 22, 1.4, i % 2 === 0 ? 10 : 5, rgb("#7d93a6"), 0.45);
  }

  // garis titik embun (17°C) putus-putus
  const dewPulse = 0.6 + 0.4 * Math.sin(t * 2.4);
  for (let y = tubeY - 88; y < tubeY + tubeH + 26; y += 9) {
    f.rect(dewX - 1, y, 2.4, 5, CYAN, 0.55 * dewPulse);
  }
  f.glow(dewX, tubeY + tubeH / 2, 34, CYAN, 0.18 * dewPulse);

  // penanda suhu pelat
  f.roundRect(markerX - 1.8, tubeY - 74, 3.6, 58, 1.8, mix(CYAN, ICE, 0.35), 0.95);
  f.roundRect(markerX - 7, tubeY - 9, 14, tubeH + 18, 7, CYAN, 0.16);
  f.glow(markerX, tubeY - 46, 22, CYAN, 0.5);

  // tetes muncul setelah suhu pelat melewati titik embun
  if (markerX > dewX) {
    for (let i = 0; i < 18; i += 1) {
      const delay = 0.08 * i;
      const local = t - (dewK / 0.7333) * (d * 0.72) - delay;
      if (local < 0) continue;
      const phase = (t * 0.75 + i * 0.17) % 1;
      const x = dewX - 10 + ((i * 53 + i * i * 7) % 110);
      const y = tubeY + tubeH + 24 + phase * 86;
      f.droplet(x, y, 1.4 + (i % 3) * 0.5, mix(CYAN, ICE, 0.55), 0.75 * (1 - phase));
    }
  }

  // uap dingin di sekitar tabung
  for (let i = 0; i < 8; i += 1) {
    const ph = (t * 0.16 + i * 0.29) % 1;
    f.blend(dewX + 22 + Math.sin(t + i) * 16, tubeY + tubeH + 6 + ph * 60, CYAN, 0.1 * (1 - ph));
  }
}

function glass(f: Frame, t: number): void {
  f.background(rgb("#0a0705"), rgb("#160e08"), { x: 180, y: 300, r: 240, color: rgb("#3a2413"), strength: 0.4 });

  const gx = 118;
  const gy = 236;
  const gw = 124;
  const gh = 210;

  // cahaya dari atas
  f.glow(180, 200, 130, rgb("#ffcf99"), 0.12);

  // gelas
  f.roundRect(gx, gy, gw, gh, 10, rgb("#c9d8de"), 0.1);
  f.roundRect(gx + 3, gy + 3, gw - 6, gh - 6, 8, rgb("#f4fbfd"), 0.05);

  // isi teh
  const fillTop = gy + 34;
  for (let y = fillTop; y < gy + gh - 8; y += 1) {
    const k = (y - fillTop) / (gh - 34);
    f.rect(gx + 5, y, gw - 10, 1, mix(rgb("#c9791f"), rgb("#7a3f0f"), k), 0.72);
  }
  // permukaan
  f.rect(gx + 5, fillTop - 2, gw - 10, 3, rgb("#f0b562"), 0.5);

  // es batu (kotak miring)
  const cubes = [
    { x: 154, y: 280, s: 30, a: 0.2 },
    { x: 198, y: 306, s: 32, a: -0.26 },
    { x: 170, y: 346, s: 27, a: 0.34 },
  ];
  for (const c of cubes) {
    const cos = Math.cos(c.a);
    const sin = Math.sin(c.a);
    const half = c.s / 2;
    const reach = Math.ceil(half * 1.5);
    for (let yy = -reach; yy <= reach; yy += 1) {
      for (let xx = -reach; xx <= reach; xx += 1) {
        // inverse-rotation: petakan tiap piksel balik ke ruang kubus
        const dx = xx * cos + yy * sin;
        const dy = -xx * sin + yy * cos;
        if (Math.abs(dx) > half || Math.abs(dy) > half) continue;
        const edge = Math.max(Math.abs(dx), Math.abs(dy)) / half;
        f.blend(c.x + xx, c.y + yy, mix(rgb("#f7ffff"), rgb("#bfe9f5"), edge * 0.85), 0.62 * (1 - edge * 0.3));
      }
    }
    f.glow(c.x - c.s * 0.16, c.y - c.s * 0.2, 7, [255, 255, 255], 0.3);
  }

  // kilau kaca
  f.rect(gx + 12, gy + 16, 3, gh - 40, rgb("#ffffff"), 0.16);
  f.rect(gx + gw - 18, gy + 18, 2, gh - 46, rgb("#ffffff"), 0.08);

  // embun di dinding luar, tumbuh lalu menetes
  const drops = cached<Drop[]>("glass-drops", () => {
    const rand = rng(33);
    return Array.from({ length: 40 }, () => ({
      x: gx + 4 + rand() * (gw - 8),
      y: gy + 20 + rand() * (gh - 30),
      r: 0.9 + rand() * 1.9,
      appear: rand() * 2.4,
      slide: 3 + rand() * 12,
    }));
  });
  for (const drop of drops) {
    const local = t - drop.appear;
    if (local < 0) continue;
    const grow = clamp01(local / 1.6);
    const y = drop.y + (local * drop.slide * 0.4) % 90;
    if (y > gy + gh - 6) continue;
    f.droplet(drop.x, y, drop.r * (0.4 + grow * 0.6), mix(rgb("#f2feff"), CYAN, 0.3), 0.5 + grow * 0.25);
  }

  // meja
  f.rect(0, gy + gh + 4, VW, 2, rgb("#3a2413"), 0.6);
}

function ice(f: Frame, t: number, d: number): void {
  f.background(rgb("#04070d"), rgb("#081521"), { x: 180, y: 360, r: 290, color: rgb("#0d3a4a"), strength: 0.55 });

  const plateX = 58;
  const plateY = 392;
  const plateW = 244;
  const plateH = 54;

  f.glow(180, plateY + plateH / 2, 190, CYAN, 0.24);

  // pelat dingin
  for (let y = 0; y < plateH; y += 1) {
    f.roundRect(plateX, plateY + y, plateW, 1, 0, mix(rgb("#16383f"), rgb("#0a1a22"), y / plateH), 1);
  }
  f.roundRect(plateX, plateY, plateW, 4, 2, ICE, 0.3);

  const grow = easeOut(t / Math.max(0.1, d * 0.85));

  // kerak beku: tepi atas tidak rata, menutup permukaan pelat
  for (let x = plateX; x < plateX + plateW; x += 1) {
    const h = 3 + 2.4 * (0.5 + 0.5 * Math.sin(x * 0.63)) + 1.6 * (0.5 + 0.5 * Math.sin(x * 2.1 + 1.3));
    const edge = clamp01((grow * 1.3 - (x - plateX) / plateW * 0.3));
    if (edge <= 0) continue;
    for (let y = 0; y < h; y += 1) {
      f.blend(x, plateY - y, mix(ICE, [255, 255, 255], 0.3), (0.42 * (1 - y / h) + 0.08) * edge);
    }
  }
  f.glow(180, plateY - 3, 160, ICE, 0.12 * grow);

  // jarum-jarum es halus, tumbuh dari permukaan
  const needles = cached<{ x: number; a: number; len: number; t0: number }[]>("ice-needles", () => {
    const rand = rng(45);
    return Array.from({ length: 110 }, () => ({
      x: plateX + 4 + rand() * (plateW - 8),
      a: -Math.PI / 2 + (rand() - 0.5) * 1.7,
      len: 2 + rand() * 7,
      t0: rand() * 0.5,
    }));
  });
  for (const n of needles) {
    const local = clamp01((grow - n.t0) / (1 - n.t0));
    const len = n.len * local;
    if (len < 1.5) continue;
    const x1 = n.x + Math.cos(n.a) * len;
    const y1 = plateY + 1 + Math.sin(n.a) * len;
    f.line(n.x, plateY - 2, x1, y1, mix(ICE, [255, 255, 255], 0.4), 0.26 * local, 0.7);
  }

  // kilau kristal
  for (let i = 0; i < 10; i += 1) {
    const ph = (t * 1.5 + i * 0.53) % 1;
    const x = plateX + 8 + ((i * 71) % (plateW - 16));
    const y = plateY - 3 - ((i * 37) % 34);
    const a = Math.sin(ph * Math.PI) * 0.5 * grow;
    if (a <= 0) continue;
    f.blend(x, y, [255, 255, 255], a);
    f.blend(x - 1.6, y, [255, 255, 255], a * 0.45);
    f.blend(x + 1.6, y, [255, 255, 255], a * 0.45);
    f.blend(x, y - 1.6, [255, 255, 255], a * 0.45);
    f.blend(x, y + 1.6, [255, 255, 255], a * 0.45);
  }

  // garis 0°C
  for (let x = 26; x < 336; x += 15) {
    f.rect(x, 254, 8, 1.6, ICE, 0.16);
  }
  f.glow(180, 255, 130, ICE, 0.06);
}

function power(f: Frame, t: number): void {
  f.background(rgb("#06070b"), rgb("#0d1219"), { x: 180, y: 300, r: 300, color: rgb("#3a1d08"), strength: 0.42 });

  const hx = 104;
  const hw = 152;
  const hy = 300;
  const finH = 64;

  // sirip heatsink: satu blok, bukan sisir terpisah
  for (let i = 0; i < 9; i += 1) {
    const x = hx + i * (hw / 9);
    for (let y = 0; y < finH; y += 1) {
      const k = y / finH;
      f.roundRect(x + 1, hy + y, hw / 9 - 4, 1, 0, mix(rgb("#39434f"), rgb("#232b35"), k), 1);
    }
    f.roundRect(x + 3, hy + 2, 1, finH - 4, 0, rgb("#6b7787"), 0.5);
  }
  // alas heatsink
  f.roundRect(hx - 8, hy + finH, hw + 16, 10, 3, rgb("#3b4653"), 1);
  f.roundRect(hx - 8, hy + finH, hw + 16, 3, 1, rgb("#7c8797"), 0.5);

  // pelat panas + chip + pelat dingin
  f.roundRect(hx - 4, hy + finH + 12, hw + 8, 15, 3, mix(ORANGE, WARM, 0.25), 0.95);
  f.glow(180, hy + finH + 19, 150, ORANGE, 0.3);
  f.roundRect(hx + 12, hy + finH + 29, hw - 24, 20, 2, rgb("#1a222c"), 1);
  f.roundRect(hx - 4, hy + finH + 51, hw + 8, 13, 3, mix(CYAN, ICE, 0.2), 0.9);
  f.glow(180, hy + finH + 57, 110, CYAN, 0.16);

  // uap dingin menetes dari pelat dingin
  for (let i = 0; i < 6; i += 1) {
    const phase = (t * 0.6 + i * 0.21) % 1;
    f.droplet(hx + 30 + i * 18, hy + finH + 72 + phase * 26, 1.3, mix(CYAN, ICE, 0.4), 0.5 * (1 - phase));
  }

  // panas naik dari sirip
  for (let i = 0; i < 14; i += 1) {
    const phase = (t * 0.32 + i / 14) % 1;
    const x = hx + 8 + ((i * 43) % (hw - 16)) + Math.sin(t * 2 + i) * 7;
    const y = hy - 4 - phase * 74;
    f.glow(x, y, 12, ORANGE, 0.16 * (1 - phase));
    f.blend(x, y, WARM, 0.1 * (1 - phase));
  }

  // kabel listrik masuk dari kiri + pulsa arus
  const cableY = hy + finH + 58;
  f.line(16, cableY, hx - 26, cableY, rgb("#ffd166"), 0.22, 2.4);
  f.line(16, cableY, hx - 26, cableY, rgb("#ffd166"), 0.1, 5);
  for (let i = 0; i < 8; i += 1) {
    const phase = (t * 0.6 + i / 8) % 1;
    const x = 16 + phase * (hx - 42);
    f.glow(x, cableY, 11, rgb("#ffd166"), 0.45);
    f.blend(x, cableY, [255, 246, 214], 0.9);
  }

  // ikon petir
  const bolt = [
    [24, 366],
    [42, 366],
    [34, 384],
    [50, 384],
    [26, 412],
    [36, 388],
    [22, 388],
    [24, 366],
  ];
  for (let i = 1; i < bolt.length; i += 1) {
    f.line(bolt[i - 1][0], bolt[i - 1][1], bolt[i][0], bolt[i][1], rgb("#ffd166"), 0.85, 2.2);
  }
  f.glow(36, 388, 34, rgb("#ffd166"), 0.28);
}

function risk(f: Frame, t: number): void {
  const warn = 0.5 + 0.5 * Math.sin(t * 3.1);
  f.background(rgb("#080506"), rgb("#140a0a"), { x: 200, y: 340, r: 260, color: rgb("#3a1010"), strength: 0.35 });
  f.glow(250, 360, 120, ORANGE, 0.05 + warn * 0.05);

  const px = 96;
  const py = 244;
  const pw = 156;
  const ph = 300;

  // bodi HP
  f.roundRect(px, py, pw, ph, 20, rgb("#0f141b"), 1);
  f.roundRect(px, py, pw, ph, 20, rgb("#2b3542"), 1);
  f.roundRect(px + 5, py + 5, pw - 10, ph - 10, 16, rgb("#0b0f15"), 1);

  // modul kamera
  f.roundRect(px + 16, py + 16, 52, 52, 12, rgb("#05080c"), 1);
  f.glow(px + 42, py + 42, 12, rgb("#25415a"), 0.4);

  // ventilasi di sisi kanan
  for (let i = 0; i < 7; i += 1) {
    f.rect(px + pw - 18, py + 92 + i * 15, 12, 5, rgb("#334050"), 0.95);
  }

  // tetes air mengalir ke ventilasi lalu memicu peringatan
  for (let i = 0; i < 10; i += 1) {
    const phase = (t * 0.45 + i / 10) % 1;
    const startX = 300 - (i % 3) * 24;
    const x = startX - phase * 120;
    const y = 300 + Math.sin(i * 1.7) * 40 + phase * 26;
    if (x < px + pw - 4) {
      const hit = clamp01((px + pw - 4 - x) / 20);
      f.glow(px + pw - 4, y, 6 + hit * 10, ORANGE, 0.5 * hit * (0.6 + warn * 0.4));
    }
    f.droplet(x, y, 1.6 + (i % 3) * 0.5, mix(CYAN, ICE, 0.5), 0.7 * (1 - phase * 0.4));
  }

  // garis peringatan miring di area ventilasi
  for (let i = 0; i < 7; i += 1) {
    const x = px + pw - 46 + i * 6;
    f.line(x, py + 88, x + 16, py + 112, ORANGE, 0.16 * (0.5 + warn * 0.5), 1.2);
  }

  // cincin peringatan dari kamera
  const ring = (t % 2) / 2;
  for (let i = 0; i < 2; i += 1) {
    const r = 34 + ((ring + i * 0.5) % 1) * 46;
    const a = 0.22 * (1 - ((ring + i * 0.5) % 1));
    for (let ang = 0; ang < Math.PI * 2; ang += 0.05) {
      f.blend(px + 42 + Math.cos(ang) * r, py + 42 + Math.sin(ang) * r, ORANGE, a);
    }
  }
}

function tips(f: Frame, t: number): void {
  f.background(rgb("#05070c"), rgb("#0a1016"), { x: 180, y: 260, r: 300, color: rgb("#123240"), strength: 0.32 });

  // pita cahaya horizontal tipis sebagai pemisah baris
  for (const rowY of [230, 300, 390, 470]) {
    for (let x = 24; x < 336; x += 1) {
      f.blend(x, rowY, rgb("#22303c"), 0.35);
    }
  }

  const motes = cached<Mote[]>("tips-motes", () => {
    const rand = rng(57);
    return Array.from({ length: 40 }, () => ({
      x: rand() * VW,
      y: 180 + rand() * 380,
      vx: (rand() - 0.5) * 8,
      vy: -2 - rand() * 5,
      r: 0.6 + rand() * 1.2,
      ph: rand() * 6.28,
    }));
  });
  for (const m of motes) {
    const y = ((m.y + m.vy * t) % (VH - 100) + VH - 100) % (VH - 100);
    const x = m.x + Math.sin(t * 0.5 + m.ph) * 10 + m.vx * (t % 4);
    f.glow(x, y, 4, CYAN, 0.12);
  }

  // sorot di belakang daftar
  f.glow(180, 330, 150, rgb("#123441"), 0.25);
}

function outro(f: Frame, t: number): void {
  f.background(rgb("#04060b"), rgb("#081019"), { x: 180, y: 340, r: 300, color: rgb("#123a4a"), strength: 0.5 });

  // cincin mengembang
  for (let i = 0; i < 3; i += 1) {
    const phase = (t * 0.22 + i / 3) % 1;
    const r = 40 + phase * 220;
    const a = 0.14 * (1 - phase);
    const step = 1.2 / Math.max(20, r);
    for (let ang = 0; ang < Math.PI * 2; ang += step) {
      const px = 180 + Math.cos(ang) * r;
      const py = 350 + Math.sin(ang) * r * 0.92;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          f.blend(px + dx, py + dy, CYAN, dx === 0 && dy === 0 ? a : a * 0.45);
        }
      }
    }
  }

  // titik embun melayang
  const drops = cached<Drop[]>("outro-drops", () => {
    const rand = rng(71);
    return Array.from({ length: 22 }, () => ({
      x: 30 + rand() * 300,
      y: 200 + rand() * 320,
      r: 1 + rand() * 2,
      appear: rand() * 4,
      slide: 0,
    }));
  });
  for (const drop of drops) {
    const local = t - drop.appear;
    if (local < 0) continue;
    const bob = Math.sin(t * 0.8 + drop.x) * 4;
    f.droplet(drop.x, drop.y + bob, drop.r, mix(CYAN, ICE, 0.6), 0.35);
  }

  f.glow(180, 350, 120, CYAN, 0.14);
}

const VISUALS: Record<string, (f: Frame, t: number, d: number) => void> = {
  hook,
  peltier,
  vapor,
  dewpoint,
  glass,
  ice,
  power,
  risk,
  tips,
  outro,
};

export function drawScene(f: Frame, visual: string, t: number, duration: number): void {
  const fn = VISUALS[visual] ?? tips;
  fn(f, Math.max(0, t), Math.max(0.1, duration));
}
