"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  buildEpisodeFromSelectedIdea,
  generateAutonomousKidsEpisode,
  generateIdeaOptionsFromBrief,
  type ContentIdeaOption,
  type KidsEpisode,
  type PublishPlatform,
} from "@/lib/kids-studio/episode-brain";
import { useOffice } from "@/store/OfficeContext";

export type AgencyDivisionKey =
  | "director"
  | "research"
  | "seo"
  | "script"
  | "voice"
  | "motion"
  | "qc";

export type DivisionStepStatus = "waiting" | "working" | "done" | "break";

export type AgencyJobStage =
  | "idle"
  | "briefing"
  | "waiting_idea"
  | "scripting"
  | "waiting_script"
  | "producing"
  | "ready";

export interface TeamChatMessage {
  id: string;
  time: string;
  senderName: string;
  division: string;
  avatarColor: string;
  text: string;
  kind: "boss" | "work" | "report" | "break";
}

export interface AgencyJob {
  id: string;
  brief: string;
  platform: PublishPlatform;
  stage: AgencyJobStage;
  activeStepLabel: string;
  progressPercent: number;
  divisionStatus: Record<AgencyDivisionKey, DivisionStepStatus>;
  ideas: ContentIdeaOption[];
  selectedIdea: ContentIdeaOption | null;
  draftEpisode: KidsEpisode | null;
  finalEpisodeId: string | null;
}

export const AGENCY_DIVISIONS: {
  key: AgencyDivisionKey;
  label: string;
  shortLabel: string;
  staffId: string;
  staffName: string;
  workWaypointId: string;
  color: string;
}[] = [
  {
    key: "director",
    label: "Direktur Konten",
    shortLabel: "Direktur",
    staffId: "staff-09",
    staffName: "Reza",
    workWaypointId: "wp-l3-boardroom",
    color: "#eab308",
  },
  {
    key: "research",
    label: "Tim Riset",
    shortLabel: "Riset",
    staffId: "staff-01",
    staffName: "Raka",
    workWaypointId: "wp-ws-01",
    color: "#0ea5e9",
  },
  {
    key: "seo",
    label: "Tim SEO",
    shortLabel: "SEO",
    staffId: "staff-02",
    staffName: "Nadia",
    workWaypointId: "wp-ws-02",
    color: "#10b981",
  },
  {
    key: "script",
    label: "Penulis Naskah",
    shortLabel: "Naskah",
    staffId: "staff-03",
    staffName: "Dimas",
    workWaypointId: "wp-ws-03",
    color: "#f59e0b",
  },
  {
    key: "voice",
    label: "Studio Suara",
    shortLabel: "Suara",
    staffId: "staff-05",
    staffName: "Bima",
    workWaypointId: "wp-ws-05",
    color: "#6366f1",
  },
  {
    key: "motion",
    label: "Motion & Editing",
    shortLabel: "Motion",
    staffId: "staff-04",
    staffName: "Clara & Salsa",
    workWaypointId: "wp-ws-04",
    color: "#ec4899",
  },
  {
    key: "qc",
    label: "Tim QC & Publish",
    shortLabel: "QC",
    staffId: "staff-07",
    staffName: "Fajar & Alya",
    workWaypointId: "wp-ws-07",
    color: "#f97316",
  },
];

const EPISODES_STORAGE_KEY = "fajrezzz_kids_episodes_v1";

