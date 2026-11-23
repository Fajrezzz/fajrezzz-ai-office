/**
 * VIDEO CONTOH — "Kenapa cooler HP bisa mengeluarkan air atau es?"
 *
 * Naskah ditulis per scene; tiap scene punya SATU klip narasi sendiri
 * (`assets/voice/phone-cooler/*.mp3`). Durasi scene diambil dari durasi audio
 * hasil ukur ffprobe, jadi subtitle & visual mengikuti suara, bukan tebakan.
 *
 * Semua klaim dicek ke sumber yang dibuka saat sesi ini berjalan:
 *  - Titik embun 25 °C / 60% RH ≈ 17 °C (Magnus/Tetens; konsisten dengan
 *    perhitungan aplikasi pendingin termoelektrik).
 *  - Tetesan air pada cooler peltier = kondensasi; diakui resmi ASUS
 *    (FAQ AeroActive Cooler 6) sebagai fenomena fisika normal.
 *  - Angka watt pada kemasan = daya listrik yang dikonsumsi, bukan panas yang
 *    dipindahkan; sisi panas wajib dibuang lewat heatsink + kipas.
 *  - TEC1-12706: 12 V / 6 A / 60 W, Qcmax ±50 W, ΔTmax ±60-68 °C.
 */

export type VisualId =
  | "hook"
  | "peltier"
  | "vapor"
  | "dewpoint"
  | "glass"
  | "ice"
  | "power"
  | "risk"
  | "tips"
  | "outro";

export interface HeadlineLine {
  text: string;
  /** "accent" memakai warna aksen scene, "muted" untuk baris penjelas. */
  tone?: "fg" | "accent" | "muted";
  /** Pengali ukuran dasar headline (default 1). */
  scale?: number;
}

export interface SceneLabel {
  text: string;
  /** Koordinat dalam kanvas 1080x1920. */
  x: number;
  y: number;
  size: number;
  color?: string;
  /** Detik (relatif ke awal scene) kapan label muncul. */
  at?: number;
  align?: "left" | "center" | "right";
}

export interface SceneSpec {
  id: string;
  visual: VisualId;
  kicker: string;
  headline: HeadlineLine[];
  /** Ukuran dasar headline (px). */
  headlineSize: number;
  /** Posisi vertikal baris pertama headline (px). */
  headlineY: number;
  accent: string;
  supporting: string;
  labels: SceneLabel[];
  narration: string;
  audio: string;
}

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

/** Jeda setelah narasi selesai sebelum scene berikutnya (detik). */
export const SCENE_TAIL_SEC = 0.55;

