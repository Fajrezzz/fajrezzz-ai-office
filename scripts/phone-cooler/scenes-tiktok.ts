/**
 * CUT TIKTOK — versi pendek (7 scene, ±50 detik) dari video panjang.
 *
 * Naskahnya ditulis ulang, bukan dipotong: tiap scene satu kalimat utuh,
 * jadi tidak ada potongan kalimat yang menggantung. Narasi tetap TTS yang
 * sama (satu suara), durasi scene diukur dari file audio.
 *
 * Tata letak disesuaikan untuk TikTok: teks tidak masuk area UI bawah
 * (progress bar dinaikkan, subtitle diberi jarak lebih besar dari tepi bawah).
 */

import type { SceneSpec } from "./scenes.ts";

export const SCENES: SceneSpec[] = [
  {
    id: "hook",
    visual: "hook",
    kicker: "TIKTOK · SAINS",
    headline: [{ text: "AIRNYA" }, { text: "DARI MANA?", tone: "accent" }],
    headlineSize: 128,
    headlineY: 300,
    accent: "#35e0ff",
    supporting: "#ff5a1f",
    labels: [
      {
        text: "cooler HP keluar air & es",
        x: 540,
        y: 660,
        size: 38,
        color: "#aab3c2",
        align: "center",
        at: 0.5,
      },
    ],
    narration:
      "Cooler HP keluar air, bahkan es. Padahal isinya cuma kipas dan lempeng logam. Airnya dari mana?",
    audio: "assets/voice/phone-cooler/tiktok-01.mp3",
  },
  {
    id: "peltier",
    visual: "peltier",
    kicker: "CARA KERJA",
    headline: [{ text: "BUKAN" }, { text: "KIPAS", tone: "accent" }],
    headlineSize: 116,
    headlineY: 250,
    accent: "#35e0ff",
    supporting: "#ff5a1f",
    labels: [
      { text: "SISI PANAS", x: 540, y: 700, size: 36, color: "#ff8a4c", align: "center", at: 0.8 },
      { text: "SISI DINGIN", x: 540, y: 1290, size: 36, color: "#7fe9ff", align: "center", at: 0.8 },
    ],
    narration:
      "Di dalamnya ada chip Peltier. Arus listrik memompa panas dari satu sisi ke sisi lain. Sisi yang nempel di HP jadi dingin, sisi belakangnya jadi panas.",
    audio: "assets/voice/phone-cooler/tiktok-02.mp3",
  },
  {
    id: "vapor",
    visual: "vapor",
    kicker: "SUMBER AIRNYA",
    headline: [{ text: "UDARA" }, { text: "PENUH UAP", tone: "accent" }],
    headlineSize: 112,
    headlineY: 250,
    accent: "#35e0ff",
    supporting: "#ff5a1f",
    labels: [
      {
        text: "uap menempel di pelat dingin",
        x: 540,
        y: 1330,
        size: 36,
        color: "#8a93a3",
        align: "center",
        at: 0.8,
      },
    ],
    narration:
      "Dan udara di sekitar kamu itu penuh uap air. Begitu ketemu permukaan yang lebih dingin dari titik embun, uap itu berubah jadi tetes air.",
    audio: "assets/voice/phone-cooler/tiktok-03.mp3",
  },
  {
    id: "dewpoint",
    visual: "dewpoint",
    kicker: "ANGKANYA",
    headline: [{ text: "TITIK EMBUN", tone: "accent" }, { text: "17°C, BUKAN 0°C", tone: "muted", scale: 0.6 }],
    headlineSize: 92,
    headlineY: 240,
    accent: "#35e0ff",
    supporting: "#ff5a1f",
    labels: [
      { text: "30°C", x: 300, y: 1210, size: 38, color: "#ff8a4c", at: 0.6 },
      { text: "17°C", x: 560, y: 1210, size: 38, color: "#35e0ff", align: "center", at: 1.0 },
      { text: "0°C", x: 900, y: 1210, size: 38, color: "#7fe9ff", align: "right", at: 1.4 },
      {
        text: "ruangan 25°C · kelembapan 60%",
        x: 540,
        y: 1310,
        size: 32,
        color: "#8a93a3",
        align: "center",
        at: 1.8,
      },
    ],
    narration:
      "Contoh: ruangan 25 derajat, kelembapan 60 persen, titik embunnya sekitar 17 derajat. Di bawah itu, air mulai menempel. Belum perlu nol derajat.",
    audio: "assets/voice/phone-cooler/tiktok-04.mp3",
  },
  {
    id: "ice",
    visual: "ice",
    kicker: "KAPAN JADI ES",
    headline: [{ text: "ES = DI" }, { text: "BAWAH NOL", tone: "accent" }],
    headlineSize: 116,
    headlineY: 250,
    accent: "#35e0ff",
    supporting: "#ff5a1f",
    labels: [
      {
        text: "di HP biasanya cuma belasan derajat",
        x: 540,
        y: 1330,
        size: 34,
        color: "#8a93a3",
        align: "center",
        at: 0.8,
      },
    ],
    narration: "Es baru terbentuk kalau permukaannya di bawah nol derajat.",
    audio: "assets/voice/phone-cooler/tiktok-05.mp3",
  },
  {
    id: "power",
    visual: "power",
    kicker: "SERING SALAH",
    headline: [{ text: "30 W ITU" }, { text: "DAYA MASUK", tone: "accent" }],
    headlineSize: 112,
    headlineY: 250,
    accent: "#35e0ff",
    supporting: "#ff5a1f",
    labels: [
      { text: "listrik, bukan pendinginan", x: 540, y: 690, size: 36, color: "#ff8a4c", align: "center", at: 0.7 },
      {
        text: "sisi belakang wajib heatsink + kipas",
        x: 540,
        y: 1330,
        size: 34,
        color: "#8a93a3",
        align: "center",
        at: 1.4,
      },
    ],
    narration: "Dan angka 30 watt itu daya listrik yang dimakan, bukan panas yang dibuang.",
    audio: "assets/voice/phone-cooler/tiktok-06.mp3",
  },
  {
    id: "outro",
    visual: "outro",
    kicker: "PENUTUP",
    headline: [
      { text: "AIRNYA DARI" },
      { text: "UDARA", tone: "accent" },
      { text: "kayak gelas es teh", tone: "muted", scale: 0.55 },
    ],
    headlineSize: 104,
    headlineY: 620,
    accent: "#35e0ff",
    supporting: "#ff5a1f",
    labels: [],
    narration: "Jadi airnya bukan dari cooler, tapi dari udara. Sama kayak gelas es teh yang berembun.",
    audio: "assets/voice/phone-cooler/tiktok-07.mp3",
  },
];