function nowClock(): string {
  return new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function defaultDivisionStatus(): Record<AgencyDivisionKey, DivisionStepStatus> {
  return {
    director: "waiting",
    research: "waiting",
    seo: "waiting",
    script: "waiting",
    voice: "waiting",
    motion: "waiting",
    qc: "waiting",
  };
}

const INITIAL_CHAT: TeamChatMessage[] = [
  {
    id: "chat-init-1",
    time: nowClock(),
    senderName: "Reza Mahendra",
    division: "Direktur Konten",
    avatarColor: "#eab308",
    text: "Selamat datang Bos FAJREZ! Semua divisi (Riset, SEO, Naskah, Suara, Motion, Editing, QC) standby. Ketik aja 1 tugas dari HP, aku langsung bagi kerjaan ke tiap ruangan!",
    kind: "report",
  },
  {
    id: "chat-init-2",
    time: nowClock(),
    senderName: "Dimas Wijaya",
    division: "Penulis Naskah",
    avatarColor: "#f59e0b",
    text: "☕ Lagi ngopi dulu sebentar di Espresso Lounge L2 sambil nunggu brief baru dari Bos!",
    kind: "break",
  },
  {
    id: "chat-init-3",
    time: nowClock(),
    senderName: "Bima Kusuma",
    division: "Studio Suara",
    avatarColor: "#6366f1",
    text: "🎮 Santai bentar main game di Balcony L2, nanti pas naskah disetujui langsung gas mixing audio!",
    kind: "break",
  },
];

interface AgencyContextValue {
  job: AgencyJob;
  teamChat: TeamChatMessage[];
  episodes: KidsEpisode[];
  selectedEpisodeId: string;
  setSelectedEpisodeId: (id: string) => void;
  autoApproveMode: boolean;
  setAutoApproveMode: (auto: boolean) => void;
  submitBossBrief: (brief: string, platform: PublishPlatform) => void;
  selectIdeaOption: (ideaId: string) => void;
  updateDraftFields: (patch: { title?: string; hook3s?: string; thumbnailHeadline?: string }) => void;
  approveScriptAndProduce: () => void;
  markEpisodeUploaded: (episodeId: string, uploaded?: boolean) => void;
  deleteEpisode: (episodeId: string) => void;
}

const AgencyContext = createContext<AgencyContextValue | null>(null);

export function AgencyProvider({ children }: { children: React.ReactNode }) {
  const { sendAgentToWaypoint, setAgentStatus, addActivity } = useOffice();

  const [episodes, setEpisodes] = useState<KidsEpisode[]>(() => [
    generateAutonomousKidsEpisode(1, "rescue_trucks", true),
  ]);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>("");
  const [autoApproveMode, setAutoApproveMode] = useState<boolean>(false);
  const [teamChat, setTeamChat] = useState<TeamChatMessage[]>(INITIAL_CHAT);
  const [job, setJob] = useState<AgencyJob>({
    id: "job-idle",
    brief: "",
    platform: "youtube_shorts",
    stage: "idle",
    activeStepLabel: "Standby menunggu perintah Bos",
    progressPercent: 0,
    divisionStatus: defaultDivisionStatus(),
    ideas: [],
    selectedIdea: null,
    draftEpisode: null,
    finalEpisodeId: null,
  });

  const timersRef = useRef<number[]>([]);
  const autoApproveRef = useRef(autoApproveMode);
  autoApproveRef.current = autoApproveMode;

  const episodesRef = useRef(episodes);
  episodesRef.current = episodes;

  const clearScheduledTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    return () => clearScheduledTimers();
  }, [clearScheduledTimers]);

  // Hydrate saved episodes from localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(EPISODES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as KidsEpisode[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEpisodes(parsed);
          setSelectedEpisodeId(parsed[0].id);
          return;
        }
      }
    } catch {
      // Ignore storage error
    }
    setSelectedEpisodeId((prev) => prev || episodesRef.current[0]?.id || "");
  }, []);

  // Persist episodes
  useEffect(() => {
    try {
      window.localStorage.setItem(
        EPISODES_STORAGE_KEY,
        JSON.stringify(episodes.slice(0, 20))
      );
    } catch {
      // Ignore quota error
    }
  }, [episodes]);

  const pushChat = useCallback(
    (
      senderName: string,
      division: string,
      avatarColor: string,
      text: string,
      kind: TeamChatMessage["kind"]
    ) => {
      setTeamChat((prev) => [
        {
          id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          time: nowClock(),
          senderName,
          division,
          avatarColor,
          text,
          kind,
        },
        ...prev.slice(0, 35),
      ]);
    },
    []
  );

  // Move specific 3D office staff to desks (working) and send others to coffee/game breaks
  const orchestrateOfficeStaff = useCallback(
    (workingStaff: string[], coffeeBreakStaff: string[], gameBreakStaff: string[]) => {
      const deskMap: Record<string, string> = {
        "staff-01": "wp-ws-01",
        "staff-02": "wp-ws-02",
        "staff-03": "wp-ws-03",
        "staff-04": "wp-ws-04",
        "staff-05": "wp-ws-05",
        "staff-06": "wp-ws-06",
        "staff-07": "wp-ws-07",
        "staff-08": "wp-ws-08",
        "staff-09": "wp-l3-boardroom",
        "staff-10": "wp-l1-reception",
      };

      workingStaff.forEach((id) => {
        const wp = deskMap[id];
        if (wp) sendAgentToWaypoint(id, wp);
        setAgentStatus(id, "working");
      });

      coffeeBreakStaff.forEach((id) => {
        if (id === "staff-09") {
          sendAgentToWaypoint(id, "wp-l3-lounge");
        } else if (id === "staff-10") {
          sendAgentToWaypoint(id, "wp-pool-deck");
        } else {
          sendAgentToWaypoint(id, "wp-l2-lounge");
        }
      });

      gameBreakStaff.forEach((id) => {
        if (id === "staff-09") {
          sendAgentToWaypoint(id, "wp-l3-balcony");
        } else if (id === "staff-10") {
          sendAgentToWaypoint(id, "wp-supercar-bay");
        } else {
          sendAgentToWaypoint(id, "wp-l2-promenade");
        }
      });
    },
    [sendAgentToWaypoint, setAgentStatus]
  );

  const runFinalProduction = useCallback(
    (draftEpisode: KidsEpisode) => {
      clearScheduledTimers();

      // Step A: Studio Suara (Bima) works!
      orchestrateOfficeStaff(
        ["staff-05", "staff-09"],
        ["staff-01", "staff-03"],
        ["staff-02", "staff-10"]
      );
      setJob((prev) => ({
        ...prev,
        stage: "producing",
        activeStepLabel: "Studio Suara meracik musik bebas copyright & audio...",
        progressPercent: 64,
        divisionStatus: {
          director: "done",
          research: "done",
          seo: "done",
          script: "done",
          voice: "working",
          motion: "waiting",
          qc: "waiting",
        },
      }));
      pushChat(
        "Bima Kusuma",
        "Studio Suara",
        "#6366f1",
        "Naskah disetujui Bos! Aku stop main game & langsung racik musik bebas copyright + tempo narasi 5 adegan!",
        "work"
      );
      pushChat(
        "Dimas Wijaya",
        "Penulis Naskah",
        "#f59e0b",
        "☕ Naskah sudah approved! Izin istirahat ngopi dulu di Espresso Lounge ya tim.",
        "break"
      );
      addActivity(
        "Bima (Studio Suara)",
        "robot-placeholder",
        `Memproduksi musik & audio untuk "${draftEpisode.thumbnailHeadline}"`,
        "info",
        "L2 • Studio Suara"
      );

      // Step B: Motion & Editing (Clara & Salsa)
      schedule(() => {
        orchestrateOfficeStaff(
          ["staff-04", "staff-06"],
          ["staff-05", "staff-01"],
          ["staff-03", "staff-02"]
        );
        setJob((prev) => ({
          ...prev,
          activeStepLabel: "Tim Motion & Editing render animasi 60fps + Thumbnail HD...",
          progressPercent: 82,
          divisionStatus: {
            director: "done",
            research: "done",
            seo: "done",
            script: "done",
            voice: "done",
            motion: "working",
            qc: "waiting",
          },
        }));
        pushChat(
          "Clara Santoso",
          "Tim Motion & Animasi",
          "#ec4899",
          "Audio masuk! Aku & Salsa lagi render visual 60fps + Thumbnail HD 1280×720 biar CTR tinggi!",
          "work"
        );
        addActivity(
          "Clara & Salsa (Motion/Editing)",
          "robot-placeholder",
          "Merender animasi 60fps & subtitle 5 adegan",
          "info",
          "L2 • Motion Studio"
        );
      }, 1900);

      // Step C: Tim QC & Publishing (Fajar & Alya)
      schedule(() => {
        orchestrateOfficeStaff(
          ["staff-07", "staff-08"],
          ["staff-04", "staff-06"],
          ["staff-05", "staff-03"]
        );
        setJob((prev) => ({
          ...prev,
          activeStepLabel: "Tim QC mengecek hook 3 detik, audio & standar aman...",
          progressPercent: 94,
          divisionStatus: {
            director: "done",
            research: "done",
            seo: "done",
            script: "done",
            voice: "done",
            motion: "done",
            qc: "working",
          },
        }));
        pushChat(
          "Fajar Nugroho",
          "Tim QC",
          "#f97316",
          "Lagi cek final QC: hook 3 detik, warna, audio bebas copyright & status aman YouTube/TikTok...",
          "work"
        );
      }, 3800);

      // Step D: READY TO POST!
      schedule(() => {
        orchestrateOfficeStaff(
          ["staff-08", "staff-09"],
          ["staff-01", "staff-04", "staff-07"],
          ["staff-02", "staff-05", "staff-06"]
        );

        setEpisodes((prev) => [draftEpisode, ...prev].slice(0, 20));
        setSelectedEpisodeId(draftEpisode.id);

        setJob((prev) => ({
          ...prev,
          stage: "ready",
          activeStepLabel: "✅ LOLOS QC 100%! Konten siap posting ke YouTube / TikTok!",
          progressPercent: 100,
          finalEpisodeId: draftEpisode.id,
          divisionStatus: {
            director: "done",
            research: "done",
            seo: "done",
            script: "done",
            voice: "done",
            motion: "done",
            qc: "done",
          },
        }));

        pushChat(
          "Alya Ramadhani",
          "Publishing & QC",
          "#8b5cf6",
          `✅ BERES BOS! Episode #${draftEpisode.episodeNumber} "${draftEpisode.title}" lolos QC 100%! Video, musik, thumbnail HD & SEO sudah masuk panel — tinggal Download atau Upload ke YouTube!`,
          "report"
        );
        addActivity(
          "Tim FAJREZZZ AI",
          "system",
          `Konten siap posting: "${draftEpisode.title}"`,
          "success",
          "Panel Laporan Bos"
        );
      }, 5400);
    },
    [addActivity, clearScheduledTimers, orchestrateOfficeStaff, pushChat, schedule]
  );

  const selectIdeaOption = useCallback(
    (ideaId: string) => {
      clearScheduledTimers();

      setJob((prev) => {
        const chosen = prev.ideas.find((i) => i.id === ideaId) ?? prev.ideas[0];
        if (!chosen) return prev;

        const nextEpNum = (episodesRef.current[0]?.episodeNumber ?? 0) + 1;
        const draft = buildEpisodeFromSelectedIdea(
          chosen,
          prev.brief,
          nextEpNum,
          autoApproveRef.current
        );

        pushChat(
          "BOS FAJREZ",
          "Owner",
          "#fbbf24",
          `Aku pilih ide: "${chosen.title}". Lanjut tulis naskahnya!`,
          "boss"
        );

        orchestrateOfficeStaff(
          ["staff-03", "staff-02"],
          ["staff-01", "staff-04"],
          ["staff-05", "staff-07"]
        );

        pushChat(
          "Dimas Wijaya",
          "Penulis Naskah",
          "#f59e0b",
          "Siap Bos! Aku langsung balik ke meja WS-03 buat nulis naskah 5 adegan + hook 3 detik yang nendang!",
          "work"
        );
        pushChat(
          "Raka Pratama",
          "Tim Riset",
          "#0ea5e9",
          "☕ Riset kelar! Aku ngopi sebentar di Espresso Lounge L2 ya!",
          "break"
        );

        schedule(() => {
          setJob((cur) => ({
            ...cur,
            stage: "waiting_script",
            activeStepLabel:
              "Laporan Naskah masuk! Bos tinggal klik Setujui Naskah.",
            progressPercent: 52,
            draftEpisode: draft,
            divisionStatus: {
              ...cur.divisionStatus,
              seo: "done",
              script: "done",
            },
          }));

          pushChat(
            "Dimas Wijaya",
            "Penulis Naskah",
            "#f59e0b",
            `📄 Laporan naskah 5 adegan + SEO masuk panel Bos! Silakan baca & klik "Setujui Naskah", sisanya tim Suara, Motion, Editing & QC yang jalan!`,
            "report"
          );

          if (autoApproveRef.current) {
            schedule(() => {
              pushChat(
                "Reza Mahendra",
                "Direktur Konten",
                "#eab308",
                "⚡ Mode Autopilot aktif — naskah otomatis disetujui! Tim Suara & Motion langsung produksi!",
                "work"
              );
              runFinalProduction(draft);
            }, 1500);
          }
        }, 1800);

        return {
          ...prev,
          stage: "scripting",
          selectedIdea: chosen,
          draftEpisode: draft,
          activeStepLabel: "Penulis Naskah & SEO menyusun skrip 5 adegan...",
          progressPercent: 40,
          divisionStatus: {
            ...prev.divisionStatus,
            research: "done",
            seo: "working",
            script: "working",
          },
        };
      });
    },
    [clearScheduledTimers, orchestrateOfficeStaff, pushChat, runFinalProduction, schedule]
  );

  const submitBossBrief = useCallback(
    (brief: string, platform: PublishPlatform) => {
      const cleanBrief =
        brief.trim() || "Bikinin video animasi anak truk pemadam penyelamat";
      clearScheduledTimers();

      const nextEpNum = (episodesRef.current[0]?.episodeNumber ?? 0) + 1;
      const ideas = generateIdeaOptionsFromBrief(cleanBrief, nextEpNum);

      setJob({
        id: `job-${Date.now()}`,
        brief: cleanBrief,
        platform,
        stage: "briefing",
        activeStepLabel: "Direktur Konten sedang membagi tugas ke tiap ruangan...",
        progressPercent: 14,
        divisionStatus: {
          director: "working",
          research: "working",
          seo: "working",
          script: "waiting",
          voice: "waiting",
          motion: "waiting",
          qc: "waiting",
        },
        ideas,
        selectedIdea: null,
        draftEpisode: null,
        finalEpisodeId: null,
      });

      // Boss message
      pushChat("BOS FAJREZ", "Owner", "#fbbf24", cleanBrief, "boss");
      addActivity(
        "BOS FAJREZ",
        "user",
        `Mengirim tugas baru: "${cleanBrief}"`,
        "info",
        "Panel Komando HP"
      );

      // Director + Research + SEO jump to desks; Voice & QC chill on break
      orchestrateOfficeStaff(
        ["staff-09", "staff-01", "staff-02"],
        ["staff-03", "staff-04"],
        ["staff-05", "staff-07", "staff-10"]
      );

      schedule(() => {
        pushChat(
          "Reza Mahendra",
          "Direktur Konten",
          "#eab308",
          `Siap Bos! Tugas "${cleanBrief}" diterima. Raka (Tim Riset) & Nadia (Tim SEO) langsung masuk ruangan buat nyiapin 3 ide viral sekarang!`,
          "work"
        );
      }, 450);

      schedule(() => {
        setJob((prev) => ({
          ...prev,
          stage: "waiting_idea",
          activeStepLabel:
            "Laporan 3 Ide Viral masuk! Bos tinggal pilih 1 ide terbaik.",
          progressPercent: 28,
          divisionStatus: {
            ...prev.divisionStatus,
            director: "done",
            research: "done",
            seo: "working",
          },
        }));

        pushChat(
          "Raka Pratama",
          "Tim Riset",
          "#0ea5e9",
          `💡 Laporan masuk Bos! 3 ide viral + hook 3 detik sudah siap di panel. Silakan pilih 1 ide yang paling cocok!`,
          "report"
        );
        addActivity(
          "Raka (Tim Riset)",
          "robot-placeholder",
          "Mengirim 3 pilihan ide viral ke Panel Bos",
          "success",
          "L2 • WS-01"
        );

        if (autoApproveRef.current && ideas[0]) {
          schedule(() => {
            selectIdeaOption(ideas[0].id);
          }, 1500);
        }
      }, 1700);
    },
    [
      addActivity,
      clearScheduledTimers,
      orchestrateOfficeStaff,
      pushChat,
      schedule,
      selectIdeaOption,
    ]
  );

  const updateDraftFields = useCallback(
    (patch: { title?: string; hook3s?: string; thumbnailHeadline?: string }) => {
      setJob((prev) => {
        if (!prev.draftEpisode) return prev;
        const updated: KidsEpisode = {
          ...prev.draftEpisode,
          title: patch.title ?? prev.draftEpisode.title,
          hook3s: patch.hook3s ?? prev.draftEpisode.hook3s,
          thumbnailHeadline:
            patch.thumbnailHeadline ?? prev.draftEpisode.thumbnailHeadline,
        };
        return { ...prev, draftEpisode: updated };
      });
    },
    []
  );

  const approveScriptAndProduce = useCallback(() => {
    if (!job.draftEpisode) return;
    pushChat(
      "BOS FAJREZ",
      "Owner",
      "#fbbf24",
      "✅ Naskah disetujui! Lanjut Studio Suara, Motion, Editing sampai QC!",
      "boss"
    );
    runFinalProduction(job.draftEpisode);
  }, [job.draftEpisode, pushChat, runFinalProduction]);

  const markEpisodeUploaded = useCallback(
    (episodeId: string, uploaded = true) => {
      setEpisodes((prev) =>
        prev.map((ep) => (ep.id === episodeId ? { ...ep, uploaded } : ep))
      );
    },
    []
  );

  const deleteEpisode = useCallback((episodeId: string) => {
    setEpisodes((prev) => {
      const next = prev.filter((ep) => ep.id !== episodeId);
      if (next.length > 0) {
        setSelectedEpisodeId((cur) => (cur === episodeId ? next[0].id : cur));
      }
      return next;
    });
  }, []);

  return (
    <AgencyContext.Provider
      value={{
        job,
        teamChat,
        episodes,
        selectedEpisodeId,
        setSelectedEpisodeId,
        autoApproveMode,
        setAutoApproveMode,
        submitBossBrief,
        selectIdeaOption,
        updateDraftFields,
        approveScriptAndProduce,
        markEpisodeUploaded,
        deleteEpisode,
      }}
    >
      {children}
    </AgencyContext.Provider>
  );
}

export function useAgency() {
  const ctx = useContext(AgencyContext);
  if (!ctx) {
    throw new Error("useAgency must be used inside AgencyProvider");
  }
  return ctx;
}
