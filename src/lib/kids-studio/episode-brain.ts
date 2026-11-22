export type KidsThemeId =
  | "rescue_trucks"
  | "dino_colors"
  | "rainbow_train"
  | "space_rocket"
  | "excavator_park"
  | "animal_friends";

export type VideoFormat = "shorts" | "landscape";

export interface CartoonScene {
  sceneNumber: number;
  label: string;
  durationSec: number;
  narration: string;
  subtitle: string;
  mood: "bright" | "exciting" | "rainbow" | "space" | "celebrate";
  action: "intro_hook" | "move_in" | "problem" | "solve" | "celebrate";
}

export interface KidsEpisode {
  id: string;
  episodeNumber: number;
  createdAt: string;
  themeId: KidsThemeId;
  themeLabel: string;
  title: string;
  thumbnailHeadline: string;
  hook3s: string;
  description: string;
  tags: string;
  accentColor: string;
  uploaded: boolean;
  createdByAuto: boolean;
  scenes: CartoonScene[];
}

interface ThemeBlueprint {
  themeId: KidsThemeId;
  themeLabel: string;
  accentColor: string;
  variations: {
    title: string;
    thumbnailHeadline: string;
    hook3s: string;
    scenes: CartoonScene[];
    tags: string;
  }[];
}

const THEME_BLUEPRINTS: ThemeBlueprint[] = [
  {
    themeId: "rescue_trucks",
    themeLabel: "Mobil Penolong & Pemadam",
    accentColor: "#ef4444",
    variations: [
      {
        title:
          "WAH! Mobil Pemadam & Polisi Menolong Kucing di Pohon Tinggi! | Kartun Anak Indonesia",
        thumbnailHeadline: "TOLONG! KUCING DI POHON!",
        hook3s:
          "LIHAT! Ada anak kucing lucu terjebak di pohon tinggi! Siapa yang datang menolong?!",
        tags: "#kartunanak #mobilpemadam #mobilpolisi #animasianak #laguanak #youtubeshorts #edukasianak",
        scenes: [
          {
            sceneNumber: 1,
            label: "Hook 3 Detik",
            durationSec: 4,
            narration:
              "Wah! Lihat ke atas pohon! Ada kucing kecil terjebak! Siapa yang bisa menolong ya?",
            subtitle: "WAH! Kucing kecil terjebak di pohon!",
            mood: "exciting",
            action: "intro_hook",
          },
          {
            sceneNumber: 2,
            label: "Pemadam Datang",
            durationSec: 4.5,
            narration:
              "Nino nino! Mobil Pemadam Merah dan Mobil Polisi Biru langsung meluncur cepat!",
            subtitle: "Nino nino! Mobil Pemadam meluncur!",
            mood: "bright",
            action: "move_in",
          },
          {
            sceneNumber: 3,
            label: "Tangga Naik",
            durationSec: 4.5,
            narration:
              "Ayo hitung bersama teman-teman! Satu, dua, tiga! Tangga pemadam naik tinggi!",
            subtitle: "Hitung bersama: 1... 2... 3... NAIK!",
            mood: "exciting",
            action: "problem",
          },
          {
            sceneNumber: 4,
            label: "Berhasil Diselamatkan",
            durationSec: 4.5,
            narration:
              "Horeee! Kucing kecil berhasil turun dengan selamat! Terima kasih Mobil Pemadam!",
            subtitle: "HORE! Kucing kecil selamat!",
            mood: "rainbow",
            action: "solve",
          },
          {
            sceneNumber: 5,
            label: "Pesan Baik & Subscribe",
            durationSec: 4.5,
            narration:
              "Hebat sekali saling menolong! Jangan lupa klik Like dan Subscribe untuk petualangan berikutnya!",
            subtitle: "Yuk LIKE & SUBSCRIBE teman-teman!",
            mood: "celebrate",
            action: "celebrate",
          },
        ],
      },
      {
        title:
          "NINO NINO! Mobil Pemadam Merah Padamkan Api & Belajar Warna | Animasi Anak Lucu",
        thumbnailHeadline: "NINO NINO! MOBIL MERAH!",
        hook3s:
          "DENGAR SUARA SIRINE ITU! Mobil warna apa yang punya tangga panjang?!",
        tags: "#mobilpemadam #kartunanakindonesia #belajarwarna #animasianak #fypanak #shortsanak",
        scenes: [
          {
            sceneNumber: 1,
            label: "Hook 3 Detik",
            durationSec: 4,
            narration:
              "Tebak teman-teman! Mobil warna merah apa yang berbunyi nino nino?",
            subtitle: "TEBAK! Mobil merah berbunyi NINO NINO!",
            mood: "exciting",
            action: "intro_hook",
          },
          {
            sceneNumber: 2,
            label: "Kenalan Warna",
            durationSec: 4.5,
            narration:
              "Benar! Itu Mobil Pemadam Merah! Dan temannya adalah Mobil Polisi berwarna Biru!",
            subtitle: "Pemadam MERAH & Polisi BIRU!",
            mood: "bright",
            action: "move_in",
          },
          {
            sceneNumber: 3,
            label: "Misi Bantuan",
            durationSec: 4.5,
            narration:
              "Mereka bekerja sama membersihkan jalan taman agar anak-anak bisa bermain aman!",
            subtitle: "Bekerja sama membersihkan taman!",
            mood: "exciting",
            action: "problem",
          },
          {
            sceneNumber: 4,
            label: "Taman Bersih Berkilau",
            durationSec: 4.5,
            narration:
              "Waaah! Tamannya jadi bersih dan muncul pelangi warna-warni yang indah!",
            subtitle: "WAH! Pelangi indah muncul!",
            mood: "rainbow",
            action: "solve",
          },
          {
            sceneNumber: 5,
            label: "Penutup Ceria",
            durationSec: 4.5,
            narration:
              "Kamu pintar sekali! Klik Subscribe ya supaya ketemu Mobil Pemadam besok lagi!",
            subtitle: "Hebat! Klik SUBSCRIBE ya!",
            mood: "celebrate",
            action: "celebrate",
          },
        ],
      },
    ],
  },
  {
    themeId: "dino_colors",
    themeLabel: "Dinosaurus Belajar Warna & Angka",
    accentColor: "#22c55e",
    variations: [
      {
        title:
          "TELUR DINOSAURUS PELANGI MENETAS! Belajar Warna & Berhitung 1-5 | Kartun Anak",
        thumbnailHeadline: "TELUR DINO MENETAS!",
        hook3s:
          "KREK! KREK! Telur warna-warni ini bergoyang! Apa ya isi di dalamnya?!",
        tags: "#dinosaurus #belajarwarna #berhitung #kartunanak #animasianakindonesia #youtubeshorts",
        scenes: [
          {
            sceneNumber: 1,
            label: "Hook 3 Detik",
            durationSec: 4,
            narration:
              "Krek krek! Lihat ada telur pelangi bergoyang! Siapa yang akan keluar ya?",
            subtitle: "KREK! Telur pelangi bergoyang!",
            mood: "exciting",
            action: "intro_hook",
          },
          {
            sceneNumber: 2,
            label: "Dino Hijau Muncul",
            durationSec: 4.5,
            narration:
              "Tadaaa! Halo, aku Dino Hijau yang ceria! Ayo kita belajar warna bersama!",
            subtitle: "Halo! Aku DINO HIJAU yang ceria!",
            mood: "bright",
            action: "move_in",
          },
          {
            sceneNumber: 3,
            label: "Belajar Warna Pelangi",
            durationSec: 4.5,
            narration:
              "Ada bola Merah, Kuning, Biru, dan Hijau! Warna favorit kamu yang mana?",
            subtitle: "MERAH, KUNING, BIRU, HIJAU!",
            mood: "rainbow",
            action: "problem",
          },
          {
            sceneNumber: 4,
            label: "Berhitung 1 sampai 5",
            durationSec: 4.5,
            narration:
              "Sekarang kita lompat sambil berhitung! Satu, dua, tiga, empat, lima! Yey!",
            subtitle: "Lompat berhitung: 1, 2, 3, 4, 5!",
            mood: "rainbow",
            action: "solve",
          },
          {
            sceneNumber: 5,
            label: "Penutup Ceria",
            durationSec: 4.5,
            narration:
              "Wah kamu anak pintar! Tekan tombol Like dan Subscribe untuk main sama Dino lagi!",
            subtitle: "Pintar! Yuk LIKE & SUBSCRIBE!",
            mood: "celebrate",
            action: "celebrate",
          },
        ],
      },
    ],
  },
  {
    themeId: "rainbow_train",
    themeLabel: "Kereta Pelangi & Buah Ceria",
    accentColor: "#f59e0b",
    variations: [
      {
        title:
          "TUT TUT GUJES! Kereta Pelangi Membawa Buah Segar Warna-Warni | Kartun Anak",
        thumbnailHeadline: "TUT TUT! KERETA PELANGI!",
        hook3s:
          "TUT TUT! Kereta Pelangi datang membawa kejutan buah manis! Buah apa saja ya?!",
        tags: "#keretaapi #keretapelangi #belajarbuah #kartunanak #animasianak #edukasianak #shorts",
        scenes: [
          {
            sceneNumber: 1,
            label: "Hook 3 Detik",
            durationSec: 4,
            narration:
              "Tut tut gujes gujes! Kereta Pelangi datang membawa kejutan enak! Ayo kita lihat!",
            subtitle: "TUT TUT! Kereta Pelangi datang!",
            mood: "exciting",
            action: "intro_hook",
          },
          {
            sceneNumber: 2,
            label: "Gerbong Apel & Pisang",
            durationSec: 4.5,
            narration:
              "Gerbong pertama membawa Apel Merah manis! Gerbong kedua membawa Pisang Kuning!",
            subtitle: "Apel MERAH & Pisang KUNING!",
            mood: "bright",
            action: "move_in",
          },
          {
            sceneNumber: 3,
            label: "Gerbong Jeruk & Anggur",
            durationSec: 4.5,
            narration:
              "Gerbong ketiga ada Jeruk Oranye segar dan Anggur Ungu yang kaya vitamin!",
            subtitle: "Jeruk ORANYE & Anggur UNGU!",
            mood: "rainbow",
            action: "problem",
          },
          {
            sceneNumber: 4,
            label: "Pesta Buah Sehat",
            durationSec: 4.5,
            narration:
              "Makan buah setiap hari bikin badan kuat, sehat, dan selalu ceria!",
            subtitle: "Makan buah bikin kuat & sehat!",
            mood: "rainbow",
            action: "solve",
          },
          {
            sceneNumber: 5,
            label: "Penutup Ceria",
            durationSec: 4.5,
            narration:
              "Tut tut! Sampai jumpa di stasiun berikutnya! Jangan lupa Like dan Subscribe ya!",
            subtitle: "TUT TUT! Klik SUBSCRIBE ya!",
            mood: "celebrate",
            action: "celebrate",
          },
        ],
      },
    ],
  },
  {
    themeId: "space_rocket",
    themeLabel: "Roket & Petualangan Luar Angkasa",
    accentColor: "#6366f1",
    variations: [
      {
        title:
          "3... 2... 1... MELUNCUR! Roket Kecil Terbang ke Bulan & Planet | Animasi Anak",
        thumbnailHeadline: "3..2..1.. ROKET TERBANG!",
        hook3s:
          "SIAP MELUNCUR?! Hitung mundur 3... 2... 1... WUUUSH! Kita terbang ke luar angkasa!",
        tags: "#roket #luarangkasa #planet #kartunanak #animasianakindonesia #edukasianak #shorts",
        scenes: [
          {
            sceneNumber: 1,
            label: "Hook 3 Detik",
            durationSec: 4,
            narration:
              "Teman-teman siap?! Hitung mundur bersama! Tiga... dua... satu... MELUNCUR!",
            subtitle: "3... 2... 1... WUUUSH MELUNCUR!",
            mood: "space",
            action: "intro_hook",
          },
          {
            sceneNumber: 2,
            label: "Menyapa Bulan",
            durationSec: 4.5,
            narration:
              "Waaah tinggi sekali! Halo Bulan Kuning yang tersenyum dan bintang berkelap-kelip!",
            subtitle: "Halo BULAN & BINTANG berkilau!",
            mood: "space",
            action: "move_in",
          },
          {
            sceneNumber: 3,
            label: "Planet Bercincin",
            durationSec: 4.5,
            narration:
              "Lihat di sana ada Planet Saturnus yang punya cincin indah berputar-putar!",
            subtitle: "Planet SATURNUS punya cincin!",
            mood: "space",
            action: "problem",
          },
          {
            sceneNumber: 4,
            label: "Menghitung Bintang",
            durationSec: 4.5,
            narration:
              "Ayo tangkap bintang berkilau! Satu, dua, tiga, empat, lima bintang jatuh!",
            subtitle: "Tangkap bintang: 1, 2, 3, 4, 5!",
            mood: "space",
            action: "solve",
          },
          {
            sceneNumber: 5,
            label: "Penutup Ceria",
            durationSec: 4.5,
            narration:
              "Seru sekali jalan-jalan ke luar angkasa! Klik Subscribe untuk misi roket selanjutnya!",
            subtitle: "Seru! Klik LIKE & SUBSCRIBE!",
            mood: "space",
            action: "celebrate",
          },
        ],
      },
    ],
  },
  {
    themeId: "excavator_park",
    themeLabel: "Truk Excavator & Taman Bermain",
    accentColor: "#eab308",
    variations: [
      {
        title:
          "HEBAT! Truk Excavator Kuning Membangun Taman Bermain Pelangi | Kartun Truk Anak",
        thumbnailHeadline: "TRUK EXCAVATOR BERAKSI!",
        hook3s:
          "BRUUUM! Truk Excavator Kuning datang membawa balok raksasa! Mau bikin apa ya?!",
        tags: "#excavator #trukkonstruksi #kartuntruk #kartunanak #animasianak #youtubeshorts",
        scenes: [
          {
            sceneNumber: 1,
            label: "Hook 3 Detik",
            durationSec: 4,
            narration:
              "Bruuum bruuum! Lihat Truk Excavator Kuning besar ini! Dia mau membangun apa ya?",
            subtitle: "BRUUUM! Excavator mau bikin apa?",
            mood: "exciting",
            action: "intro_hook",
          },
          {
            sceneNumber: 2,
            label: "Gali & Angkat Balok",
            durationSec: 4.5,
            narration:
              "Cangkul naik, cangkul turun! Excavator mengangkat balok warna merah, biru, dan hijau!",
            subtitle: "Angkat balok MERAH, BIRU, HIJAU!",
            mood: "bright",
            action: "move_in",
          },
          {
            sceneNumber: 3,
            label: "Susun Menara",
            durationSec: 4.5,
            narration:
              "Pelan-pelan kita susun tinggi! Satu, dua, tiga! Jangan sampai jatuh ya!",
            subtitle: "Susun tinggi: 1... 2... 3!",
            mood: "exciting",
            action: "problem",
          },
          {
            sceneNumber: 4,
            label: "Taman Bermain Jadi",
            durationSec: 4.5,
            narration:
              "Tadaaa! Taman bermain warna-warni sudah selesai! Semua anak senang sekali!",
            subtitle: "TADAA! Taman bermain jadi!",
            mood: "rainbow",
            action: "solve",
          },
          {
            sceneNumber: 5,
            label: "Penutup Ceria",
            durationSec: 4.5,
            narration:
              "Terima kasih Truk Excavator! Ayo klik Like dan Subscribe untuk lihat truk keren lainnya!",
            subtitle: "Keren! Klik LIKE & SUBSCRIBE!",
            mood: "celebrate",
            action: "celebrate",
          },
        ],
      },
    ],
  },
  {
    themeId: "animal_friends",
    themeLabel: "Kelinci & Beruang Sahabat Pelangi",
    accentColor: "#ec4899",
    variations: [
      {
        title:
          "LUCU BANGET! Kelinci & Beruang Berbagi Buah di Jembatan Pelangi | Dongeng Anak",
        thumbnailHeadline: "KELINCI & BERUANG BERBAGI!",
        hook3s:
          "OH TIDAK! Keranjang buah Kelinci jatuh! Lihat apa yang dilakukan sahabatnya Beruang!",
        tags: "#dongenganak #kelinci #beruang #kartunanak #ceritaanak #edukasianak #shortsanak",
        scenes: [
          {
            sceneNumber: 1,
            label: "Hook 3 Detik",
            durationSec: 4,
            narration:
              "Oh tidak! Keranjang apel Kelinci terguling! Siapa yang akan membantu Kelinci?",
            subtitle: "OH TIDAK! Apel Kelinci terguling!",
            mood: "exciting",
            action: "intro_hook",
          },
          {
            sceneNumber: 2,
            label: "Beruang Membantu",
            durationSec: 4.5,
            narration:
              "Beruang Cokelat datang berlari! Tenang Kelinci, ayo kita kumpulkan bersama-sama!",
            subtitle: "Beruang datang membantu Kelinci!",
            mood: "bright",
            action: "move_in",
          },
          {
            sceneNumber: 3,
            label: "Mengumpulkan Buah",
            durationSec: 4.5,
            narration:
              "Satu apel, dua apel, tiga apel! Wah, kalau dikerjakan bersama jadi cepat sekali!",
            subtitle: "Kumpulkan bersama: 1, 2, 3 apel!",
            mood: "rainbow",
            action: "problem",
          },
          {
            sceneNumber: 4,
            label: "Berbagi Itu Indah",
            durationSec: 4.5,
            narration:
              "Kelinci berbagi apel manis untuk Beruang! Saling berbagi membuat hati gembira!",
            subtitle: "Saling berbagi itu indah sekali!",
            mood: "rainbow",
            action: "solve",
          },
          {
            sceneNumber: 5,
            label: "Penutup Ceria",
            durationSec: 4.5,
            narration:
              "Jadilah anak baik yang suka berbagi ya! Klik Subscribe untuk dongeng lucu berikutnya!",
            subtitle: "Anak baik! Klik SUBSCRIBE ya!",
            mood: "celebrate",
            action: "celebrate",
          },
        ],
      },
    ],
  },
];

