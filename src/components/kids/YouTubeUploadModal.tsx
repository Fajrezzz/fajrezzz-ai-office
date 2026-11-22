"use client";

import React, { useState } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  ImageDown,
  Lock,
  ShieldCheck,
  X,
} from "lucide-react";
import { hasBossOriginalElement, type RealEpisode } from "@/types/pipeline";

interface YouTubeUploadModalProps {
  open: boolean;
  onClose: () => void;
  episode: RealEpisode;
  videoBlobUrl?: string;
  onConfirmManualUpload: (youtubeUrl: string) => void;
}

/**
 * Strictly MANUAL YouTube Publish Handoff Modal.
 * Auto-upload is intentionally disabled per YouTube anti-mass-upload policy.
 * Publish actions stay locked unless QC passed AND Bos provided >= 1 original element + ACC.
 */
export function YouTubeUploadModal({
  open,
  onClose,
  episode,
  videoBlobUrl,
  onConfirmManualUpload,
}: YouTubeUploadModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [youtubeUrlInput, setYoutubeUrlInput] = useState(
    episode.metrics.youtubeUrl || ""
  );
  const [savedNotice, setSavedNotice] = useState(false);

  if (!open) return null;

  const seo = episode.divisions.seo.output;
  const editing = episode.divisions.editing.output;
  const qc = episode.divisions.qc.output;
  const hasOriginal = hasBossOriginalElement(episode.bossOriginality);
  const canPublish =
    Boolean(qc?.passed) &&
    hasOriginal &&
    Boolean(episode.bossOriginality.confirmedByBoss);

  const copyText = (key: string, value: string) => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1500);
  };

  const fullMetadata = seo
    ? `${seo.title}\n\n${seo.description}\n\n${seo.hashtags.join(" ")}\n\nTags:\n${seo.tags.join(
        ", "
      )}`
    : "";

  const handleSaveManualUrl = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmManualUpload(youtubeUrlInput.trim());
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-950 p-5 text-slate-100 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-white">
              📤 Paket Upload Manual ke YouTube Studio
            </h3>
            <p className="text-xs text-slate-400">
              Tidak ada auto-upload. Bos memeriksa sendiri lalu upload manual di
              YouTube Studio agar aman dari penolakan monetisasi konten massal.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-xl border border-slate-700 p-2 text-slate-300 hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!canPublish ? (
          <div className="mt-4 rounded-2xl border border-rose-500/50 bg-rose-950/35 p-4 text-xs text-rose-100">
            <div className="flex items-center gap-2 font-black text-rose-200">
              <Lock className="h-4 w-4" />
              <span>Publish Terkunci — Syarat Orisinalitas / QC Belum Terpenuhi</span>
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-rose-100/90">
              {!qc?.passed && (
                <li>Divisi QC harus LOLOS terlebih dahulu (bebas kata terlarang &amp; kemiripan &lt; 45%).</li>
              )}
              {!hasOriginal && (
                <li>
                  Bos wajib mengisi minimal 1 elemen orisinal (ide, twist, dialog suara,
                  atau karakter baru).
                </li>
              )}
              {!episode.bossOriginality.confirmedByBoss && (
                <li>Bos wajib mencentang persetujuan ACC Orisinalitas.</li>
              )}
            </ul>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-bold text-emerald-200">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>
                QC Lolos ({qc?.score}/100) + Kontribusi Orisinal Bos Terverifikasi!
              </span>
            </div>

            {/* Step 1: Download Video & Thumbnail HD */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3.5">
              <div className="text-xs font-black text-white">
                Langkah 1 — Unduh File Video &amp; Thumbnail HD
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {videoBlobUrl && editing ? (
                  <a
                    href={videoBlobUrl}
                    download={editing.fileName}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-emerald-400 px-3.5 py-2 text-xs font-black text-slate-950 hover:bg-emerald-300"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Video ({editing.videoDurationSec}d)</span>
                  </a>
                ) : (
                  <span className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
                    Jalankan Divisi 6 (Editing) dulu untuk mengunduh file video.
                  </span>
                )}

                {editing?.thumbnailDataUrl && (
                  <a
                    href={editing.thumbnailDataUrl}
                    download={`thumbnail-ep-${episode.episodeNumber}.png`}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-cyan-400/50 bg-cyan-500/20 px-3.5 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-500/30"
                  >
                    <ImageDown className="h-4 w-4" />
                    <span>Download Thumbnail 1280×720</span>
                  </a>
                )}
              </div>
            </div>

            {/* Step 2: Copy SEO Metadata */}
            {seo && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-black text-white">
                    Langkah 2 — Salin Judul, Deskripsi &amp; Tag
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText("all", fullMetadata)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-[11px] font-bold text-cyan-200 hover:border-cyan-400"
                  >
                    {copiedKey === "all" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>{copiedKey === "all" ? "Disalin!" : "Salin Semua"}</span>
                  </button>
                </div>
                <div className="mt-2 rounded-xl bg-slate-950 p-2.5 text-[11px] text-slate-300">
                  <div className="font-bold text-white">{seo.title}</div>
                  <div className="mt-1 line-clamp-3">{seo.description}</div>
                  <div className="mt-1 text-cyan-300">
                    {seo.hashtags.join(" ")}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Manual Upload to YouTube Studio + Record Real Link */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3.5">
              <div className="text-xs font-black text-white">
                Langkah 3 — Upload Manual di YouTube Studio &amp; Catat Link
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <a
                  href="https://studio.youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-rose-500 px-4 py-2 text-xs font-black text-white hover:bg-rose-400"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Buka YouTube Studio (Manual)</span>
                </a>
              </div>

              <form onSubmit={handleSaveManualUrl} className="mt-3 space-y-2">
                <label className="block text-[11px] font-semibold text-slate-300">
                  Tempel Link Video YouTube setelah Bos selesai upload manual:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={youtubeUrlInput}
                    onChange={(e) => setYoutubeUrlInput(e.target.value)}
                    placeholder="https://youtube.com/shorts/..."
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="inline-flex min-h-[40px] items-center gap-1 rounded-xl bg-amber-400 px-3.5 text-xs font-black text-slate-950 hover:bg-amber-300"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Simpan Link</span>
                  </button>
                </div>
                {savedNotice && (
                  <div className="text-[11px] font-bold text-emerald-300">
                    ✅ Link YouTube tersimpan ke Dashboard Hasil Nyata!
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
