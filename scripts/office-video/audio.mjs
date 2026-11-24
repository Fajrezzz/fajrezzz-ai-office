/**
 * AUDIO untuk video TikTok "Fajrezzz AI Office" — semuanya disintesis sendiri:
 * musik lo-fi/cyber 96 BPM, klik keyboard, whoosh transisi, dan blip reveal.
 * Tidak ada sampel/lagu pihak ketiga, jadi bebas klaim.
 *
 * Keluaran: docs/reports/office-tiktok/music-bed.wav dan sfx.wav (48 kHz stereo, 30 s)
 *
 * Pemakaian: node scripts/office-video/audio.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const outDir = path.join(root, "docs/reports/office-tiktok");
fs.mkdirSync(outDir, { recursive: true });

const SR = 48000;
const DUR = 30;
const N = SR * DUR;
const BPM = 96;
const BEAT = 60 / BPM;

const music = [new Float32Array(N), new Float32Array(N)];
const sfx = [new Float32Array(N), new Float32Array(N)];

/* --------------------------------- helpers -------------------------------- */

let seed = 20261124;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};

const add = (bus, i, v, pan = 0) => {
  if (i < 0 || i >= N) return;
  const l = Math.cos(((pan + 1) * Math.PI) / 4);
  const r = Math.sin(((pan + 1) * Math.PI) / 4);
  bus[0][i] += v * l;
  bus[1][i] += v * r;
};

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

/* ---------------------------------- music --------------------------------- */

// Am – F – C – G, satu akor 4 ketukan
const CHORDS = [
  { root: 45, notes: [57, 60, 64] }, // Am
  { root: 41, notes: [53, 57, 60] }, // F
  { root: 48, notes: [55, 60, 64] }, // C
  { root: 43, notes: [55, 59, 62] }, // G
];

const totalBeats = Math.floor(DUR / BEAT);

for (let beat = 0; beat < totalBeats; beat += 1) {
  const chord = CHORDS[Math.floor(beat / 4) % CHORDS.length];
  const t0 = beat * BEAT;

  // bass saw pendek
  const bassF = midi(chord.root - 12);
  for (let i = 0; i < Math.floor(SR * BEAT * 0.9); i += 1) {
    const t = i / SR;
    const env = Math.exp(-t * 6) * (1 - Math.exp(-t * 240));
    const p = (t * bassF) % 1;
    const saw = 2 * p - 1;
    add(music, Math.floor((t0 + t) * SR), saw * env * 0.16, 0);
  }

  // pad: tiga nada akor, attack lambat
  for (const note of chord.notes) {
    const f = midi(note);
    const dur = BEAT * 4;
    for (let i = 0; i < Math.floor(SR * dur); i += 1) {
      const t = i / SR;
      const env = Math.min(1, t / 0.5) * Math.exp(-t * 0.5) * 0.5;
      const v = Math.sin(2 * Math.PI * f * t) + 0.4 * Math.sin(2 * Math.PI * f * 1.006 * t + 1.2);
      add(music, Math.floor((t0 + t) * SR), v * env * 0.035, ((note % 5) - 2) * 0.2);
    }
  }

  // kick di ketukan 1 & 3
  if (beat % 4 === 0 || beat % 4 === 2) {
    for (let i = 0; i < Math.floor(SR * 0.22); i += 1) {
      const t = i / SR;
      const f = 58 - 22 * Math.min(1, t / 0.12);
      const env = Math.exp(-t * 22);
      add(music, Math.floor(t0 * SR) + i, Math.sin(2 * Math.PI * f * t) * env * 0.34, 0);
    }
  }

  // hi-hat di ketukan off
  for (const off of [BEAT * 0.5]) {
    for (let i = 0; i < Math.floor(SR * 0.05); i += 1) {
      const t = i / SR;
      const env = Math.exp(-t * 90);
      add(music, Math.floor((t0 + off) * SR) + i, (rnd() * 2 - 1) * env * 0.075, 0.35);
    }
  }

  // arpeggio 16th (rasa cyber)
  for (let step = 0; step < 4; step += 1) {
    const note = chord.notes[step % chord.notes.length] + 12;
    const f = midi(note);
    const start = t0 + (step * BEAT) / 4;
    for (let i = 0; i < Math.floor(SR * 0.12); i += 1) {
      const t = i / SR;
      const env = Math.exp(-t * 26) * (1 - Math.exp(-t * 400));
      add(music, Math.floor(start * SR) + i, Math.sin(2 * Math.PI * f * t) * env * 0.05, step % 2 ? 0.3 : -0.3);
    }
  }
}

