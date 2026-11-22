"use client";

import type { KidsEpisode, VideoFormat } from "@/lib/kids-studio/episode-brain";
import {
  renderCartoonFrame,
  renderKidsThumbnail,
  startKidsMelody,
} from "@/lib/kids-studio/cartoon-renderer";

export type YouTubePrivacyStatus = "public" | "unlisted" | "private";

export const YT_CLIENT_ID_STORAGE_KEY = "fajrezzz_yt_oauth_client_id_v1";

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleTokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
}

interface GoogleAccountsOAuth2 {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (response: GoogleTokenResponse) => void;
    error_callback?: (err: { type?: string; message?: string }) => void;
  }) => GoogleTokenClient;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: GoogleAccountsOAuth2;
      };
    };
  }
}

export function getSavedYouTubeClientId(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(YT_CLIENT_ID_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function saveYouTubeClientId(clientId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(YT_CLIENT_ID_STORAGE_KEY, clientId.trim());
  } catch {
    // Ignore storage errors
  }
}

/** Dynamically load Google Identity Services (gsi/client) in the user's browser */
export function loadGoogleIdentityScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Browser tidak tersedia."));
      return;
    }
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () =>
          reject(
            new Error(
              "Gagal memuat Google Login. Pastikan browser kamu punya koneksi internet ke accounts.google.com."
            )
          ),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(
        new Error(
          "Gagal memuat Google Login. Pastikan browser kamu terhubung internet normal."
        )
      );
    document.head.appendChild(script);
  });
}

/** Prompt the channel owner to securely authorize YouTube upload via Google OAuth */
export async function authorizeYouTubeUpload(clientId: string): Promise<string> {
  const trimmed = clientId.trim();
  if (!trimmed) {
    throw new Error("Masukkan Google OAuth Client ID terlebih dahulu.");
  }

  await loadGoogleIdentityScript();

  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) {
    throw new Error("Google OAuth belum siap di browser.");
  }

  return new Promise<string>((resolve, reject) => {
    const tokenClient = oauth2.initTokenClient({
      client_id: trimmed,
      scope: "https://www.googleapis.com/auth/youtube.upload",
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          reject(
            new Error(
              resp.error_description ||
                resp.error ||
                "Login Google dibatalkan atau ditolak."
            )
          );
          return;
        }
        resolve(resp.access_token);
      },
      error_callback: (err) => {
        reject(
          new Error(
            err.message ||
              "Popup Google Login terblokir atau dibatalkan oleh browser."
          )
        );
      },
    });
    tokenClient.requestAccessToken({ prompt: "consent" });
  });
}

