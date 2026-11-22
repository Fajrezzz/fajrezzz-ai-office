import { NextResponse } from "next/server";
import { generateFreeWorkPackage } from "@/lib/work-engine/generator";
import type { WorkOrderInput } from "@/types/office";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<WorkOrderInput>;

    const businessName = (body.businessName ?? "").trim();
    if (!businessName) {
      return NextResponse.json(
        { error: "Nama usaha atau produk wajib diisi." },
        { status: 400 }
      );
    }

    const input: WorkOrderInput = {
      mode:
        body.mode === "agency_umkm" ||
        body.mode === "content_affiliate" ||
        body.mode === "full_bundle"
          ? body.mode
          : "full_bundle",
      businessName,
      niche: (body.niche ?? "UMKM Lokal").trim() || "UMKM Lokal",
      city: (body.city ?? "Indonesia").trim() || "Indonesia",
      offerSummary:
        (body.offerSummary ?? "Layanan berkualitas dengan harga bersahabat").trim() ||
        "Layanan berkualitas dengan harga bersahabat",
      priceRange: (body.priceRange ?? "Mulai Rp 50.000").trim() || "Mulai Rp 50.000",
      whatsappNumber: (body.whatsappNumber ?? "081234567890").trim(),
      targetAudience:
        (body.targetAudience ?? "Anak muda, keluarga & pelanggan lokal").trim() ||
        "Anak muda, keluarga & pelanggan lokal",
      brandColor: (body.brandColor ?? "#0ea5e9").trim() || "#0ea5e9",
    };

    // 100% Free Built-In Zero-Cost Production Engine (Rp 0 — no paid API keys required)
    const deliverable = generateFreeWorkPackage(input);

    return NextResponse.json({
      ok: true,
      deliverable,
      costNote:
        "Dihasilkan dengan Built-in Production Engine 100% Gratis (Rp 0 tanpa biaya API).",
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal memproses perintah kerja. Periksa data input Anda." },
      { status: 400 }
    );
  }
}
