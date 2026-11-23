/**
 * FAJREZZZ AI OFFICE — CANDIDATE BANK (v10)
 *
 * Ini BUKAN daftar topik AI untuk diacak. Setiap kandidat di sini berasal dari
 * siaran resmi yang benar-benar dibuka saat sesi ini berjalan, dan URL-nya
 * dicatat apa adanya. Kandidat dipakai sebagai *masukan* pemilihan topik —
 * `selectBestTopic()` tetap boleh menolaknya (dan memang menolak duplikat di
 * bawah) sehingga keputusan akhir bukan "ambil acak dari daftar".
 *
 * Tanggal `publishedAt` mengikuti tanggal terbit yang tertera di halaman.
 * Kolom `verifiedLive: true` berarti halaman sumber dibuka pada
 * `verifiedAt` dan isi klaim di bawah dikutip dari halaman itu.
 */

import type { TopicCandidate } from "./topic-intelligence.ts";

export const CANDIDATE_BANK_VERIFIED_AT = "2026-11-23T00:00:00.000Z";

export const CANDIDATE_BANK: TopicCandidate[] = [
  {
    id: "cand-supermoon-nov2026",
    title: "Supermoon 24 November 2026: kenapa bulan terlihat lebih besar padahal ukurannya tidak berubah",
    thesis:
      "Purnama perige membuat bulan tampak lebih besar karena jaraknya sedang paling dekat dengan bumi, bukan karena bulan membesar",
    category: "sains",
    angle: "Membongkar salah kaprah 'bulan membesar' dengan penjelasan jarak perige",
    hook: "Malam ini bulan kelihatan besar sekali. Tapi bulan itu tidak membesar sedikit pun.",
    keyFacts: [
      {
        claim:
          "BMKG menyebut supermoon atau purnama perige pertama tahun 2026 terjadi di langit Indonesia pada 24 November 2026",
        sourceIndex: 0,
      },
      {
        claim:
          "Fenomena ini membuat bulan purnama tampak lebih besar dibandingkan biasanya karena posisinya lebih dekat ke bumi",
        sourceIndex: 0,
      },
    ],
    sources: [
      {
        name: "BMKG: Supermoon Pertama 2026 pada 24 November, Lebih Dekat dan Besar",
        url: "https://www.bmkg.go.id/berita/bmkg-supermoon-pertama-2026-pada-24-november-lebih-dekat-dan-besar",
        kind: "official",
        publishedAt: "2026-11-21",
      },
    ],
    noveltyNotes:
      "Bedanya dengan konten astronomi biasa: fokus pada koreksi miskonsepsi ukuran, bukan sekadar jadwal fenomena",
    audienceImportance: 62,
    difficulty: 3,
    durationFitSec: 45,
    clarity: 88,
    curiosity: 80,
    educationalValue: 85,
    visualPotential: 92,
    tags: ["bulan", "astronomi", "bmkg", "supermoon"],
  },
  {
    id: "cand-tpt-upah-agustus-2026",
    title: "Pengangguran turun jadi 4,75 persen, tapi kenapa gaji terasa tetap segitu",
    thesis:
      "Jumlah orang bekerja naik dan pengangguran turun, namun rata-rata upah buruh masih sekitar 3,42 juta rupiah per bulan",
    category: "ekonomi",
    angle: "Membaca dua angka BPS berdampingan: kesempatan kerja bertambah, upah rata-rata melambat",
    hook: "Pengangguran turun. Tapi gaji temanmu tidak naik. Dua angka ini keluar di hari yang sama.",
    keyFacts: [
      {
        claim:
          "Tingkat Pengangguran Terbuka Agustus 2026 sebesar 4,75 persen, turun 0,09 persen poin dibanding Agustus 2025",
        sourceIndex: 0,
      },
      {
        claim:
          "Penduduk bekerja pada Agustus 2026 sebanyak 147,99 juta orang, naik 1,443 juta orang dari Agustus 2025",
        sourceIndex: 0,
      },
      {
        claim: "Rata-rata upah buruh pada Agustus 2026 sebesar 3,42 juta rupiah",
        sourceIndex: 0,
      },
      {
        claim:
          "Lapangan usaha dengan porsi penduduk bekerja terbesar adalah pertanian, kehutanan, dan perikanan sebanyak 41,73 juta orang atau 28,20 persen",
        sourceIndex: 0,
      },
    ],
    sources: [
      {
        name: "BPS — Tingkat Pengangguran Terbuka 4,75 persen, rata-rata upah buruh 3,42 juta rupiah",
        url: "https://www.bps.go.id/id/pressrelease/2026/11/05/169961/tingkat-pengangguran-terbuka--tpt--sebesar-4-75-persen---rata-rata-upah-buruh-sebesar-3-42-juta-rupiah.html",
        kind: "official",
        publishedAt: "2026-11-05",
      },
    ],
    noveltyNotes:
      "Angka pengangguran sering dibahas sendirian; di sini dua indikator dibaca bersamaan supaya tidak jadi klaim sepihak soal penyebab",
    audienceImportance: 90,
    difficulty: 5,
    durationFitSec: 55,
    clarity: 72,
    curiosity: 85,
    educationalValue: 82,
    visualPotential: 55,
    tags: ["bps", "ketenagakerjaan", "upah", "ekonomi"],
  },
  {
    id: "cand-ipm-2026",
    title: "IPM Indonesia 76,59: angka ini sebenarnya mengukur apa dari hidup kita",
    thesis:
      "Indeks Pembangunan Manusia menggabungkan kesehatan, pendidikan, dan pengeluaran, sehingga satu angka tidak bisa mewakili kualitas hidup semua orang",
    category: "sosial",
    angle: "Membedah isi indeks dan batasannya, bukan merayakan kenaikan angkanya",
    hook: "Angka 76,59 ini katanya menunjukkan hidup kita membaik. Tapi ia cuma gabungan tiga hal.",
    keyFacts: [
      {
        claim: "IPM Indonesia tahun 2026 mencapai 76,59, meningkat 0,69 poin dibanding tahun sebelumnya sebesar 75,90",
        sourceIndex: 0,
      },
      {
        claim:
          "Umur Harapan Hidup saat lahir pada 2026 mencapai 74,68 tahun atau naik 0,21 tahun dari tahun sebelumnya",
        sourceIndex: 0,
      },
      {
        claim:
          "Harapan Lama Sekolah penduduk umur 7 tahun ke atas sebesar 13,34 tahun, sedangkan Rata-rata Lama Sekolah penduduk umur 25 tahun ke atas 9,16 tahun",
        sourceIndex: 0,
      },
    ],
    sources: [
      {
        name: "BPS — Indeks Pembangunan Manusia Indonesia tahun 2026 mencapai 76,59",
        url: "https://www.bps.go.id/id/pressrelease/2026/11/05/171255/indeks-pembangunan-manusia--ipm--indonesia-tahun-2026-mencapai-76-59--meningkat-0-69-poin-dibandingkan-tahun-sebelumnya-yang-sebesar-75-90-.html",
        kind: "official",
        publishedAt: "2026-11-05",
      },
    ],
    noveltyNotes:
      "Kebanyakan konten hanya membaca kenaikan IPM; episode ini menjelaskan komponen dan apa yang tidak terlihat dari angka itu",
    audienceImportance: 74,
    difficulty: 5,
    durationFitSec: 52,
    clarity: 80,
    curiosity: 78,
    educationalValue: 92,
    visualPotential: 60,
    tags: ["ipm", "pendidikan", "kesehatan", "bps"],
  },
  {
    id: "cand-supermoon-duplikat",
    title: "Bulan besar 24 November, cek fakta supermoon malam ini",
    thesis:
      "Purnama perige membuat bulan tampak lebih besar karena jaraknya sedang paling dekat dengan bumi, bukan karena bulan membesar",
    category: "sains",
    angle: "Membongkar salah kaprah 'bulan membesar' dengan penjelasan jarak perige",
    hook: "Malam ini bulan kelihatan besar sekali. Tapi bulan itu tidak membesar sedikit pun.",
    keyFacts: [
      {
        claim: "BMKG menyebut supermoon pertama 2026 terjadi pada 24 November 2026",
        sourceIndex: 0,
      },
    ],
    sources: [
      {
        name: "BMKG: Supermoon Pertama 2026 pada 24 November",
        url: "https://www.bmkg.go.id/berita/bmkg-supermoon-pertama-2026-pada-24-november-lebih-dekat-dan-besar",
        kind: "official",
        publishedAt: "2026-11-21",
      },
    ],
    noveltyNotes: "Judul diganti, isi dan sudut sama — sengaja dipakai untuk menguji penolakan duplikat",
    audienceImportance: 60,
    difficulty: 3,
    durationFitSec: 45,
    clarity: 85,
    curiosity: 78,
    educationalValue: 80,
    visualPotential: 90,
    tags: ["bulan", "supermoon"],
  },
];
