"use client";

import React, { useMemo, useState } from "react";
import {
  BadgeCheck,
  Briefcase,
  Check,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Film,
  Globe,
  MessageCircle,
  Monitor,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import { useOffice } from "@/store/OfficeContext";
import type {
  WorkDealStatus,
  WorkOrderDeliverable,
  WorkOrderInput,
  WorkOrderMode,
} from "@/types/office";

type OutputTab = "website" | "scripts" | "outreach" | "invoice";

const QUICK_PRESETS: { label: string; data: WorkOrderInput }[] = [
  {
    label: "☕ Kafe / Kopi UMKM",
    data: {
      mode: "full_bundle",
      businessName: "Kopi Senja Lampung",
      niche: "Kedai Kopi & Nongkrong",
      city: "Bandar Lampung",
      offerSummary:
        "Kopi susu gula aren spesial biji lokal Lampung + ruang AC nyaman & WiFi kencang",
      priceRange: "Mulai Rp 18.000",
      whatsappNumber: "081234567890",
      targetAudience: "Mahasiswa, pekerja remote & komunitas anak muda",
      brandColor: "#f59e0b",
    },
  },
  {
    label: "💄 Affiliate Skincare Viral",
    data: {
      mode: "content_affiliate",
      businessName: "GlowDaily Serum C+",
      niche: "Skincare & Kecantikan",
      city: "Indonesia",
      offerSummary:
        "Serum pencerah harian BPOM ringan tanpa lengket — cocok untuk kulit tropis",
      priceRange: "Rp 49.000 – Rp 89.000",
      whatsappNumber: "081234567890",
      targetAudience: "Wanita & pria usia 18–35 tahun yang aktif di TikTok/Shopee",
      brandColor: "#ec4899",
    },
  },
  {
    label: "💈 Barbershop Lokal",
    data: {
      mode: "agency_umkm",
      businessName: "Gentleman Cut Studio",
      niche: "Barbershop Modern",
      city: "Bandar Lampung",
      offerSummary:
        "Potong rambut fade rapi + cuci pijat kepala + styling pomade gratis",
      priceRange: "Mulai Rp 35.000",
      whatsappNumber: "081234567890",
      targetAudience: "Pria muda, mahasiswa & eksekutif kantor",
      brandColor: "#0ea5e9",
    },
  },
  {
    label: "🍗 Kuliner / F&B Delivery",
    data: {
      mode: "full_bundle",
      businessName: "Geprek Sultan Express",
      niche: "Kuliner Ayam Geprek & Catering",
      city: "Bandar Lampung",
      offerSummary:
        "Ayam krispi sambal bawang segar + paket nasi box hemat untuk acara & kantor",
      priceRange: "Mulai Rp 15.000",
      whatsappNumber: "081234567890",
      targetAudience: "Pelajar, keluarga & pesanan nasi box kantor",
      brandColor: "#ef4444",
    },
  },
];

function formatIdr(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function downloadHtmlFile(filename: string, html: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function openHtmlInNewTab(html: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
}

export function WorkStudioPanel() {
  const {
    workOrders,
    isGeneratingWork,
    runWorkOrder,
    updateWorkOrderDeal,
    deleteWorkOrder,
    setActiveSection,
  } = useOffice();

  const [form, setForm] = useState<WorkOrderInput>(QUICK_PRESETS[0].data);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [outputTab, setOutputTab] = useState<OutputTab>("website");
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">(
    "desktop"
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeOrder: WorkOrderDeliverable | null = useMemo(() => {
    if (workOrders.length === 0) return null;
    if (selectedOrderId) {
      return (
        workOrders.find((o) => o.id === selectedOrderId) ?? workOrders[0]
      );
    }
    return workOrders[0];
  }, [workOrders, selectedOrderId]);

  const totalPaidIdr = useMemo(
    () =>
      workOrders
        .filter((o) => o.dealStatus === "paid")
        .reduce((sum, o) => sum + o.dealValueIdr, 0),
    [workOrders]
  );

  const sentCount = useMemo(
    () => workOrders.filter((o) => o.dealStatus === "sent").length,
    [workOrders]
  );

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      // Fallback ignored
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!form.businessName.trim()) {
      setErrorMsg("Isi nama usaha atau produk terlebih dahulu.");
      return;
    }

    const created = await runWorkOrder(form);
    if (created) {
      setSelectedOrderId(created.id);
      setOutputTab("website");
    } else {
      setErrorMsg("Gagal membuat paket kerja. Coba tekan tombol lagi.");
    }
  };

  return (
    <div className="space-y-5">
      {/* ================= TOP ZERO-COST BANNER & REVENUE KPI ================= */}
      <section className="rounded-2xl border border-emerald-500/35 bg-gradient-to-br from-[#071a18] via-[#071426] to-[#0c1126] p-4 sm:p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-emerald-200 uppercase">
              <ShieldCheck className="h-3.5 w-3.5" />
              100% FULL GRATIS (Rp 0 · Tanpa Bayar API / Modal)
            </div>
            <h2 className="mt-2 text-lg font-black tracking-wide text-white sm:text-xl">
              FAJREZZZ Work Studio — Agency UMKM &amp; Pabrik Konten Viral
            </h2>
            <p className="mt-1 max-w-2xl text-xs text-slate-300">
              Perintahkan 10 karyawan untuk langsung memproduksi{" "}
              <strong className="text-emerald-300">
                Website Landing Page HTML siap jual
              </strong>
              , <strong className="text-sky-300">7 Naskah Video Viral</strong>
              , <strong className="text-amber-300">Script WA/DM Klien</strong>,
              dan <strong className="text-purple-300">Invoice PDF/HTML</strong>{" "}
              secara instan tanpa biaya API sepeser pun.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveSection("office")}
            className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-amber-400/50 bg-amber-400/15 px-3.5 py-2 text-xs font-bold text-amber-200 transition hover:bg-amber-400/25"
          >
            <Users className="h-4 w-4" />
            Lihat 10 Karyawan di 3D
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="rounded-xl border border-emerald-500/25 bg-slate-950/70 p-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Omzet Lunas</span>
              <Wallet className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="mt-1 text-base font-black text-emerald-300 sm:text-lg">
              {formatIdr(totalPaidIdr)}
            </div>
          </div>
          <div className="rounded-xl border border-sky-500/25 bg-slate-950/70 p-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Paket Siap Jual</span>
              <Briefcase className="h-3.5 w-3.5 text-sky-400" />
            </div>
            <div className="mt-1 text-base font-black text-white sm:text-lg">
              {workOrders.length} Proyek
            </div>
          </div>
          <div className="rounded-xl border border-amber-500/25 bg-slate-950/70 p-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Demo Terkirim</span>
              <MessageCircle className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div className="mt-1 text-base font-black text-amber-200 sm:text-lg">
              {sentCount} Klien
            </div>
          </div>
          <div className="rounded-xl border border-purple-500/25 bg-slate-950/70 p-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Biaya Engine</span>
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            </div>
            <div className="mt-1 text-base font-black text-purple-200 sm:text-lg">
              Rp 0 / Gratis
            </div>
          </div>
        </div>
      </section>

      {/* ================= MAIN SPLIT: BRIEF FORM (LEFT) + DELIVERABLES VIEWER (RIGHT) ================= */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* LEFT: BRIEF FORM BOS FAJREZ */}
        <section className="space-y-4 rounded-2xl border border-cyan-500/25 bg-[#060d1f]/95 p-4 xl:col-span-5">
          <div>
            <h3 className="text-sm font-bold text-white">
              1. Beri Perintah Kerja ke 10 Karyawan
            </h3>
            <p className="text-[11px] text-slate-400">
              Pilih contoh cepat atau ketik langsung nama usaha/produk klienmu:
            </p>
          </div>

          {/* 1-Tap Quick Fill Templates */}
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setForm(preset.data)}
                className="rounded-lg border border-slate-700 bg-slate-900/90 px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-cyan-400/60 hover:bg-cyan-500/15"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Mode Selector */}
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-300">
                Jenis Paket Produksi (Semua Gratis Rp 0)
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: "full_bundle", label: "All-in-One (#1+#2)" },
                    { id: "agency_umkm", label: "Agency UMKM (#1)" },
                    { id: "content_affiliate", label: "Konten Viral (#2)" },
                  ] as { id: WorkOrderMode; label: string }[]
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, mode: m.id }))}
                    className={`rounded-xl border px-2 py-2 text-[10px] font-bold transition ${
                      form.mode === m.id
                        ? "border-emerald-400 bg-emerald-500/20 text-emerald-100"
                        : "border-slate-700 bg-slate-900/80 text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-300">
                  Nama Usaha / Produk *
                </label>
                <input
                  type="text"
                  required
                  value={form.businessName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, businessName: e.target.value }))
                  }
                  placeholder="cth: Kopi Senja Lampung"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-300">
                  Bidang / Niche
                </label>
                <input
                  type="text"
                  value={form.niche}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, niche: e.target.value }))
                  }
                  placeholder="cth: Kafe / Barbershop / Skincare"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-300">
                  Kota / Lokasi
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, city: e.target.value }))
                  }
                  placeholder="cth: Bandar Lampung"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-300">
                  Kisaran Harga Produk/Jasa
                </label>
                <input
                  type="text"
                  value={form.priceRange}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, priceRange: e.target.value }))
                  }
                  placeholder="cth: Mulai Rp 25.000"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-300">
                Keunggulan / Promo Utama
              </label>
              <textarea
                rows={2}
                value={form.offerSummary}
                onChange={(e) =>
                  setForm((f) => ({ ...f, offerSummary: e.target.value }))
                }
                placeholder="cth: Kopi lokal premium + gratis WiFi + promo beli 2 gratis 1"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-300">
                  No. WhatsApp (untuk tombol order)
                </label>
                <input
                  type="text"
                  value={form.whatsappNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, whatsappNumber: e.target.value }))
                  }
                  placeholder="08xxxxxxxxxx"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-300">
                  Warna Brand Website
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.brandColor}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, brandColor: e.target.value }))
                    }
                    className="h-9 w-11 cursor-pointer rounded-lg border border-slate-700 bg-slate-950 p-0.5"
                  />
                  <input
                    type="text"
                    value={form.brandColor}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, brandColor: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-white outline-none"
                  />
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/15 px-3 py-2 text-xs text-rose-200">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isGeneratingWork}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-300 px-4 py-3 text-xs font-black tracking-wide text-slate-950 shadow-lg transition hover:brightness-110 disabled:opacity-60 sm:text-sm"
            >
              <Rocket className="h-4 w-4" />
              <span>
                {isGeneratingWork
                  ? "10 Karyawan Sedang Memproduksi..."
                  : "Perintahkan 10 Karyawan Kerjakan Sekarang (Gratis)"}
              </span>
            </button>
          </form>

          {/* Saved Work Orders History */}
          {workOrders.length > 0 && (
            <div className="space-y-2 border-t border-slate-800 pt-3">
              <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                Riwayat Paket Produksi ({workOrders.length})
              </div>
              <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                {workOrders.map((order) => {
                  const selected = order.id === activeOrder?.id;
                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border p-2.5 transition ${
                        selected
                          ? "border-emerald-400/70 bg-emerald-500/10"
                          : "border-slate-800 bg-slate-950/70 hover:border-slate-600"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-xs font-bold text-white">
                          {order.input.businessName}
                        </div>
                        <div className="truncate text-[10px] text-slate-400">
                          {order.input.niche} • {formatIdr(order.dealValueIdr)}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase ${
                            order.dealStatus === "paid"
                              ? "bg-emerald-500/25 text-emerald-200"
                              : order.dealStatus === "sent"
                              ? "bg-amber-500/25 text-amber-200"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {order.dealStatus === "paid"
                            ? "LUNAS"
                            : order.dealStatus === "sent"
                            ? "DEMO"
                            : "DRAFT"}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteWorkOrder(order.id);
                          }}
                          title="Hapus proyek"
                          className="rounded-lg p-1 text-slate-500 hover:bg-rose-500/20 hover:text-rose-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* RIGHT: REAL DELIVERABLES VIEWER & REVENUE CLOSING */}
        <section className="space-y-4 rounded-2xl border border-cyan-500/25 bg-[#060d1f]/95 p-4 xl:col-span-7">
          {!activeOrder ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-6 text-center">
              <Rocket className="h-10 w-10 text-emerald-400" />
              <h3 className="mt-3 text-base font-bold text-white">
                Belum Ada Paket Produksi
              </h3>
              <p className="mt-1 max-w-md text-xs text-slate-400">
                Pilih salah satu contoh cepat di sebelah kiri (misal{" "}
                <strong className="text-amber-300">☕ Kafe / Kopi UMKM</strong>)
                lalu klik tombol{" "}
                <strong className="text-emerald-300">
                  Perintahkan 10 Karyawan Kerjakan Sekarang
                </strong>
                . Dalam 1 detik, Website HTML jadi, 7 Naskah Viral, Script
                WhatsApp/DM, dan Invoice langsung siap kamu jual!
              </p>
            </div>
          ) : (
            <>
              {/* Active Project Header + Deal/Revenue Controls */}
              <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/80 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white sm:text-base">
                      {activeOrder.input.businessName}
                    </h3>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                      ENGINE Rp 0 GRATIS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {activeOrder.input.niche} • {activeOrder.input.city} •
                    Dikerjakan 10 Karyawan
                  </p>
                </div>

                {/* Deal Status & Price Tracker */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center rounded-lg border border-slate-700 bg-slate-900 px-2 py-1">
                    <span className="text-[10px] font-bold text-slate-400">
                      Rp
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={50000}
                      value={activeOrder.dealValueIdr}
                      onChange={(e) =>
                        updateWorkOrderDeal(
                          activeOrder.id,
                          activeOrder.dealStatus,
                          Number(e.target.value)
                        )
                      }
                      className="w-24 bg-transparent pl-1 text-xs font-bold text-white outline-none"
                    />
                  </div>
                  <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-0.5">
                    {(
                      [
                        { id: "draft", label: "Draft" },
                        { id: "sent", label: "Demo" },
                        { id: "paid", label: "Lunas" },
                      ] as { id: WorkDealStatus; label: string }[]
                    ).map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() =>
                          updateWorkOrderDeal(
                            activeOrder.id,
                            st.id,
                            activeOrder.dealValueIdr
                          )
                        }
                        className={`rounded-md px-2 py-1 text-[10px] font-bold transition ${
                          activeOrder.dealStatus === st.id
                            ? st.id === "paid"
                              ? "bg-emerald-500 text-slate-950"
                              : st.id === "sent"
                              ? "bg-amber-400 text-slate-950"
                              : "bg-sky-500 text-slate-950"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4 Deliverable Output Tabs */}
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {(
                  [
                    { id: "website", label: "Website Jadi", icon: Globe },
                    { id: "scripts", label: "7 Naskah Viral", icon: Film },
                    {
                      id: "outreach",
                      label: "Script WA/DM",
                      icon: MessageCircle,
                    },
                    {
                      id: "invoice",
                      label: "Invoice & Cara Jual",
                      icon: FileText,
                    },
                  ] as const
                ).map((tab) => {
                  const Icon = tab.icon;
                  const active = outputTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setOutputTab(tab.id)}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-bold transition ${
                        active
                          ? "border-cyan-400 bg-cyan-500/20 text-cyan-100"
                          : "border-slate-800 bg-slate-950/70 text-slate-400 hover:text-white"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: REAL STANDALONE WEBSITE LIVE PREVIEW + DOWNLOAD */}
              {outputTab === "website" && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice("desktop")}
                        className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold ${
                          previewDevice === "desktop"
                            ? "bg-cyan-500/25 text-cyan-100"
                            : "text-slate-400"
                        }`}
                      >
                        <Monitor className="h-3 w-3" /> Desktop
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice("mobile")}
                        className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold ${
                          previewDevice === "mobile"
                            ? "bg-cyan-500/25 text-cyan-100"
                            : "text-slate-400"
                        }`}
                      >
                        <Smartphone className="h-3 w-3" /> HP
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          downloadHtmlFile(
                            `website-${activeOrder.input.businessName
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, "-")}.html`,
                            activeOrder.landingPageHtml
                          )
                        }
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-[11px] font-black text-slate-950 transition hover:brightness-110"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download .HTML
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy("html", activeOrder.landingPageHtml)
                        }
                        className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:border-cyan-400"
                      >
                        {copiedKey === "html" ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        {copiedKey === "html" ? "Tersalin!" : "Salin HTML"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          openHtmlInNewTab(activeOrder.landingPageHtml)
                        }
                        className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:border-cyan-400"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Full Tab
                      </button>
                    </div>
                  </div>

                  {/* Interactive Sandboxed Live Website Preview */}
                  <div className="flex justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-950 p-2">
                    <iframe
                      title={`Preview Website ${activeOrder.input.businessName}`}
                      srcDoc={activeOrder.landingPageHtml}
                      sandbox="allow-popups allow-popups-to-escape-sandbox"
                      className={`h-[440px] rounded-lg border border-slate-800 bg-white transition-all ${
                        previewDevice === "mobile" ? "w-[360px]" : "w-full"
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: 7 VIRAL SHORT-FORM VIDEO SCRIPTS */}
              {outputTab === "scripts" && (
                <div className="max-h-[480px] space-y-2.5 overflow-y-auto pr-1">
                  {activeOrder.contentScripts.map((script) => {
                    const fullText = `[HARI ${script.day} — ${script.title}]\nFormat: ${script.format}\nHook 3 Detik: ${script.hook3s}\nIsi Naskah: ${script.body}\nCTA: ${script.cta}\nHashtag: ${script.hashtags}`;
                    const key = `script-${script.day}`;
                    return (
                      <div
                        key={script.day}
                        className="rounded-xl border border-slate-800 bg-slate-950/85 p-3.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-bold text-sky-300">
                              HARI {script.day} · {script.format}
                            </span>
                            <h4 className="mt-1 text-xs font-bold text-white sm:text-sm">
                              {script.title}
                            </h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(key, fullText)}
                            className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-slate-200 hover:border-sky-400"
                          >
                            {copiedKey === key ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            {copiedKey === key ? "Tersalin" : "Salin"}
                          </button>
                        </div>
                        <div className="mt-2 space-y-1.5 text-xs">
                          <p className="text-amber-200">
                            <strong>Hook 3 Detik:</strong> {script.hook3s}
                          </p>
                          <p className="text-slate-300">
                            <strong>Isi:</strong> {script.body}
                          </p>
                          <p className="text-emerald-300">
                            <strong>CTA:</strong> {script.cta}
                          </p>
                          <p className="font-mono text-[11px] text-sky-400">
                            {script.hashtags}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 3: CLIENT OUTREACH SCRIPTS (WHATSAPP / IG DM / FOLLOW-UP) */}
              {outputTab === "outreach" && (
                <div className="space-y-3">
                  {activeOrder.outreachScripts.map((item, idx) => {
                    const key = `outreach-${idx}`;
                    const waDigits = activeOrder.input.whatsappNumber.replace(
                      /\D/g,
                      ""
                    );
                    const waClean = waDigits.startsWith("0")
                      ? `62${waDigits.slice(1)}`
                      : waDigits || "6281234567890";
                    return (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-800 bg-slate-950/85 p-3.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                              {item.channel}
                            </span>
                            <h4 className="mt-1 text-xs font-bold text-white">
                              {item.label}
                            </h4>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopy(key, item.message)}
                              className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-slate-200 hover:border-amber-400"
                            >
                              {copiedKey === key ? (
                                <Check className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                              {copiedKey === key ? "Tersalin" : "Salin Pesan"}
                            </button>
                            {item.channel !== "Instagram DM" && (
                              <a
                                href={`https://wa.me/${waClean}?text=${encodeURIComponent(
                                  item.message
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1 text-[10px] font-black text-slate-950 hover:brightness-110"
                              >
                                <MessageCircle className="h-3 w-3" />
                                Kirim WA
                              </a>
                            )}
                          </div>
                        </div>
                        <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-900/90 p-3 font-sans text-xs leading-relaxed text-slate-200">
                          {item.message}
                        </pre>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 4: PRINTABLE INVOICE + 10 STAFF CONTRIBUTIONS + FREE MONETIZATION PLAYBOOK */}
              {outputTab === "invoice" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <div>
                      <div className="text-xs font-bold text-white">
                        Invoice Penagihan Siap Kirim (HTML → Print PDF)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Nilai tagihan otomatis mengikuti nominal di atas (
                        {formatIdr(activeOrder.dealValueIdr)}).
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          downloadHtmlFile(
                            `invoice-${activeOrder.input.businessName
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, "-")}.html`,
                            activeOrder.invoiceHtml
                          )
                        }
                        className="flex items-center gap-1 rounded-xl bg-amber-400 px-3 py-1.5 text-[11px] font-black text-slate-950"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download Invoice
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          openHtmlInNewTab(activeOrder.invoiceHtml)
                        }
                        className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Buka / Cetak PDF
                      </button>
                    </div>
                  </div>

                  {/* Step-by-Step Zero Capital Playbook */}
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
                    <h4 className="flex items-center gap-1.5 text-xs font-black text-emerald-200">
                      <BadgeCheck className="h-4 w-4 text-emerald-400" />
                      Langkah Menghasilkan Uang Tanpa Modal (Rp 0)
                    </h4>
                    <ul className="mt-2 space-y-1.5 text-xs text-slate-200">
                      {activeOrder.monetizationPlaybook.map((step, i) => (
                        <li key={i} className="leading-relaxed">
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 10 Employees Contribution Ledger */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5">
                    <h4 className="text-xs font-bold text-white">
                      Kontribusi 10 Karyawan pada Paket Ini
                    </h4>
                    <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {activeOrder.assignedStaff.map((s) => (
                        <div
                          key={s.staffName}
                          className="rounded-lg border border-slate-800/90 bg-slate-900/70 px-2.5 py-1.5 text-[11px]"
                        >
                          <div className="font-bold text-cyan-200">
                            {s.staffName}{" "}
                            <span className="font-normal text-slate-400">
                              (L{s.floor} · {s.role})
                            </span>
                          </div>
                          <div className="text-slate-300">{s.outputLabel}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
