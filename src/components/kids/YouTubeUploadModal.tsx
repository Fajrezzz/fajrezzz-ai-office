"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  Loader2,
  PlayCircle,
  Rocket,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import type { KidsEpisode, VideoFormat } from "@/lib/kids-studio/episode-brain";
import {
  authorizeYouTubeUpload,
  getSavedYouTubeClientId,
  renderEpisodeToVideoBlob,
  saveYouTubeClientId,
  uploadEpisodeDirectlyToYouTube,
  type YouTubePrivacyStatus,
  type YouTubeUploadResult,
} from "@/lib/kids-studio/youtube-upload";

interface YouTubeUploadModalProps {
  open: boolean;
  onClose: () => void;
  episode: KidsEpisode;
  format: VideoFormat;
  onQuickUpload: () => Promise<void>;
  onUploadedSuccess: (episodeId: string) => void;
}

export function YouTubeUploadModal({
  open,
  onClose,
  episode,
  format,
  onQuickUpload,
  onUploadedSuccess,
}: YouTubeUploadModalProps) {
  const [clientId, setClientId] = useState("");
  const [privacy, setPrivacy] = useState<YouTubePrivacyStatus>("public");
  const [showGuide, setShowGuide] = useState(false);
  const [busyStep, setBusyStep] = useState<string | null>(null);
  const [renderPct, setRenderPct] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<YouTubeUploadResult | null>(null);

  useEffect(() => {
    if (open) {
      setClientId(getSavedYouTubeClientId());
      setErrorMsg(null);
      setResult(null);
      setBusyStep(null);
      setRenderPct(0);
    }
  }, [open]);

  if (!open) return null;

  const isKids = episode.themeId !== "ai_tech_tips";

  const handleAutoUpload = async () => {
    setErrorMsg(null);
    setResult(null);
    const trimmed = clientId.trim();
    if (!trimmed) {
      setErrorMsg(
        "Masukkan Google OAuth Client ID terlebih dahulu (klik Panduan 3 Menit di bawah), atau pakai Upload Cepat 1-Klik."
      );
      return;
    }

    try {
      saveYouTubeClientId(trimmed);
      setBusyStep("Meminta izin login Google (YouTube resmi)...");
      const accessToken = await authorizeYouTubeUpload(trimmed);

      setBusyStep("Merender video 60fps + musik bebas copyright...");
      const { blob } = await renderEpisodeToVideoBlob(
        episode,
        format,
        (pct) => setRenderPct(pct)
      );

      const uploadRes = await uploadEpisodeDirectlyToYouTube({
        accessToken,
        episode,
        videoBlob: blob,
        privacyStatus: privacy,
        onStatus: (msg) => setBusyStep(msg),
      });

      setResult(uploadRes);
      onUploadedSuccess(episode.id);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Terjadi kendala saat upload ke YouTube."
      );
    } finally {
      setBusyStep(null);
    }
  };

  const handleQuickStudio = async () => {
    setErrorMsg(null);
    try {
      setBusyStep("Menyiapkan video, thumbnail & membuka YouTube Studio...");
      await onQuickUpload();
      onUploadedSuccess(episode.id);
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal menyiapkan file upload."
      );
    } finally {
      setBusyStep(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-5 text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg">
              <PlayCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Upload ke YouTube (100% Gratis Rp 0)
              </h3>
              <p className="text-xs text-slate-400">
                Ep #{episode.episodeNumber} ·{" "}
                {format === "shorts" ? "YouTube Shorts 9:16" : "YouTube 16:9"} ·{" "}
                {isKids ? "Made for Kids: YA" : "Kategori: Tech/AI"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(busyStep)}
            className="rounded-xl border border-slate-700 p-2 text-slate-400 hover:text-white disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Success Result */}
        {result && (
          <div className="mt-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 p-4">
            <div className="flex items-center gap-2 text-sm font-black text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
              <span>BERHASIL TERUPLOAD KE YOUTUBE!</span>
            </div>
            <p className="mt-1 text-xs text-slate-200">
              Video ID: <span className="font-mono font-bold">{result.videoId}</span>{" "}
              {result.thumbnailUploaded
                ? "• Thumbnail HD ikut terpasang!"
                : "• Thumbnail bisa dipasang di YouTube Studio."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={result.watchUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-black text-slate-950"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Tonton di YouTube
              </a>
              <a
                href={result.studioUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-600 bg-slate-800 px-3.5 py-2 text-xs font-bold text-white"
              >
                Buka YouTube Studio
              </a>
            </div>
          </div>
        )}

        {/* Option 1: Instant 1-Click without Google Cloud setup */}
        <div className="mt-4 rounded-2xl border border-amber-400/35 bg-amber-500/10 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black tracking-wide text-amber-300 uppercase">
              Cara 1 — Paling Cepat (Tanpa Setup)
            </span>
            <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-200">
              Siap Langsung Pakai
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-300">
            Otomatis download video + thumbnail HD + salin Judul &amp; Deskripsi,
            lalu langsung buka YouTube Studio.
          </p>
          <button
            type="button"
            disabled={Boolean(busyStep)}
            onClick={handleQuickStudio}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 text-xs font-black text-slate-950 transition hover:bg-amber-300 disabled:opacity-50"
          >
            <Rocket className="h-4 w-4" />
            Siapkan Semua File &amp; Buka YouTube Studio
          </button>
        </div>

        {/* Option 2: True Direct Auto-Upload via YouTube Data API v3 (Free Rp 0) */}
        <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black tracking-wide text-sky-300 uppercase">
              Cara 2 — Upload Otomatis Langsung (YouTube API v3 · Rp 0)
            </span>
            <button
              type="button"
              onClick={() => setShowGuide((g) => !g)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-300 hover:underline"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              {showGuide ? "Tutup Panduan" : "Panduan 3 Menit"}
            </button>
          </div>

          {showGuide && (
            <ol className="mt-2.5 space-y-1.5 rounded-xl border border-sky-500/25 bg-sky-500/10 p-3 text-[11px] leading-relaxed text-slate-200">
              <li>
                <strong>1.</strong> Buka{" "}
                <span className="font-mono text-sky-300">
                  console.cloud.google.com
                </span>{" "}
                (100% gratis tanpa kartu kredit) → buat Project baru.
              </li>
              <li>
                <strong>2.</strong> Menu <strong>APIs &amp; Services → Library</strong>{" "}
                → cari &amp; aktifkan <strong>YouTube Data API v3</strong>{" "}
                (kuota gratis 10.000 unit/hari = ~6 video/hari).
              </li>
              <li>
                <strong>3.</strong> Menu <strong>Credentials → Create Credentials → OAuth Client ID → Web Application</strong>{" "}
                → masukkan alamat web ini di <em>Authorized JavaScript origins</em>.
              </li>
              <li>
                <strong>4.</strong> Salin <strong>Client ID</strong> (akhiran{" "}
                <span className="font-mono">.apps.googleusercontent.com</span>) dan tempel di bawah!
              </li>
            </ol>
          )}

          <div className="mt-3 space-y-2.5">
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-400">
                Google OAuth Client ID (disimpan aman di browser kamu saja)
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="1234567890-xxxx.apps.googleusercontent.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400">
                Visibilitas:
              </span>
              {(["public", "unlisted", "private"] as YouTubePrivacyStatus[]).map(
                (p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPrivacy(p)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize ${
                      privacy === p
                        ? "bg-sky-500 text-slate-950"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {p === "public"
                      ? "Publik"
                      : p === "unlisted"
                      ? "Tidak Publik"
                      : "Pribadi"}
                  </button>
                )
              )}
            </div>

            <button
              type="button"
              disabled={Boolean(busyStep)}
              onClick={handleAutoUpload}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-xs font-black text-white transition hover:bg-red-500 disabled:opacity-50"
            >
              {busyStep ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    {busyStep} {renderPct > 0 && renderPct < 100 ? `(${renderPct}%)` : ""}
                  </span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  <span>Login Google &amp; Upload Otomatis ke YouTube</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span>
                Login aman langsung lewat layar resmi Google. Password akun kamu
                tidak pernah dilihat atau disimpan web ini.
              </span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 rounded-2xl border border-rose-500/40 bg-rose-500/15 px-3.5 py-2.5 text-xs text-rose-200">
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
}
