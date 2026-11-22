import type {
  AssignedStaffContribution,
  ContentScriptItem,
  OutreachScriptItem,
  WorkOrderDeliverable,
  WorkOrderInput,
} from "@/types/office";

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeWaNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "6281234567890";
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("62")) return digits;
  return `62${digits}`;
}

function sanitizeHexColor(raw: string): string {
  const trimmed = raw.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed;
  return "#0ea5e9";
}

function buildLandingPageHtml(input: WorkOrderInput): string {
  const name = escapeHtml(input.businessName || "Usaha Anda");
  const niche = escapeHtml(input.niche || "Bisnis Modern");
  const city = escapeHtml(input.city || "Indonesia");
  const offer = escapeHtml(
    input.offerSummary || "Layanan berkualitas tinggi dengan harga terjangkau"
  );
  const price = escapeHtml(input.priceRange || "Mulai Rp 50.000");
  const audience = escapeHtml(
    input.targetAudience || "Pelanggan yang mengutamakan kualitas & kecepatan"
  );
  const accent = sanitizeHexColor(input.brandColor);
  const waNum = normalizeWaNumber(input.whatsappNumber);
  const waMsg = encodeURIComponent(
    `Halo ${input.businessName}, saya lihat website-nya dan tertarik untuk pesan / tanya info promo hari ini!`
  );
  const waLink = `https://wa.me/${waNum}?text=${waMsg}`;

  const isAffiliate = input.mode === "content_affiliate";
  const ctaText = isAffiliate
    ? "Beli Produk Promo Sekarang"
    : "Pesan via WhatsApp Sekarang";

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${name} — ${niche} Terbaik di ${city}</title>
  <style>
    :root { --brand: ${accent}; --bg: #0b1120; --card: #111b2e; --text: #f8fafc; --muted: #94a3b8; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; }
    a { text-decoration: none; color: inherit; }
    .container { max-width: 1080px; margin: 0 auto; padding: 0 20px; }
    header { position: sticky; top: 0; z-index: 40; backdrop-filter: blur(12px); background: rgba(11,17,32,0.86); border-bottom: 1px solid rgba(255,255,255,0.08); }
    .nav { display: flex; align-items: center; justify-content: space-between; height: 68px; gap: 12px; }
    .logo { font-weight: 800; font-size: 1.1rem; letter-spacing: 0.03em; display: flex; align-items: center; gap: 10px; }
    .logo-dot { width: 12px; height: 12px; border-radius: 50%; background: var(--brand); box-shadow: 0 0 14px var(--brand); }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 22px; border-radius: 12px; font-weight: 700; font-size: 0.92rem; transition: transform .15s, opacity .15s; cursor: pointer; }
    .btn:hover { transform: translateY(-2px); opacity: .95; }
    .btn-primary { background: var(--brand); color: #050a14; box-shadow: 0 10px 26px rgba(0,0,0,0.32); }
    .btn-outline { border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); color: #fff; }
    .hero { padding: 72px 0 56px; background: radial-gradient(circle at top right, rgba(255,255,255,0.08), transparent 48%); }
    .badge { display: inline-block; padding: 6px 14px; border-radius: 999px; font-size: 0.78rem; font-weight: 700; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.16); color: #e2e8f0; margin-bottom: 18px; }
    h1 { font-size: clamp(2rem, 5vw, 3.2rem); line-height: 1.15; font-weight: 900; margin-bottom: 18px; }
    .highlight { color: var(--brand); }
    .lead { font-size: 1.05rem; color: var(--muted); max-width: 650px; margin-bottom: 28px; }
    .hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 36px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 14px; }
    .stat { background: var(--card); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 18px; }
    .stat strong { display: block; font-size: 1.35rem; color: #fff; }
    .stat span { font-size: 0.82rem; color: var(--muted); }
    section { padding: 56px 0; }
    .sec-title { font-size: 1.75rem; font-weight: 800; margin-bottom: 10px; }
    .sec-sub { color: var(--muted); margin-bottom: 28px; max-width: 620px; }
    .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 18px; }
    .card { background: var(--card); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 24px; }
    .card h3 { font-size: 1.1rem; margin-bottom: 8px; }
    .card p { font-size: 0.92rem; color: var(--muted); }
    .price-card { position: relative; border: 1px solid rgba(255,255,255,0.14); }
    .price-card.featured { border-color: var(--brand); box-shadow: 0 0 32px rgba(0,0,0,0.35); }
    .price-tag { font-size: 1.55rem; font-weight: 900; color: var(--brand); margin: 12px 0; }
    ul.check { list-style: none; margin: 14px 0 22px; display: grid; gap: 8px; font-size: 0.9rem; color: #cbd5e1; }
    .cta-box { background: linear-gradient(135deg, #111c33, #172544); border: 1px solid rgba(255,255,255,0.14); border-radius: 24px; padding: 40px 28px; text-align: center; }
    footer { padding: 28px 0 42px; border-top: 1px solid rgba(255,255,255,0.08); text-align: center; color: var(--muted); font-size: 0.85rem; }
    .wa-float { position: fixed; right: 18px; bottom: 18px; z-index: 50; background: #22c55e; color: #052e16; font-weight: 800; padding: 12px 18px; border-radius: 999px; box-shadow: 0 10px 28px rgba(34,197,94,0.35); font-size: 0.88rem; }
  </style>
</head>
<body>
  <header>
    <div class="container nav">
      <div class="logo"><span class="logo-dot"></span> ${name}</div>
      <a class="btn btn-primary" href="${waLink}" target="_blank" rel="noopener">Order Sekarang</a>
    </div>
  </header>

  <main>
    <section class="hero">
      <div class="container">
        <span class="badge">${niche} · ${city}</span>
        <h1>Solusi <span class="highlight">${niche}</span> Terbaik dari ${name}</h1>
        <p class="lead">${offer}. Dirancang khusus untuk ${audience} dengan standar pelayanan profesional dan harga transparan (${price}).</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="${waLink}" target="_blank" rel="noopener">${ctaText}</a>
          <a class="btn btn-outline" href="#paket">Lihat Paket &amp; Harga</a>
        </div>
        <div class="stats">
          <div class="stat"><strong>4.9 / 5.0</strong><span>Kepuasan Pelanggan</span></div>
          <div class="stat"><strong>Respon Cepat</strong><span>Konsultasi via WhatsApp</span></div>
          <div class="stat"><strong>${price}</strong><span>Harga Transparan</span></div>
          <div class="stat"><strong>${city}</strong><span>Area Layanan Aktif</span></div>
        </div>
      </div>
    </section>

    <section>
      <div class="container">
        <h2 class="sec-title">Kenapa Memilih ${name}?</h2>
        <p class="sec-sub">Kami memastikan setiap pelanggan mendapatkan hasil maksimal tanpa ribet.</p>
        <div class="grid-3">
          <div class="card">
            <h3>1. Kualitas Terjamin</h3>
            <p>${offer} dengan standar pengerjaan rapi dan pengecekan kualitas ketat.</p>
          </div>
          <div class="card">
            <h3>2. Harga Jujur &amp; Terjangkau</h3>
            <p>Mulai dari ${price}, tanpa biaya tersembunyi dan cocok untuk ${audience}.</p>
          </div>
          <div class="card">
            <h3>3. Pemesanan Super Mudah</h3>
            <p>Cukup klik tombol WhatsApp, tim ${name} siap membantu dari konsultasi hingga selesai.</p>
          </div>
        </div>
      </div>
    </section>

    <section id="paket">
      <div class="container">
        <h2 class="sec-title">Pilihan Paket Favorit</h2>
        <p class="sec-sub">Pilih paket yang paling sesuai dengan kebutuhan Anda hari ini.</p>
        <div class="grid-3">
          <div class="card price-card">
            <h3>Paket Hemat</h3>
            <div class="price-tag">${price}</div>
            <ul class="check">
              <li>✓ Layanan utama ${niche}</li>
              <li>✓ Konsultasi gratis via WA</li>
              <li>✓ Garansi kepuasan pelanggan</li>
            </ul>
            <a class="btn btn-outline" style="width:100%" href="${waLink}" target="_blank" rel="noopener">Pilih Paket Hemat</a>
          </div>
          <div class="card price-card featured">
            <span class="badge" style="margin-bottom:8px">PALING LARIS</span>
            <h3>Paket Best Seller</h3>
            <div class="price-tag">Promo Spesial</div>
            <ul class="check">
              <li>✓ Semua fitur Paket Hemat</li>
              <li>✓ Prioritas pengerjaan cepat</li>
              <li>✓ Bonus eksklusif minggu ini</li>
            </ul>
            <a class="btn btn-primary" style="width:100%" href="${waLink}" target="_blank" rel="noopener">Ambil Promo Sekarang</a>
          </div>
          <div class="card price-card">
            <h3>Paket VIP / Grosir</h3>
            <div class="price-tag">Custom Deal</div>
            <ul class="check">
              <li>✓ Diskon khusus pembelian banyak</li>
              <li>✓ Layanan prioritas VIP</li>
              <li>✓ Dukungan penuh tim ${name}</li>
            </ul>
            <a class="btn btn-outline" style="width:100%" href="${waLink}" target="_blank" rel="noopener">Tanya Harga VIP</a>
          </div>
        </div>
      </div>
    </section>

    <section>
      <div class="container">
        <div class="cta-box">
          <h2 class="sec-title">Siap Merasakan Layanan Terbaik ${name}?</h2>
          <p class="sec-sub" style="margin: 0 auto 24px;">Slot promo hari ini terbatas. Klik tombol di bawah untuk langsung terhubung ke WhatsApp kami.</p>
          <a class="btn btn-primary" href="${waLink}" target="_blank" rel="noopener">${ctaText}</a>
        </div>
      </div>
    </section>
  </main>

  <footer>
    <div class="container">
      &copy; ${new Date().getFullYear()} ${name} (${city}). Dibuat dengan FAJREZZZ AI OFFICE Studio.
    </div>
  </footer>

  <a class="wa-float" href="${waLink}" target="_blank" rel="noopener">💬 Chat WhatsApp</a>
</body>
</html>`;
}

function buildContentScripts(input: WorkOrderInput): ContentScriptItem[] {
  const biz = input.businessName || "Brand Anda";
  const niche = input.niche || "Bisnis";
  const city = input.city || "Indonesia";
  const offer = input.offerSummary || "kualitas premium dengan harga hemat";
  const price = input.priceRange || "harga terjangkau";
  const aud = input.targetAudience || "anak muda & pekerja";
  const cleanTag = niche.toLowerCase().replace(/[^a-z0-9]/g, "") || "bisnis";
  const cityTag = city.toLowerCase().replace(/[^a-z0-9]/g, "") || "indonesia";

  return [
    {
      day: 1,
      format: "TikTok / Reels 30 dtk (Problem → Solution)",
      title: `Rahasia ${niche} Paling Worth It di ${city}`,
      hook3s: `"Jangan beli ${niche} di ${city} sebelum kamu lihat yang satu ini!"`,
      body: `Banyak ${aud} sering kecewa karena bayar mahal tapi hasil biasa aja. Di ${biz}, kamu dapat ${offer} dengan harga ${price}. Tunjukkan video close-up proses/produk 10 detik sambil tampilkan teks harga di layar.`,
      cta: `"Mau promo hari ini? Langsung klik link di bio / keranjang kuning sekarang!"`,
      hashtags: `#${cleanTag} #${cityTag} #fyp #rekomendasi #promo`,
    },
    {
      day: 2,
      format: "YouTube Shorts / TikTok 35 dtk (POV Pelanggan)",
      title: `POV: Pertama Kali Coba ${biz}`,
      hook3s: `"Jujur awalnya ragu, ternyata ${biz} sebagus ini..."`,
      body: `Rekam transisi Before-After atau unboxing/kunjungan pertama. Sorot keunggulan utama: ${offer}. Tambahkan teks: "Cocok banget buat ${aud} yang cari kualitas tanpa bikin kantong jebol (${price})."`,
      cta: `"Save video ini biar nggak lupa, atau komen 'MAU' buat dapet detailnya!"`,
      hashtags: `#pov #reviewjujur #${cleanTag} #${cityTag} #viral`,
    },
    {
      day: 3,
      format: "TikTok / Reels 25 dtk (3 Alasan Cepat)",
      title: `3 Alasan Kenapa ${biz} Selalu Ramai`,
      hook3s: `"3 alasan kenapa ${aud} di ${city} pada pindah ke ${biz}:"`,
      body: `1) ${offer}. 2) Harga mulai ${price}, super masuk akal. 3) Pelayanan ramah & respon super cepat. Gunakan potongan klip 2 detik per poin agar retensi penonton tinggi.`,
      cta: `"Menurut kamu nomor berapa yang paling penting? Tulis di komentar!"`,
      hashtags: `#tips #${cleanTag} #umkmindonesia #${cityTag} #fyp`,
    },
    {
      day: 4,
      format: "Faceless / Voiceover 40 dtk (Edukasi + Soft Selling)",
      title: `Kesalahan Umum Saat Memilih ${niche}`,
      hook3s: `"90% orang masih salah pilih ${niche} gara-gara hal sepele ini!"`,
      body: `Jelaskan 2 kesalahan umum (tergiur murah tanpa cek kualitas, tidak cek garansi/review). Lalu perkenalkan standar ${biz}: ${offer} dengan harga transparan ${price}.`,
      cta: `"Pengen langsung cek pilihan terbaiknya? Klik link di profil ya!"`,
      hashtags: `#edukasi #${cleanTag} #belajarcuan #${cityTag} #shorts`,
    },
    {
      day: 5,
      format: "TikTok / Reels 30 dtk (Behind The Scenes)",
      title: `Di Balik Layar ${biz} Setiap Hari`,
      hook3s: `"Ini dia rahasia kenapa kualitas ${biz} selalu konsisten!"`,
      body: `Tampilkan proses kerja/packing/persiapan nyata dari dekat (ASMR atau musik upbeat). Jelaskan komitmen tim menjaga ${offer} demi kepuasan ${aud}.`,
      cta: `"Order hari ini langsung kami prioritaskan — klik WhatsApp / link di bio!"`,
      hashtags: `#behindthescenes #${cleanTag} #bisnislokal #${cityTag}`,
    },
    {
      day: 6,
      format: "Carousel / Video Testimoni 25 dtk (Social Proof)",
      title: `Kata Mereka yang Sudah Coba ${biz}`,
      hook3s: `"Nggak nyangka respon pelanggan ${biz} sampai begini..."`,
      body: `Tampilkan 3 tangkapan layar chat puas / reaksi pelanggan + foto hasil produk. Tutup dengan info harga (${price}) dan promo khusus akhir pekan.`,
      cta: `"Giliran kamu buktiin sendiri hari ini, klik link bio sekarang!"`,
      hashtags: `#testimoni #${cleanTag} #trusted #${cityTag} #fyp`,
    },
    {
      day: 7,
      format: "Urgency Promo 20 dtk (Closing Mingguan)",
      title: `Slot Promo Minggu Ini Hampir Habis!`,
      hook3s: `"Cuma sampai besok malam! Promo ${biz} resmi ditutup kalau kuota penuh."`,
      body: `Rekap singkat dalam 10 detik: ${offer}, cocok untuk ${aud}, harga spesial ${price}. Tampilkan timer atau teks "KHUSUS MINGGU INI".`,
      cta: `"Jangan sampai kehabisan — klik link di bio / kirim DM 'PROMO' sekarang!"`,
      hashtags: `#promomingguini #diskon #${cleanTag} #${cityTag} #fyp`,
    },
  ];
}

function buildOutreachScripts(input: WorkOrderInput): OutreachScriptItem[] {
  const biz = input.businessName || "Usaha Bapak/Ibu";
  const niche = input.niche || "bisnis";
  const city = input.city || "kota ini";

  return [
    {
      channel: "WhatsApp",
      label: "Pesan Pembuka (Kirim Demo Website Gratis)",
      message: `Halo Kak / Pemilik ${biz} 👋\n\nPerkenalkan saya Fajrez dari FAJREZZZ Digital Studio. Tadi saya lihat ${biz} di ${city} keren banget potensinya di bidang ${niche}.\n\nIseng saya sudah buatkan *contoh demo website modern + tombol order WhatsApp* khusus untuk ${biz} (gratis buat dilihat dulu, tanpa komitmen apa pun).\n\nBoleh saya kirim link/file demonya sekarang Kak? Siapa tahu cocok buat ningkatin orderan online ${biz} 🙏`,
    },
    {
      channel: "Instagram DM",
      label: "Cold DM Singkat (Anti-Spam, Respon Tinggi)",
      message: `Halo min ${biz}! 👋 Saya baru aja buatin preview landing page + 7 ide konten TikTok khusus buat ${biz} biar makin gampang closing dari bio IG. Boleh saya kirim preview-nya gratis buat dilihat dulu?`,
    },
    {
      channel: "Follow-Up",
      label: "Penawaran Paket Closing (Rp 350rb – Rp 750rb)",
      message: `Halo Kak, gimana preview website & paket konten untuk ${biz} kemarin? 😊\n\nKalau Kakak suka, ini paket promo UMKM minggu ini:\n1️⃣ Paket Starter (Rp 350.000): Website Landing Page siap online + tombol WA order + revisi sampai cocok.\n2️⃣ Paket Growth (Rp 650.000): Website + 7 Naskah Video TikTok/Reels + setup bio & link.\n\nPembayaran cukup setelah demo disetujui. Mau kita aktifkan yang paket mana Kak? 🚀`,
    },
  ];
}

function buildInvoiceHtml(input: WorkOrderInput, dealValueIdr: number): string {
  const biz = escapeHtml(input.businessName || "Klien");
  const city = escapeHtml(input.city || "Indonesia");
  const niche = escapeHtml(input.niche || "UMKM");
  const dateStr = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const invoiceNo = `INV-FJR-${new Date().getFullYear()}${String(
    new Date().getMonth() + 1
  ).padStart(2, "0")}-${Math.floor(100 + Math.random() * 900)}`;
  const formattedPrice = `Rp ${dealValueIdr.toLocaleString("id-ID")}`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${invoiceNo} — ${biz}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f1f5f9; color: #0f172a; padding: 24px; }
    .sheet { max-width: 720px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 36px; box-shadow: 0 10px 30px rgba(15,23,42,0.08); }
    .top { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
    .brand { font-size: 1.35rem; font-weight: 900; color: #0f172a; }
    .sub { color: #64748b; font-size: 0.85rem; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { text-align: left; padding: 12px 10px; border-bottom: 1px solid #e2e8f0; font-size: 0.92rem; }
    th { background: #f8fafc; font-weight: 700; color: #334155; }
    .total { text-align: right; font-size: 1.3rem; font-weight: 900; color: #0284c7; margin-top: 12px; }
    .pay { margin-top: 26px; padding: 16px; border-radius: 12px; background: #f8fafc; border: 1px dashed #94a3b8; font-size: 0.88rem; }
    @media print { body { background: #fff; padding: 0; } .sheet { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="top">
      <div>
        <div class="brand">FAJREZZZ DIGITAL STUDIO</div>
        <div class="sub">Website Landing Page &amp; Content Production</div>
      </div>
      <div style="text-align:right">
        <div style="font-weight:800">${invoiceNo}</div>
        <div class="sub">Tanggal: ${dateStr}</div>
      </div>
    </div>

    <div style="margin-bottom:18px">
      <div class="sub">Ditagihkan kepada:</div>
      <div style="font-weight:800;font-size:1.05rem">${biz}</div>
      <div class="sub">Kategori: ${niche} · ${city}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Deskripsi Layanan</th>
          <th style="text-align:right">Nilai</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Pembuatan Website Landing Page Responsif + Tombol Order WhatsApp</td>
          <td style="text-align:right">Termasuk</td>
        </tr>
        <tr>
          <td>Paket 7 Naskah Konten Video Pendek (TikTok / Reels / Shorts)</td>
          <td style="text-align:right">Termasuk</td>
        </tr>
        <tr>
          <td>Setup File Siap Online + Revisi Minor 2x</td>
          <td style="text-align:right"><strong>${formattedPrice}</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="total">TOTAL TAGIHAN: ${formattedPrice}</div>

    <div class="pay">
      <strong>Metode Pembayaran (Silakan isi rekening/QRIS Bos FAJREZ):</strong><br/>
      Bank / E-Wallet (BCA / BRI / SeaBank / DANA / QRIS): <em>[Isi Nomor Rekening Anda]</em><br/>
      Atas Nama: <strong>FAJREZ</strong>
    </div>
  </div>
</body>
</html>`;
}

function buildStaffContributions(
  input: WorkOrderInput
): AssignedStaffContribution[] {
  const all: AssignedStaffContribution[] = [
    {
      staffName: "Raka Pratama",
      role: "Lead Web Builder",
      floor: 2,
      outputLabel: "Kode Website Landing Page HTML siap online",
    },
    {
      staffName: "Clara Santoso",
      role: "UI/UX & Brand Designer",
      floor: 2,
      outputLabel: `Skema warna brand (${input.brandColor}) & layout responsif`,
    },
    {
      staffName: "Bima Kusuma",
      role: "Viral Scriptwriter",
      floor: 2,
      outputLabel: "7 Naskah Video TikTok / Reels / Shorts + Hook 3 detik",
    },
    {
      staffName: "Nadia Putri",
      role: "Market Researcher",
      floor: 2,
      outputLabel: `Sudut pandang target pasar ${input.targetAudience || "UMKM"}`,
    },
    {
      staffName: "Dimas Wijaya",
      role: "Offer Copywriter",
      floor: 2,
      outputLabel: "Headline penawaran, paket harga & CTA WhatsApp",
    },
    {
      staffName: "Salsa Maharani",
      role: "SEO & Hashtag Specialist",
      floor: 2,
      outputLabel: "Hashtag lokal & kata kunci pencarian konten",
    },
    {
      staffName: "Tania Lestari",
      role: "Client Outreach & CS",
      floor: 1,
      outputLabel: "3 Script DM Instagram, WhatsApp Pitch & Follow-Up",
    },
    {
      staffName: "Fajar Nugroho",
      role: "Pricing & Invoice Ops",
      floor: 2,
      outputLabel: "Dokumen Invoice HTML siap cetak/PDF untuk penagihan",
    },
    {
      staffName: "Alya Ramadhani",
      role: "QA & Polish Editor",
      floor: 2,
      outputLabel: "Validasi tombol wa.me, tampilan mobile & keterbacaan",
    },
    {
      staffName: "Reza Mahendra",
      role: "Executive Strategist",
      floor: 3,
      outputLabel: "Playbook monetisasi 100% gratis tanpa modal",
    },
  ];
  return all;
}

export function generateFreeWorkPackage(
  input: WorkOrderInput
): WorkOrderDeliverable {
  const suggestedValue =
    input.mode === "content_affiliate"
      ? 350000
      : input.mode === "agency_umkm"
      ? 500000
      : 650000;

  return {
    id: `wo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    engineMode: "builtin-free",
    input,
    dealStatus: "draft",
    dealValueIdr: suggestedValue,
    assignedStaff: buildStaffContributions(input),
    landingPageHtml: buildLandingPageHtml(input),
    contentScripts: buildContentScripts(input),
    outreachScripts: buildOutreachScripts(input),
    invoiceHtml: buildInvoiceHtml(input, suggestedValue),
    monetizationPlaybook: [
      `1. Klik "Download Website (.html)" di tab Website Jadi — file 100% milikmu tanpa biaya apa pun.`,
      `2. Upload file HTML tersebut GRATIS di Netlify Drop (app.netlify.com/drop) atau GitHub Pages agar langsung punya link live https://...`,
      `3. Cari 10–20 target ${input.niche || "UMKM"} di Google Maps / Instagram ${input.city || "kotamu"} yang belum punya website rapi.`,
      `4. Salin script dari tab "Script WA/DM" dan kirim link demo tadi ke WhatsApp/DM pemilik usaha (tawarkan Rp 350rb–Rp 650rb).`,
      `5. Untuk jalur Affiliate/Konten: pakai 7 Naskah Video dari tab "7 Naskah Viral" pakai CapCut gratis (rekam layar/voiceover) dan tempel link Shopee/TikTok Affiliate.`,
      `6. Saat klien setuju, download "Invoice HTML" lalu Print → Save as PDF dari browser HP/PC untuk kirim tagihan dan tandai LUNAS di tracker omzet!`,
    ],
  };
}