export function generateAutonomousKidsEpisode(
  episodeNumber: number,
  preferredTheme?: KidsThemeId,
  createdByAuto = false
): KidsEpisode {
  const blueprint = preferredTheme
    ? THEME_BLUEPRINTS.find((b) => b.themeId === preferredTheme) ??
      THEME_BLUEPRINTS[episodeNumber % THEME_BLUEPRINTS.length]
    : THEME_BLUEPRINTS[(episodeNumber - 1) % THEME_BLUEPRINTS.length];

  const variation =
    blueprint.variations[
      Math.floor(episodeNumber / THEME_BLUEPRINTS.length) %
        blueprint.variations.length
    ];

  const description = `${variation.hook3s}

Selamat datang di channel Animasi Anak Ceria! Di episode #${episodeNumber} ini, anak-anak akan belajar warna, berhitung, dan nilai kebaikan bersama ${blueprint.themeLabel} dengan cerita seru dan aman untuk semua usia.

🎬 Isi Episode:
${variation.scenes
  .map((s) => `• Adegan ${s.sceneNumber} (${s.label}): ${s.subtitle}`)
  .join("\n")}

💛 Dukung channel ini dengan LIKE, KOMENTAR, dan SUBSCRIBE agar tidak ketinggalan episode animasi baru setiap hari!

${variation.tags}`;

  return {
    id: `yt-ep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    episodeNumber,
    createdAt: new Date().toISOString(),
    themeId: blueprint.themeId,
    themeLabel: blueprint.themeLabel,
    title: variation.title,
    thumbnailHeadline: variation.thumbnailHeadline,
    hook3s: variation.hook3s,
    description,
    tags: variation.tags,
    accentColor: blueprint.accentColor,
    uploaded: false,
    createdByAuto,
    scenes: variation.scenes,
  };
}

export const ALL_KIDS_THEMES: { id: KidsThemeId; label: string; emoji: string }[] =
  [
    { id: "rescue_trucks", label: "Mobil Pemadam & Polisi", emoji: "🚒" },
    { id: "dino_colors", label: "Dinosaurus & Warna", emoji: "🦖" },
    { id: "rainbow_train", label: "Kereta Pelangi", emoji: "🚂" },
    { id: "space_rocket", label: "Roket Luar Angkasa", emoji: "🚀" },
    { id: "excavator_park", label: "Truk Excavator", emoji: "🚜" },
    { id: "animal_friends", label: "Kelinci & Beruang", emoji: "🐰" },
  ];
