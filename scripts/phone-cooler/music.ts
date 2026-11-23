/**
 * MUSIK LATAR TIKTOK — disintesis sendiri di Node, bukan sampel pihak ketiga.
 *
 * Alasan: sandbox hanya boleh npm/github/pypi, jadi tidak ada lagu berlisensi
 * yang bisa diunduh. Dengan sintesis sendiri, video bebas klaim hak cipta dan
 * hasilnya bisa direproduksi (seed + parameter tetap).
 *
 * Isi: progresi Am7 – Fmaj7 – Cmaj7 – G, tempo 84 BPM, pad lembut + bass +
 * kick + hi-hat + kilau arpeggio. Output WAV 48 kHz stereo 16-bit.
 */

import fs from "node:fs";
import path from "node:path";

const SAMPLE_RATE = 48000;
const BPM = 84;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const BARS = 16; // 4 putaran progresi
const DURATION = BAR * BARS;
const TOTAL_SAMPLES = Math.floor(DURATION * SAMPLE_RATE);

const left = new Float32Array(TOTAL_SAMPLES);
const right = new Float32Array(TOTAL_SAMPLES);

function pan(i: number, l: number, r: number): void {
  if (i < 0 || i >= TOTAL_SAMPLES) return;
  left[i] += l;
  right[i] += r;
}

function sine(freq: number, t: number): number {
  return Math.sin(2 * Math.PI * freq * t);
}

/** Nada pad: beberapa partial dengan serangan lambat. */
function addPad(startSec: number, durSec: number, freqs: number[], gain: number): void {
  const start = Math.floor(startSec * SAMPLE_RATE);
  const end = Math.min(TOTAL_SAMPLES, Math.floor((startSec + durSec) * SAMPLE_RATE));
  const attack = 0.35 * SAMPLE_RATE;
  for (let i = start; i < end; i += 1) {
    const local = i - start;
    const env = Math.min(1, local / attack) * Math.min(1, (end - i) / (0.7 * SAMPLE_RATE));
    let l = 0;
    let r = 0;
    for (const [k, f] of freqs.entries()) {
      const t = i / SAMPLE_RATE;
      const detune = 1 + (k % 2 === 0 ? 0.0015 : -0.0015);
      const v = sine(f * detune, t) * 0.6 + sine(f * 2, t) * 0.12;
      const p = k % 2 === 0 ? 0.75 : 0.25;
      l += v * p;
      r += v * (1 - p);
    }
    pan(i, l * gain * env, r * gain * env);
  }
}

/** Bass dengan decay cepat. */
function addBass(startSec: number, freq: number, durSec: number, gain: number): void {
  const start = Math.floor(startSec * SAMPLE_RATE);
  const end = Math.min(TOTAL_SAMPLES, Math.floor((startSec + durSec) * SAMPLE_RATE));
  for (let i = start; i < end; i += 1) {
    const t = (i - start) / SAMPLE_RATE;
    const env = Math.exp(-t * 3.4);
    const v = sine(freq, t) * 0.8 + sine(freq * 2, t) * 0.18;
    pan(i, v * env * gain, v * env * gain);
  }
}

/** Kick: sinus turun cepat + klik halus. */
function addKick(startSec: number, gain: number): void {
  const start = Math.floor(startSec * SAMPLE_RATE);
  const len = Math.floor(0.34 * SAMPLE_RATE);
  let phase = 0;
  for (let i = 0; i < len; i += 1) {
    const t = i / SAMPLE_RATE;
    const freq = 52 + 90 * Math.exp(-t * 28);
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    const env = Math.exp(-t * 9);
    const v = Math.sin(phase) * env;
    pan(start + i, v * gain, v * gain);
  }
}

/** Hi-hat: derau putih pendek, dibentuk filter satu kutub. */
function addHat(startSec: number, gain: number, seed: number): void {
  const start = Math.floor(startSec * SAMPLE_RATE);
  const len = Math.floor(0.07 * SAMPLE_RATE);
  let s = seed >>> 0;
  let hp = 0;
  let prev = 0;
  for (let i = 0; i < len; i += 1) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const noise = (s / 4294967296) * 2 - 1;
    hp = noise - prev + 0.86 * hp; // high-pass sederhana
    prev = noise;
    const env = Math.exp(-(i / SAMPLE_RATE) * 55);
    pan(start + i, hp * env * gain * 0.9, hp * env * gain * 0.6);
  }
}