/* ----------------------------------- SFX ---------------------------------- */

// klik keyboard: derau pendek, agak "plastik"
function keyClick(at, gain = 0.5, pan = 0) {
  const n = Math.floor(SR * 0.012);
  for (let i = 0; i < n; i += 1) {
    const t = i / SR;
    const env = Math.exp(-t * 320);
    const tone = Math.sin(2 * Math.PI * (1800 + rnd() * 900) * t) * 0.35;
    add(sfx, Math.floor(at * SR) + i, ((rnd() * 2 - 1) * 0.7 + tone) * env * gain, pan);
  }
}

// whoosh: derau dengan filter satu-pole yang membuka
function whoosh(at, dur = 0.42, gain = 0.42) {
  let lp = 0;
  const n = Math.floor(SR * dur);
  for (let i = 0; i < n; i += 1) {
    const t = i / SR;
    const k = t / dur;
    const a = 0.02 + 0.5 * Math.sin(Math.PI * Math.min(1, k)); // cutoff naik lalu turun
    lp = lp + a * ((rnd() * 2 - 1) - lp);
    const env = Math.sin(Math.PI * Math.min(1, k)) ** 1.6;
    add(sfx, Math.floor(at * SR) + i, lp * env * gain, Math.sin(k * Math.PI) * 0.5);
  }
}

// blip reveal
function blip(at, f = 880, gain = 0.22) {
  const n = Math.floor(SR * 0.18);
  for (let i = 0; i < n; i += 1) {
    const t = i / SR;
    const env = Math.exp(-t * 18);
    add(sfx, Math.floor(at * SR) + i, Math.sin(2 * Math.PI * f * t * (1 + 0.4 * t)) * env * gain, 0);
  }
}

// ketikan mengikuti timing teks di render.mjs
const typingWindows = [
  [0.12, 0.12 + 44 / 46], // hook
  [2.1, 2.1 + 36 / 48], // "> membuka ..."
  [3.55, 3.55 + 22 / 46], // "> mulai merekam web ..."
  [16.05, 16.05 + 20 / 50], // stack
];
for (const [from, to] of typingWindows) {
  for (let t = from; t < to; t += 1 / 46) {
    keyClick(t, 0.34 + rnd() * 0.18, (rnd() - 0.5) * 0.5);
  }
}

// transisi
for (const cut of [2, 6, 8, 10, 12, 14, 16, 21, 27]) whoosh(cut - 0.18, 0.4, 0.3);
blip(1.25, 760, 0.2);
blip(19.35, 520, 0.24);
blip(27.65, 920, 0.26);

/* --------------------------------- tulis WAV ------------------------------ */

function writeWav(file, channels) {
  const frames = channels[0].length;
  const buffer = Buffer.alloc(44 + frames * 4);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + frames * 4, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(2, 22);
  buffer.writeUInt32LE(SR, 24);
  buffer.writeUInt32LE(SR * 4, 28);
  buffer.writeUInt16LE(4, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(frames * 4, 40);

  let peak = 0;
  for (const ch of channels) for (const v of ch) peak = Math.max(peak, Math.abs(v));
  const norm = peak > 0 ? Math.min(1, 0.92 / peak) : 1;

  let o = 44;
  for (let i = 0; i < frames; i += 1) {
    for (let c = 0; c < 2; c += 1) {
      const v = Math.max(-1, Math.min(1, channels[c][i] * norm));
      buffer.writeInt16LE(Math.round(v * 32767), o);
      o += 2;
    }
  }
  fs.writeFileSync(file, buffer);
  return { peak, norm };
}

const m = writeWav(path.join(outDir, "music-bed.wav"), music);
const s = writeWav(path.join(outDir, "sfx.wav"), sfx);
console.log(`music-bed.wav + sfx.wav · ${DUR}s @ ${SR} Hz · peak music ${m.peak.toFixed(3)} → norm ${m.norm.toFixed(2)}, sfx ${s.peak.toFixed(3)}`);