/** Render an episode offscreen into a real video Blob (with copyright-free melody) */
export async function renderEpisodeToVideoBlob(
  episode: KidsEpisode,
  format: VideoFormat,
  onProgress?: (pct: number) => void
): Promise<{ blob: Blob; ext: "mp4" | "webm"; mimeType: string }> {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    throw new Error("Browser ini belum mendukung rekaman video MediaRecorder.");
  }

  const width = format === "shorts" ? 720 : 1280;
  const height = format === "shorts" ? 1280 : 720;
  const totalSec = episode.scenes.reduce((acc, s) => acc + s.durationSec, 0);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak dapat diinisialisasi.");

  const videoStream = canvas.captureStream(30);
  const { audioStream, stop: stopMelody } = startKidsMelody(false);

  const combined = new MediaStream();
  videoStream.getVideoTracks().forEach((t) => combined.addTrack(t));
  if (audioStream) {
    audioStream.getAudioTracks().forEach((t) => combined.addTrack(t));
  }

  const preferredMimes = [
    "video/mp4;codecs=avc1,mp4a.40.2",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  const mimeType =
    preferredMimes.find((m) => MediaRecorder.isTypeSupported(m)) || "video/webm";

  return new Promise((resolve, reject) => {
    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(combined, {
      mimeType,
      videoBitsPerSecond: 3_000_000,
    });

    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunks.push(ev.data);
    };

    recorder.onerror = () => {
      stopMelody();
      reject(new Error("Gagal merekam video animasi."));
    };

    recorder.onstop = () => {
      stopMelody();
      const blob = new Blob(chunks, { type: mimeType });
      const ext: "mp4" | "webm" = mimeType.includes("mp4") ? "mp4" : "webm";
      onProgress?.(100);
      resolve({ blob, ext, mimeType });
    };

    recorder.start(250);
    const startMs = performance.now();

    const step = (now: number) => {
      const elapsed = (now - startMs) / 1000;
      const pct = Math.min(99, Math.round((elapsed / totalSec) * 100));
      onProgress?.(pct);

      if (elapsed >= totalSec) {
        renderCartoonFrame(ctx, width, height, episode, totalSec - 0.01);
        recorder.stop();
        return;
      }
      renderCartoonFrame(ctx, width, height, episode, elapsed);
      window.requestAnimationFrame(step);
    };

    window.requestAnimationFrame(step);
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, b64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/png";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export interface YouTubeUploadResult {
  videoId: string;
  watchUrl: string;
  studioUrl: string;
  thumbnailUploaded: boolean;
}

/** Upload video + metadata + optional HD thumbnail directly to YouTube via Data API v3 */
export async function uploadEpisodeDirectlyToYouTube(params: {
  accessToken: string;
  episode: KidsEpisode;
  videoBlob: Blob;
  privacyStatus: YouTubePrivacyStatus;
  onStatus?: (msg: string) => void;
}): Promise<YouTubeUploadResult> {
  const { accessToken, episode, videoBlob, privacyStatus, onStatus } = params;
  const isKids = episode.themeId !== "ai_tech_tips";
  const cleanTags = episode.tags
    .split(/\s+/)
    .map((t) => t.replace(/^#/, "").trim())
    .filter(Boolean)
    .slice(0, 15);

  const metadata = {
    snippet: {
      title: episode.title.slice(0, 100),
      description: episode.description.slice(0, 4900),
      tags: cleanTags,
      categoryId: isKids ? "1" : "28", // 1 = Film & Animation, 28 = Science & Tech
      defaultLanguage: "id",
    },
    status: {
      privacyStatus,
      selfDeclaredMadeForKids: isKids,
    },
  };

  onStatus?.("Membuat sesi upload ke YouTube...");
  const initRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Length": String(videoBlob.size),
        "X-Upload-Content-Type": videoBlob.type || "video/webm",
      },
      body: JSON.stringify(metadata),
    }
  );

  if (!initRes.ok) {
    const errText = await initRes.text().catch(() => "");
    throw new Error(
      `YouTube API menolak sesi upload (${initRes.status}). ${errText.slice(0, 180)}`
    );
  }

  const uploadUrl = initRes.headers.get("Location");
  if (!uploadUrl) {
    throw new Error("YouTube tidak mengembalikan URL upload resumable.");
  }

  onStatus?.("Mengirim file video ke server YouTube...");
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": videoBlob.type || "video/webm",
    },
    body: videoBlob,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text().catch(() => "");
    throw new Error(
      `Upload video gagal (${uploadRes.status}). ${errText.slice(0, 180)}`
    );
  }

  const uploadedData = (await uploadRes.json()) as { id?: string };
  const videoId = uploadedData.id;
  if (!videoId) {
    throw new Error("Upload selesai namun ID video YouTube tidak ditemukan.");
  }

  // Try uploading custom HD Thumbnail (succeeds on phone-verified YouTube channels)
  let thumbnailUploaded = false;
  try {
    onStatus?.("Mengupload Thumbnail HD 1280×720...");
    const thumbDataUrl = renderKidsThumbnail(episode);
    const thumbBlob = dataUrlToBlob(thumbDataUrl);
    const thumbRes = await fetch(
      `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${encodeURIComponent(
        videoId
      )}&uploadType=media`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "image/png",
        },
        body: thumbBlob,
      }
    );
    thumbnailUploaded = thumbRes.ok;
  } catch {
    thumbnailUploaded = false;
  }

  return {
    videoId,
    watchUrl: `https://youtu.be/${videoId}`,
    studioUrl: `https://studio.youtube.com/video/${videoId}/edit`,
    thumbnailUploaded,
  };
}
