/**
 * NASKAH — "Kenapa gua harus capek buat AI agent di Fajrezzz AI Office"
 *
 * Bedanya dengan seri phone cooler: ini video *di balik layar* produk sendiri,
 * bukan sains. Semua yang disebut di sini benar-benar ada di repo ini:
 *  - tiga provider (Gemini/Groq/OpenRouter) + fallback  → `src/lib/ai/*`
 *  - penjaga /api/* (rate limit + blokir lintas-situs)  → `src/middleware.ts`
 *  - secret scan sebagai gerbang tes                    → `src/lib/security/secret-scan.ts`
 *  - verifikasi hasil render (ffprobe, report, tes)     → `scripts/phone-cooler/render.ts`
 *
 * Narasi: satu klip TTS per scene di `assets/voice/agent-office/`.
 * Durasi scene diambil dari durasi audio hasil ukur ffprobe, bukan tebakan.
 */

import type { SceneSpec } from "./scenes.ts";

export type AgentVisualId =
  | "agentgrid"
  | "chain"
  | "vault"
  | "meter"
  | "fallback"
  | "verify"
  | "outro";

export const SCENES: (Omit<SceneSpec, "visual"> & { visual: AgentVisualId })[] = [
  {
    id: "hook",
    visual: "agentgrid",
    kicker: "EP 01 · DI BALIK LAYAR",
    headline: [{ text: "CUMA" }, { text: "CHAT?", tone: "accent" }],
    headlineSize: 124,
    headlineY: 250,
    accent: "#35e0ff",
    supporting: "#ff5a1f",
    labels: [
      {
        text: "satu jawaban = sebelas langkah",
        x: 540,
        y: 1448,
        size: 38,
        color: "#8b98a8",
        align: "center",
        at: 0.7,
      },
    ],
    narration:
      "Orang lihatnya cuma satu kolom chat. Padahal di balik satu jawaban agent, ada kerjaan panjang yang nggak kelihatan sama sekali.",
    audio: "assets/voice/agent-office/01-hook.mp3",
  },
  {
    id: "chain",
    visual: "chain",
    kicker: "BAGIAN 02 · RANTAI KEPUTUSAN",
    headline: [{ text: "BUKAN" }, { text: "TOMBOL AJAIB", tone: "accent" }],
    headlineSize: 100,
    headlineY: 240,
    accent: "#35e0ff",
    supporting: "#ff5a1f",
    labels: [
      { text: "pilih model", x: 210, y: 962, size: 32, color: "#8b98a8", align: "center", at: 0.7 },
      { text: "susun konteks", x: 540, y: 780, size: 32, color: "#8b98a8", align: "center", at: 1.4 },
      { text: "cek hasil", x: 864, y: 962, size: 32, color: "#8b98a8", align: "center", at: 2.2 },
      { text: "ulang kalau ngawur", x: 540, y: 1246, size: 32, color: "#8b98a8", align: "center", at: 3.0 },
    ],
    narration:
      "AI agent bukan tombol ajaib. Dia rantai keputusan: pilih model, susun konteks, cek hasil, lalu ulang dari awal kalau jawabannya ngawur.",
    audio: "assets/voice/agent-office/02-chain.mp3",
  },
  {
    id: "keys",
    visual: "vault",
    kicker: "BAGIAN 03 · KUNCI",
    headline: [{ text: "TIGA KUNCI" }, { text: "SATU BOCOR", tone: "accent" }],
    headlineSize: 96,
    headlineY: 240,
    accent: "#35e0ff",
    supporting: "#ff5a1f",
    labels: [
      { text: "Gemini · Groq · OpenRouter", x: 540, y: 1420, size: 34, color: "#8b98a8", align: "center", at: 0.8 },
      { text: "bocor = tagihan + reputasi", x: 540, y: 1470, size: 34, color: "#ff8a4c", align: "center", at: 1.8 },
    ],
    narration:
      "Gua pegang tiga provider sekaligus: Gemini, Groq, dan OpenRouter. Tiga kunci API. Satu kunci bocor, tagihan dan reputasi jalan bareng.",
    audio: "assets/voice/agent-office/03-keys.mp3",
  },
  {
    id: "cost",
    visual: "meter",
    kicker: "BAGIAN 04 · BIAYA",
    headline: [{ text: "TIAP JAWABAN" }, { text: "ADA HARGA", tone: "accent" }],
    headlineSize: 92,
    headlineY: 240,
    accent: "#35e0ff",
    supporting: "#ff5a1f",
    labels: [
      { text: "20 request / menit untuk endpoint mahal", x: 540, y: 1408, size: 32, color: "#8b98a8", align: "center", at: 0.9 },
      { text: "tanpa pembatas: kuota habis semalam", x: 540, y: 1462, size: 32, color: "#ff8a4c", align: "center", at: 1.9 },
    ],
    narration:
      "Tiap jawaban itu ada harganya. Tanpa pembatas request, satu orang iseng bisa menghabiskan kuota gratis dalam semalam.",
    audio: "assets/voice/agent-office/04-cost.mp3",
  },
  {
    id: "fallback",
    visual: "fallback",
    kicker: "BAGIAN 05 · KALAU GAGAL",
    headline: [{ text: "YANG GAGAL" }, { text: "BUKAN MODELNYA", tone: "accent" }],
    headlineSize: 88,
    headlineY: 235,
    accent: "#35e0ff",
    supporting: "#ff5a1f",
    labels: [
      { text: "timeout · kuota habis · jawaban ngaco", x: 540, y: 1394, size: 32, color: "#8b98a8", align: "center", at: 0.9 },
      { text: "jalur cadangan", x: 876, y: 1290, size: 30, color: "#7bd88f", align: "center", at: 2.2 },
    ],
    narration:
      "Dan yang paling sering gagal itu bukan modelnya, tapi keadaannya: timeout, kuota habis, jawaban ngaco. Jadi harus selalu ada jalur cadangan.",
    audio: "assets/voice/agent-office/05-fallback.mp3",
  },
  {
    id: "verify",
    visual: "verify",
    kicker: "BAGIAN 06 · BUKTI",
    headline: [{ text: "NGGAK PERCAYA" }, { text: "KATA SELESAI", tone: "accent" }],
    headlineSize: 88,
    headlineY: 235,
    accent: "#35e0ff",
    supporting: "#ff5a1f",
    labels: [
      { text: "file · angka · tes", x: 540, y: 1400, size: 36, color: "#8b98a8", align: "center", at: 0.8 },
      { text: "bisa dibuka ulang kapan saja", x: 540, y: 1452, size: 32, color: "#7bd88f", align: "center", at: 2.0 },
    ],
    narration:
      "Makanya gua nggak percaya kalimat sudah jadi. Harus ada file, angka, dan tes yang bisa gua buka ulang kapan saja.",
    audio: "assets/voice/agent-office/06-verify.mp3",
  },
  {
    id: "why",
    visual: "agentgrid",
    kicker: "BAGIAN 07 · TANGGUNG JAWAB",
    headline: [{ text: "GUA YANG" }, { text: "NANGGUNG", tone: "accent" }],
    headlineSize: 112,
    headlineY: 250,
    accent: "#ff8a4c",
    supporting: "#ff5a1f",
    labels: [
      { text: "agent nggak bisa minta maaf", x: 540, y: 1448, size: 36, color: "#8b98a8", align: "center", at: 0.9 },
    ],
    narration:
      "Jadi kalau kelihatan capek, itu karena gua yang nanggung kalau hasilnya jelek. Agent nggak bisa dimarahin, dan nggak bisa minta maaf.",
    audio: "assets/voice/agent-office/07-why.mp3",
  },
  {
    id: "outro",
    visual: "outro",
    kicker: "FAJREZZZ AI OFFICE",
    headline: [{ text: "OTOMATIS," }, { text: "TAPI TERKENDALI", tone: "accent" }],
    headlineSize: 84,
    headlineY: 250,
    accent: "#35e0ff",
    supporting: "#ff5a1f",
    labels: [
      { text: "keputusan tetap di tangan manusia", x: 540, y: 1430, size: 36, color: "#8b8f9a", align: "center", at: 0.8 },
    ],
    narration:
      "Fajrezzz AI Office. Agent boleh otomatis, tapi keputusan tetap di tangan manusia. Itu harga dari hasil yang bisa dipercaya.",
    audio: "assets/voice/agent-office/08-outro.mp3",
  },
];