const CHORDS = [
  { root: 110.0, tones: [220.0, 261.63, 329.63] }, // Am
  { root: 87.31, tones: [174.61, 220.0, 261.63] }, // F
  { root: 130.81, tones: [261.63, 329.63, 392.0] }, // C
  { root: 98.0, tones: [196.0, 246.94, 293.66] }, // G
];

for (let bar = 0; bar < BARS; bar += 1) {
  const chord = CHORDS[bar % CHORDS.length];
  const barStart = bar * BAR;

  addPad(barStart - 0.12, BAR * 1.28, chord.tones, 0.075);
  addBass(barStart, chord.root, BEAT * 1.6, 0.16);
  addBass(barStart + BEAT * 2, chord.root, BEAT * 1.4, 0.12);

  // ketukan: kick di 1 & 3, hat di setiap 1/2 ketukan
  for (let beat = 0; beat < 4; beat += 1) {
    const t = barStart + beat * BEAT;
    if (beat % 2 === 0) addKick(t, 0.34);
    addHat(t, 0.05, bar * 97 + beat * 13);
    addHat(t + BEAT / 2, 0.035, bar * 53 + beat * 7);
  }

  // kilau arpeggio tinggi, pelan
  const arp = [chord.tones[2] * 2, chord.tones[1] * 2, chord.tones[2] * 2.5, chord.tones[0] * 2];
  arp.forEach((freq, i) => {
    const startSec = barStart + i * BEAT;
    const len = Math.floor(0.5 * SAMPLE_RATE);
    const start = Math.floor(startSec * SAMPLE_RATE);
    for (let k = 0; k < len; k += 1) {
      const t = k / SAMPLE_RATE;
      const env = Math.exp(-t * 6) * 0.035;
      const v = sine(freq, t) * env;
      pan(start + k, v * 0.8, v * 0.5);
    }
  });
}

// kompresi lembut (tanh) supaya beda level antar bagian tidak mencolok, lalu fade + normalisasi
const fadeIn = Math.floor(1.2 * SAMPLE_RATE);
const fadeOut = Math.floor(2.4 * SAMPLE_RATE);
const DRIVE = 2.1;
let peak = 0;
for (let i = 0; i < TOTAL_SAMPLES; i += 1) {
  let g = 1;
  if (i < fadeIn) g *= i / fadeIn;
  if (i > TOTAL_SAMPLES - fadeOut) g *= (TOTAL_SAMPLES - i) / fadeOut;
  left[i] = Math.tanh(left[i] * DRIVE) * g;
  right[i] = Math.tanh(right[i] * DRIVE) * g;
  peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
}
const norm = peak > 0 ? 0.82 / peak : 1;

const buffer = Buffer.alloc(44 + TOTAL_SAMPLES * 4);
buffer.write("RIFF", 0, "ascii");
buffer.writeUInt32LE(36 + TOTAL_SAMPLES * 4, 4);
buffer.write("WAVE", 8, "ascii");
buffer.write("fmt ", 12, "ascii");
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20); // PCM
buffer.writeUInt16LE(2, 22); // stereo
buffer.writeUInt32LE(SAMPLE_RATE, 24);
buffer.writeUInt32LE(SAMPLE_RATE * 4, 28);
buffer.writeUInt16LE(4, 32);
buffer.writeUInt16LE(16, 34);
buffer.write("data", 36, "ascii");
buffer.writeUInt32LE(TOTAL_SAMPLES * 4, 40);

for (let i = 0; i < TOTAL_SAMPLES; i += 1) {
  const l = Math.max(-1, Math.min(1, left[i] * norm));
  const r = Math.max(-1, Math.min(1, right[i] * norm));
  buffer.writeInt16LE(Math.round(l * 32767), 44 + i * 4);
  buffer.writeInt16LE(Math.round(r * 32767), 46 + i * 4);
}

const out = path.join(process.cwd(), "assets/music/tiktok-bed.wav");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, buffer);
console.log(`${path.relative(process.cwd(), out)} · ${DURATION.toFixed(2)} s · ${BPM} BPM · ${BARS} bar`);