export const SCENES: SceneSpec[] = [
  {
    id: "hook",
    visual: "hook",
    kicker: "EP 01 · SAINS",
    headline: [
      { text: "AIRNYA" },
      { text: "DARI MANA?", tone: "accent" },
    ],
    headlineSize: 128,
    headlineY: 300,
    accent: "#35e0ff",
    supporting: "#ff5a1f",
    labels: [
      {
        text: "kipas + lempeng logam, keluar air",
        x: 540,
        y: 640,
        size: 40,
        color: "#aab3c2",
        align: "center",
        at: 0.6,
      },
    ],
    narration:
      "Cooler HP itu cuma kipas plus lempeng logam. Tapi kadang keluar air, bahkan es. Airnya datang dari mana, coba?",
    audio: "assets/voice/phone-cooler/01-hook.mp3",
  },
  {
    id: "peltier",
    visual: "peltier",
    kicker: "BAGIAN 02 · CARA KERJA",
    headline: [
      { text: "BUKAN" },
      { text: "DARI KIPAS", tone: "accent" },
    ],
    headlineSize: 104,
    headlineY: 250,
    accent: "#35e0ff",
    supporting: "#ff5a1f",
    labels: [
      { text: "SISI PANAS", x: 540, y: 700, size: 38, color: "#ff8a4c", align: "center", at: 1.0 },
      { text: "SISI DINGIN", x: 540, y: 1286, size: 38, color: "#7fe9ff", align: "center", at: 1.0 },
      {
        text: "arus listrik memompa panas",
        x: 540,
        y: 1360,
        size: 34,
        color: "#8a93a3",
        align: "center",
        at: 2.0,
      },
    ],
    narration:
      "Jawabannya bukan di kipasnya. Di dalam ada chip Peltier: arus listrik lewat dua jenis semikonduktor, lalu panas dipompa dari satu sisi ke sisi lain. Sisi yang menempel di HP jadi dingin, sisi belakangnya justru makin panas.",
    audio: "assets/voice/phone-cooler/02-peltier.mp3",
  },
  {
    id: "vapor",
    visual: "vapor",
    kicker: "BAGIAN 03 · UDARA",
    headline: [
      { text: "UDARA" },
      { text: "PENUH UAP", tone: "accent" },
    ],
    headlineSize: 104,
    headlineY: 250,
    accent: "#35e0ff",
    supporting: "#ff5a1f",
    labels: [
      {
        text: "uap air tidak kelihatan, tapi selalu ada",
        x: 540,
        y: 780,
        size: 36,
        color: "#8a93a3",
        align: "center",
        at: 0.8,
      },
    ],
    narration:
      "Dan udara di sekitar kamu itu tidak kosong. Selalu ada uap air di dalamnya, walaupun tidak kelihatan. Uap ini berubah jadi titik air begitu ketemu permukaan yang cukup dingin.",
    audio: "assets/voice/phone-cooler/03-vapor.mp3",
  },
  {
    id: "dewpoint",
    visual: "dewpoint",
    kicker: "BAGIAN 04 · ANGKA",
    headline: [
      { text: "TITIK EMBUN", tone: "accent" },
      { text: "BUKAN 0°C", tone: "muted", scale: 0.62 },
    ],
    headlineSize: 96,
    headlineY: 240,
    accent: "#35e0ff",
    supporting: "#ff5a1f",
    labels: [
      { text: "30°C", x: 300, y: 1210, size: 38, color: "#ff8a4c", at: 0.6 },
      { text: "17°C · titik embun", x: 560, y: 1210, size: 38, color: "#35e0ff", align: "center", at: 1.2 },
      { text: "0°C", x: 900, y: 1210, size: 38, color: "#7fe9ff", align: "right", at: 1.8 },
      {
        text: "ruangan 25°C · kelembapan 60%",
        x: 540,
        y: 1310,
        size: 32,
        color: "#8a93a3",
        align: "center",
        at: 2.2,
      },
    ],
    narration:
      "Batas dinginnya namanya titik embun. Contoh gampangnya: ruangan 25 derajat dengan kelembapan 60 persen, titik embunnya sekitar 17 derajat. Begitu lempeng cooler turun di bawah 17, air mulai menempel. Belum perlu nol derajat.",
    audio: "assets/voice/phone-cooler/04-dewpoint.mp3",
  },
  {
    id: "glass",
    visual: "glass",
    kicker: "BAGIAN 05 · ANALOGI",
    headline: [
      { text: "SEPERTI" },
      { text: "GELAS ES TEH", tone: "accent" },
    ],
    headlineSize: 96,
    headlineY: 240,
    accent: "#35e0ff",
    supporting: "#ff5a1f",
    labels: [
      { text: "gelasnya tidak bocor", x: 540, y: 1420, size: 34, color: "#8a93a3", align: "center", at: 1.0 },
    ],
    narration:
      "Sama seperti gelas es teh yang berembun. Airnya bukan bocor dari dalam gelas, tapi dari udara yang menempel di permukaan dingin.",
    audio: "assets/voice/phone-cooler/05-glass.mp3",
  },
  {
    id: "ice",
    visual: "ice",
    kicker: "BAGIAN 06 · ES",
    headline: [
      { text: "KAPAN" },
      { text: "JADI ES?", tone: "accent" },
    ],
    headlineSize: 104,
    headlineY: 250,
    accent: "#35e0ff",
    supporting: "#ff5a1f",
    labels: [
      {
        text: "butuh permukaan di bawah 0°C",
        x: 540,
        y: 1380,
        size: 36,
        color: "#8a93a3",
        align: "center",
        at: 1.2,
      },
    ],
    narration:
      "Kalau permukaannya bisa tembus di bawah nol derajat, titik air itu membeku jadi bunga es. Tapi di HP, lempeng biasanya cuma sampai belasan derajat. Jadi yang kamu lihat kebanyakan air, bukan es.",
    audio: "assets/voice/phone-cooler/06-ice.mp3",
  },
  {
    id: "power",
    visual: "power",
    kicker: "BAGIAN 07 · DAYA",
    headline: [
      { text: "30 W ITU" },
      { text: "DAYA MASUK", tone: "accent" },
    ],
    headlineSize: 96,
    headlineY: 240,
    accent: "#35e0ff",
    supporting: "#ff5a1f",
    labels: [
      { text: "listrik yang dimakan", x: 540, y: 690, size: 36, color: "#ff8a4c", align: "center", at: 0.8 },
      {
        text: "bukan panas yang dibuang",
        x: 540,
        y: 1350,
        size: 36,
        color: "#8a93a3",
        align: "center",
        at: 1.4,
      },
    ],
    narration:
      "Satu lagi yang sering salah dibaca. Angka 30 watt di kemasan itu listrik yang dia makan, bukan panas yang dibuang. Chip Peltier malah menambah panas, makanya sisi belakang wajib punya heatsink dan kipas.",
    audio: "assets/voice/phone-cooler/07-power.mp3",
  },
  {
    id: "risk",
    visual: "risk",
    kicker: "BAGIAN 08 · RISIKO",
    headline: [
      { text: "RISIKONYA" },
      { text: "NYATA", tone: "accent" },
    ],
    headlineSize: 104,
    headlineY: 250,
    accent: "#35e0ff",
    supporting: "#ff5a1f",
    labels: [
      {
        text: "air bisa masuk ke celah bodi & kamera",
        x: 540,
        y: 1380,
        size: 34,
        color: "#8a93a3",
        align: "center",
        at: 1.0,
      },
    ],
    narration:
      "Efek sampingnya nyata: air bisa merembes ke celah bodi dan area kamera. Pabrikan sendiri mengakui tetesan itu normal, tapi tetap harus kamu lap.",
    audio: "assets/voice/phone-cooler/08-risk.mp3",
  },
  {
    id: "tips",
    visual: "tips",
    kicker: "BAGIAN 09 · CARA PAKAI",
    headline: [
      { text: "PAKAI" },
      { text: "DENGAN AMAN", tone: "accent" },
    ],
    headlineSize: 96,
    headlineY: 240,
    accent: "#35e0ff",
    supporting: "#ff5a1f",
    labels: [
      { text: "01", x: 120, y: 760, size: 40, color: "#35e0ff", at: 0.3 },
      { text: "pakai saat HP benar-benar panas", x: 210, y: 760, size: 40, color: "#eef3ff", at: 0.3 },
      { text: "02", x: 120, y: 900, size: 40, color: "#35e0ff", at: 1.2 },
      { text: "jangan ditinggal semalaman", x: 210, y: 900, size: 40, color: "#eef3ff", at: 1.2 },
      { text: "03", x: 120, y: 1040, size: 40, color: "#35e0ff", at: 2.1 },
      { text: "lap bagian basah sebelum disimpan", x: 210, y: 1040, size: 40, color: "#eef3ff", at: 2.1 },
    ],
    narration:
      "Cara amannya: pakai saat HP benar-benar panas, jangan ditinggal semalaman, dan lap bagian yang basah sebelum disimpan.",
    audio: "assets/voice/phone-cooler/09-tips.mp3",
  },
  {
    id: "outro",
    visual: "outro",
    kicker: "PENUTUP",
    headline: [
      { text: "AIRNYA DARI" },
      { text: "UDARA", tone: "accent" },
      { text: "bukan dari cooler-nya", tone: "muted", scale: 0.55 },
    ],
    headlineSize: 104,
    headlineY: 620,
    accent: "#35e0ff",
    supporting: "#ff5a1f",
    labels: [
      {
        text: "sumber: Magnus/Tetens · FAQ ASUS AeroActive Cooler 6 · datasheet TEC1-12706",
        x: 540,
        y: 1690,
        size: 25,
        color: "#a8b2c0",
        align: "center",
        at: 1.0,
      },
    ],
    narration:
      "Jadi bukan cooler-nya yang mengeluarkan air. Air itu sudah ada di udara, cuma menempel di tempat yang lebih dingin.",
    audio: "assets/voice/phone-cooler/10-outro.mp3",
  },
];
