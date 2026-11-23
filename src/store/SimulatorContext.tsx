"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useOffice } from "@/store/OfficeContext";
import type { LightingPreset, PerformanceMode } from "@/types/office";

export type WeatherMode =
  | "dynamic"
  | "clear"
  | "cloudy"
  | "rain"
  | "storm"
  | "fog";

export type ResolvedWeather = Exclude<WeatherMode, "dynamic">;

export type TimeSpeed = "slow" | "normal" | "fast";

export type SimCameraMode = "orbit" | "drone" | "topdown";
export type ViewPerspective = "third" | "first";
export type DriveCameraMode = "follow" | "hood";

export interface Mt5Account {
  id: string;
  login: string;
  name: string;
  strategy: string;
  balance: number;
  equity: number;
  dailyPnl: number;
  weeklyPnl: number;
  monthlyPnl: number;
  floatingPnl: number;
  drawdownPct: number;
  openTrades: number;
  status: "ACTIVE" | "HEDGED" | "STANDBY";
}

export interface StaffVitals {
  id: string;
  name: string;
  role: string;
  floor: number;
  energy: number;
  fitness: number;
  activity: string;
}

export interface SimActivityLog {
  id: string;
  time: string;
  actor: string;
  text: string;
  category: "system" | "staff" | "vehicle" | "mt5" | "lounge";
}

export interface DrivableVehicleDef {
  id: string;
  name: string;
  kind: "porsche" | "suv" | "sedan" | "supercar" | "van" | "hypercar" | "patrol";
  color: string;
  accentColor: string;
  homePosition: [number, number, number];
  homeYaw: number;
  maxSpeed: number;
}

export const DRIVABLE_VEHICLES: DrivableVehicleDef[] = [
  {
    id: "veh-porsche-992",
    name: "Porsche 911 Carrera 992.2",
    kind: "porsche",
    color: "#0f62d6",
    accentColor: "#38bdf8",
    homePosition: [9.4, 0.18, 11.3],
    homeYaw: -0.36,
    maxSpeed: 22,
  },
  {
    id: "veh-cyber-suv",
    name: "Cyber G-Class SUV",
    kind: "suv",
    color: "#111827",
    accentColor: "#22d3ee",
    homePosition: [13.2, 0.18, 8.2],
    homeYaw: -0.2,
    maxSpeed: 16,
  },
  {
    id: "veh-exec-sedan",
    name: "Executive EV Sedan",
    kind: "sedan",
    color: "#e2e8f0",
    accentColor: "#38bdf8",
    homePosition: [-20.5, 0.08, 13.5],
    homeYaw: 0,
    maxSpeed: 18,
  },
  {
    id: "veh-crimson-gt",
    name: "Crimson GT Coupe",
    kind: "supercar",
    color: "#dc2626",
    accentColor: "#fbbf24",
    homePosition: [-24.2, 0.08, 13.5],
    homeYaw: 0,
    maxSpeed: 23,
  },
  {
    id: "veh-midnight-ev",
    name: "Midnight EV Sport",
    kind: "sedan",
    color: "#1e3a8a",
    accentColor: "#a855f7",
    homePosition: [-27.9, 0.08, 13.5],
    homeYaw: 0,
    maxSpeed: 19,
  },
  {
    id: "veh-luxury-van",
    name: "VIP Lounge Shuttle",
    kind: "van",
    color: "#94a3b8",
    accentColor: "#22d3ee",
    homePosition: [21.0, 0.08, 13.5],
    homeYaw: 0,
    maxSpeed: 14,
  },
  {
    id: "veh-neon-hyper",
    name: "Cyber Hypercar Neon",
    kind: "hypercar",
    color: "#0f172a",
    accentColor: "#e879f9",
    homePosition: [24.8, 0.08, 13.5],
    homeYaw: 0,
    maxSpeed: 25,
  },
  {
    id: "veh-gold-coupe",
    name: "Gold Edition Coupe",
    kind: "supercar",
    color: "#b45309",
    accentColor: "#fde047",
    homePosition: [28.6, 0.08, 13.5],
    homeYaw: 0,
    maxSpeed: 21,
  },
  {
    id: "veh-security-patrol",
    name: "HQ Security Patrol SUV",
    kind: "patrol",
    color: "#0f172a",
    accentColor: "#38bdf8",
    homePosition: [-12.0, 0.05, 22.8],
    homeYaw: Math.PI / 2,
    maxSpeed: 17,
  },
];

export const TELEPORT_LOCATIONS: {
  id: string;
  label: string;
  zone: string;
  floor: 0 | 1 | 2 | 3 | 4;
  position: [number, number, number];
  yaw: number;
}[] = [
  { id: "tp-lobi", label: "Lobi & Resepsionis (L1)", zone: "Lobi Utama L1", floor: 1, position: [0, 0.18, 1.8], yaw: Math.PI },
  { id: "tp-mt5", label: "Ruang Kontrol MT5 (L1)", zone: "Ruang Kontrol MT5", floor: 1, position: [-8.6, 0.18, -3.5], yaw: Math.PI },
  { id: "tp-gym", label: "Gym & Arcade (L1)", zone: "Gym & Arcade L1", floor: 1, position: [9.2, 0.18, -3.2], yaw: Math.PI },
  { id: "tp-ops", label: "Ruang Operasional AI (L2)", zone: "Operasional 7 Divisi L2", floor: 2, position: [0, 3.9, 2.2], yaw: Math.PI },
  { id: "tp-balcony", label: "Balkon & Kafe Santai (L2)", zone: "Balkon Lantai 2", floor: 2, position: [0, 3.9, 5.2], yaw: 0 },
  { id: "tp-ceo", label: "Kamar CEO & Lounge (L3)", zone: "Kamar CEO & Lounge L3", floor: 3, position: [0, 7.8, 1.5], yaw: Math.PI },
  { id: "tp-billiard", label: "Biliar & Bioskop (L3)", zone: "Lounge Biliar & Bioskop L3", floor: 3, position: [8.8, 7.8, -1.8], yaw: Math.PI },
  { id: "tp-pool", label: "Kolam Renang & Bot Trading", zone: "Dek Kolam Renang", floor: 0, position: [-10.8, 0.18, 10.7], yaw: -Math.PI / 2 },
  { id: "tp-parking", label: "Parkiran & Porsche 911", zone: "Area Parkir & Mobil", floor: 0, position: [7.2, 0.18, 11.3], yaw: Math.PI / 2 },
  { id: "tp-rooftop", label: "Rooftop Padel/Badminton & Helipad", zone: "Rooftop Sky Deck", floor: 4, position: [0, 11.82, 0], yaw: Math.PI },
];

const INITIAL_MT5_ACCOUNTS: Mt5Account[] = Array.from({ length: 18 }).map(
  (_, idx) => {
    const num = idx + 1;
    const strategies = [
      "XAUUSD Scalper",
      "EURUSD Grid AI",
      "NAS100 Momentum",
      "BTCUSD Swing",
      "GBPUSD Breakout",
      "USDJPY Carry",
    ];
    const baseBal = 25000 + ((num * 7500) % 45000);
    const dayP = Number((((num % 5) - 1.1) * 320 + 185).toFixed(2));
    const weekP = Number((dayP * 3.4 + 410).toFixed(2));
    const monthP = Number((weekP * 3.1 + 1150).toFixed(2));
    const flt = Number((((num % 7) - 2.4) * 95).toFixed(2));
    const dd = Number((0.4 + ((num * 19) % 28) / 10).toFixed(2));
    return {
      id: `mt5-${String(num).padStart(2, "0")}`,
      login: `${5018400 + num * 17}`,
      name: `AKUN-${String(num).padStart(2, "0")}`,
      strategy: strategies[idx % strategies.length],
      balance: baseBal,
      equity: Number((baseBal + flt).toFixed(2)),
      dailyPnl: dayP,
      weeklyPnl: weekP,
      monthlyPnl: monthP,
      floatingPnl: flt,
      drawdownPct: dd,
      openTrades: (num % 4) + 1,
      status: num % 6 === 0 ? "HEDGED" : num % 9 === 0 ? "STANDBY" : "ACTIVE",
    };
  }
);

const EXTRA_STAFF_ROSTER: { id: string; name: string; role: string; floor: number }[] = [
  { id: "ext-nabila", name: "Nabila Sari", role: "Resepsionis L1", floor: 1 },
  { id: "ext-arif", name: "Arif Hidayat", role: "Admin Lobby L1", floor: 1 },
  { id: "ext-bambang", name: "Bambang Suryo", role: "Security Pintu Utama", floor: 1 },
  { id: "ext-eko", name: "Eko Prasetyo", role: "Security Pintu Utama", floor: 1 },
  { id: "ext-dina", name: "Dina Kartika", role: "Analis MT5 L1", floor: 1 },
  { id: "ext-rehan", name: "Rehan Saputra", role: "Quant Trader L1", floor: 1 },
  { id: "ext-gilang", name: "Gilang Ramadhan", role: "Staf Admin L1", floor: 1 },
  { id: "ext-putri", name: "Putri Maharani", role: "HR & Wellness L2", floor: 2 },
  { id: "ext-kevin", name: "Kevin Pratama", role: "Pelatih Gym & Arcade", floor: 1 },
  { id: "ext-sinta", name: "Sinta Wulandari", role: "Asisten Eksekutif L3", floor: 3 },
];

const SIM_STORAGE_KEY = "fajrezzz-nanda-sim-v2";

interface SimulatorContextValue {
  // Game Clock & Weather
  gameMinutes: number; // 0..1440 (starts 480 = 08:00)
  gameDay: number;
  formattedTime: string;
  timeSpeed: TimeSpeed;
  setTimeSpeed: (s: TimeSpeed) => void;
  cycleTimeSpeed: () => void;
  autoDayNight: boolean;
  setAutoDayNight: (v: boolean) => void;
  weatherMode: WeatherMode;
  resolvedWeather: ResolvedWeather;
  setWeatherMode: (w: WeatherMode) => void;
  cycleWeather: () => void;
  // Camera, HUD & Controls
  simCameraMode: SimCameraMode;
  setSimCameraMode: (m: SimCameraMode) => void;
  cycleSimCameraMode: () => void;
  viewPerspective: ViewPerspective;
  setViewPerspective: (v: ViewPerspective) => void;
  toggleViewPerspective: () => void;
  showHud: boolean;
  setShowHud: (v: boolean) => void;
  toggleHud: () => void;
  sensitivity: number;
  setSensitivity: (v: number) => void;
  volume: number;
  setVolume: (v: number) => void;
  compassDeg: number;
  setCompassDeg: (deg: number) => void;
  zoomPct: number;
  setZoomPct: (pct: number) => void;
  currentLocationName: string;
  setCurrentLocationName: (name: string) => void;
  // Modals / Panels
  activeSimModal:
    | null
    | "mt5"
    | "directory"
    | "map"
    | "settings"
    | "help"
    | "lounge";
  setActiveSimModal: (
    m: null | "mt5" | "directory" | "map" | "settings" | "help" | "lounge"
  ) => void;
  // MT5 Monitor (18 Accounts - clearly labeled SIMULASI)
  mt5Accounts: Mt5Account[];
  mt5Summary: {
    fund: number;
    drawdownPct: number;
    dailyPnl: number;
    weeklyPnl: number;
    monthlyPnl: number;
    floatingPnl: number;
  };
  // 20 Staff Vitals + Lounge Invite
  staffVitals: StaffVitals[];
  invitedLoungeIds: string[];
  toggleInviteLounge: (agentId: string) => void;
  applyLoungeInvite: () => void;
  simLogs: SimActivityLog[];
  pushSimLog: (actor: string, text: string, category?: SimActivityLog["category"]) => void;
  // 9 Drivable Vehicles
  activeVehicleId: string | null;
  setActiveVehicleId: (id: string | null) => void;
  vehicleSpeedKmh: number;
  setVehicleSpeedKmh: (kmh: number) => void;
  driveCameraMode: DriveCameraMode;
  toggleDriveCameraMode: () => void;
  triggerHorn: () => void;
  vehiclePositionsRef: React.MutableRefObject<
    Record<string, { pos: [number, number, number]; yaw: number }>
  >;
  // Click-to-walk target for Boss
  walkToTargetRef: React.MutableRefObject<[number, number, number] | null>;
  commandBossWalkTo: (pos: [number, number, number]) => void;
  // Save / Load (localStorage + Cloud)
  saveStatus: string | null;
  saveProgress: () => Promise<void>;
  loadProgress: () => Promise<void>;
}

const SimulatorContext = createContext<SimulatorContextValue | null>(null);

export function SimulatorProvider({ children }: { children: React.ReactNode }) {
  const {
    agents,
    lightingPreset,
    setLightingPreset,
    performanceMode,
    setPerformanceMode,
    bossPositionRef,
    teleportBoss,
    sendAgentToWaypoint,
    setActiveFloor,
  } = useOffice();

  const [gameMinutes, setGameMinutes] = useState<number>(8 * 60); // 08:00
  const [gameDay, setGameDay] = useState<number>(1);
  const [timeSpeed, setTimeSpeed] = useState<TimeSpeed>("normal");
  const [autoDayNight, setAutoDayNight] = useState<boolean>(false);
  const [weatherMode, setWeatherMode] = useState<WeatherMode>("dynamic");
  const [dynamicWeather, setDynamicWeather] = useState<ResolvedWeather>("clear");

  const [simCameraMode, setSimCameraMode] = useState<SimCameraMode>("orbit");
  const [viewPerspective, setViewPerspective] = useState<ViewPerspective>("third");
  const [showHud, setShowHud] = useState<boolean>(true);
  const [sensitivity, setSensitivity] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(0.65);
  const [compassDeg, setCompassDeg] = useState<number>(0);
  const [zoomPct, setZoomPct] = useState<number>(100);
  const [currentLocationName, setCurrentLocationName] = useState<string>("Dek Kolam & Lobi Utama");

  const [activeSimModal, setActiveSimModal] = useState<
    null | "mt5" | "directory" | "map" | "settings" | "help" | "lounge"
  >(null);

  const [mt5Accounts, setMt5Accounts] = useState<Mt5Account[]>(INITIAL_MT5_ACCOUNTS);
  const [invitedLoungeIds, setInvitedLoungeIds] = useState<string[]>([]);
  const [activeVehicleId, setActiveVehicleId] = useState<string | null>(null);
  const [vehicleSpeedKmh, setVehicleSpeedKmh] = useState<number>(0);
  const [driveCameraMode, setDriveCameraMode] = useState<DriveCameraMode>("follow");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const [simLogs, setSimLogs] = useState<SimActivityLog[]>([
    {
      id: "log-init-1",
      time: "08:00",
      actor: "Sistem Kantor",
      text: "Hari 1 dimulai · 20 staf & 9 kendaraan siap digunakan.",
      category: "system",
    },
    {
      id: "log-init-2",
      time: "08:00",
      actor: "MT5 Monitor",
      text: "18 akun simulasi terhubung (mode SIMULASI aktif).",
      category: "mt5",
    },
  ]);

  const walkToTargetRef = useRef<[number, number, number] | null>(null);
  const vehiclePositionsRef = useRef<
    Record<string, { pos: [number, number, number]; yaw: number }>
  >(
    Object.fromEntries(
      DRIVABLE_VEHICLES.map((v) => [
        v.id,
        { pos: [...v.homePosition] as [number, number, number], yaw: v.homeYaw },
      ])
    )
  );

  const formattedTime = useMemo(() => {
    const total = Math.floor(gameMinutes) % 1440;
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }, [gameMinutes]);

  const pushSimLog = useCallback(
    (
      actor: string,
      text: string,
      category: SimActivityLog["category"] = "system"
    ) => {
      setSimLogs((prev) => [
        {
          id: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          time: formattedTime,
          actor,
          text,
          category,
        },
        ...prev.slice(0, 24),
      ]);
    },
    [formattedTime]
  );

  // In-game clock progression: slow=48m/day (0.5 in-game min/s), normal=24m/day (1 min/s), fast=8m/day (3 min/s)
  useEffect(() => {
    const minutesPerSec =
      timeSpeed === "slow" ? 0.5 : timeSpeed === "fast" ? 3.0 : 1.0;
    const interval = window.setInterval(() => {
      setGameMinutes((prev) => {
        const next = prev + minutesPerSec;
        if (next >= 1440) {
          setGameDay((d) => d + 1);
          return next - 1440;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timeSpeed]);

  // Dynamic weather cycling when weatherMode === "dynamic"
  useEffect(() => {
    if (weatherMode !== "dynamic") return;
    const states: ResolvedWeather[] = ["clear", "clear", "cloudy", "rain", "fog", "clear"];
    const idx = Math.floor((gameMinutes / 180 + gameDay) % states.length);
    setDynamicWeather(states[idx]);
  }, [weatherMode, gameMinutes, gameDay]);

  const resolvedWeather: ResolvedWeather =
    weatherMode === "dynamic" ? dynamicWeather : weatherMode;

  // Optional auto day/night sync with in-game clock
  useEffect(() => {
    if (!autoDayNight) return;
    const hour = gameMinutes / 60;
    const target: LightingPreset =
      hour >= 19 || hour < 5.5
        ? "night"
        : hour >= 16.5 || hour < 7
          ? "sunset"
          : "day";
    if (target !== lightingPreset) {
      setLightingPreset(target);
    }
  }, [autoDayNight, gameMinutes, lightingPreset, setLightingPreset]);

  // Live gentle tick for 18 simulated MT5 accounts (clearly labeled SIMULASI!)
  useEffect(() => {
    const iv = window.setInterval(() => {
      setMt5Accounts((prev) =>
        prev.map((acc, idx) => {
          if (acc.status === "STANDBY") return acc;
          const delta = Number(
            (Math.sin(Date.now() * 0.0007 + idx * 1.9) * 14.5).toFixed(2)
          );
          const nextFloat = Number((acc.floatingPnl + delta * 0.15).toFixed(2));
          return {
            ...acc,
            floatingPnl: Math.max(-450, Math.min(850, nextFloat)),
            equity: Number((acc.balance + nextFloat).toFixed(2)),
          };
        })
      );
    }, 3500);
    return () => window.clearInterval(iv);
  }, []);

  // Live location name detector based on Boss world position
  useEffect(() => {
    const iv = window.setInterval(() => {
      const [bx, by, bz] = bossPositionRef.current;
      if (by > 10.5) {
        setCurrentLocationName(bx < 0 ? "Rooftop · Helipad H" : "Rooftop · Padel & Pergola");
      } else if (by > 6.5) {
        setCurrentLocationName(bx > 5 ? "L3 · Lounge Biliar & Bioskop" : "L3 · Kamar CEO & Lounge");
      } else if (by > 2.8) {
        setCurrentLocationName(bz > 4.2 ? "L2 · Balkon Cyberpunk" : "L2 · Ruang Operasional AI");
      } else if (bz < 4.0) {
        if (bx < -5) setCurrentLocationName("L1 · Ruang Kontrol MT5");
        else if (bx > 5) setCurrentLocationName("L1 · Gym & Arcade");
        else setCurrentLocationName("L1 · Lobi & Resepsionis");
      } else if (bz < 18.5) {
        setCurrentLocationName(bx < 3 ? "Halaman · Kolam & Bot Trading" : "Halaman · Parkir Porsche & Air Mancur");
      } else {
        setCurrentLocationName("Jalan Raya · Cyber Avenue");
      }
    }, 600);
    return () => window.clearInterval(iv);
  }, [bossPositionRef]);

  const mt5Summary = useMemo(() => {
    const fund = mt5Accounts.reduce((s, a) => s + a.balance, 0);
    const dailyPnl = mt5Accounts.reduce((s, a) => s + a.dailyPnl, 0);
    const weeklyPnl = mt5Accounts.reduce((s, a) => s + a.weeklyPnl, 0);
    const monthlyPnl = mt5Accounts.reduce((s, a) => s + a.monthlyPnl, 0);
    const floatingPnl = mt5Accounts.reduce((s, a) => s + a.floatingPnl, 0);
    const drawdownPct =
      mt5Accounts.reduce((s, a) => s + a.drawdownPct, 0) / mt5Accounts.length;
    return {
      fund,
      drawdownPct: Number(drawdownPct.toFixed(2)),
      dailyPnl: Number(dailyPnl.toFixed(2)),
      weeklyPnl: Number(weeklyPnl.toFixed(2)),
      monthlyPnl: Number(monthlyPnl.toFixed(2)),
      floatingPnl: Number(floatingPnl.toFixed(2)),
    };
  }, [mt5Accounts]);

  // Combined 20 Staff Vitals (10 Core AI/CEO Agents + 10 Extra Office Staff)
  const staffVitals: StaffVitals[] = useMemo(() => {
    const hourFactor = Math.sin((gameMinutes / 1440) * Math.PI);
    const core = agents.map((a, idx) => {
      const baseEnergy = a.status === "working" ? 78 : a.status === "idle" ? 91 : 84;
      const energy = Math.max(
        35,
        Math.min(100, Math.round(baseEnergy - hourFactor * 12 + ((idx * 7) % 11)))
      );
      const fitness = Math.max(
        52,
        Math.min(99, Math.round(76 + ((idx * 13) % 22)))
      );
      return {
        id: a.id,
        name: a.name,
        role: a.role,
        floor: a.floor,
        energy,
        fitness,
        activity:
          a.currentActionLabel ||
          (a.status === "working"
            ? "Fokus di meja kerja"
            : a.status === "walking"
              ? "Berjalan menuju lokasi"
              : "Santai minum kopi"),
      };
    });

    const extras = EXTRA_STAFF_ROSTER.map((e, idx) => ({
      id: e.id,
      name: e.name,
      role: e.role,
      floor: e.floor,
      energy: Math.max(48, Math.min(98, Math.round(82 - hourFactor * 8 + ((idx * 9) % 14)))),
      fitness: Math.max(60, Math.min(98, Math.round(80 + ((idx * 11) % 16)))),
      activity: e.role.includes("Security")
        ? "Berjaga pintu utama"
        : e.role.includes("MT5")
          ? "Memantau 18 akun MT5"
          : e.role.includes("Gym")
            ? "Menjaga area Gym & Arcade"
            : "Aktif bertugas",
    }));
    return [...core, ...extras];
  }, [agents, gameMinutes]);

  const toggleInviteLounge = useCallback((agentId: string) => {
    setInvitedLoungeIds((prev) => {
      if (prev.includes(agentId)) return prev.filter((id) => id !== agentId);
      if (prev.length >= 4) return [...prev.slice(1), agentId];
      return [...prev, agentId];
    });
  }, []);

  const applyLoungeInvite = useCallback(() => {
    if (invitedLoungeIds.length === 0) return;
    invitedLoungeIds.forEach((id) => {
      sendAgentToWaypoint(id, "wp-l3-boardroom");
    });
    const names = agents
      .filter((a) => invitedLoungeIds.includes(a.id))
      .map((a) => a.name.split(" ")[0])
      .join(", ");
    pushSimLog("Bos Fajrez", `Mengundang ${names} ngobrol santai di Lounge CEO L3.`, "lounge");
    setActiveFloor("l3");
    teleportBoss([0, 7.8, 1.4], 3, "Lounge CEO L3", Math.PI);
    setActiveSimModal(null);
  }, [
    invitedLoungeIds,
    sendAgentToWaypoint,
    agents,
    pushSimLog,
    setActiveFloor,
    teleportBoss,
  ]);

  const cycleWeather = useCallback(() => {
    const order: WeatherMode[] = ["dynamic", "clear", "cloudy", "rain", "storm", "fog"];
    setWeatherMode((prev) => order[(order.indexOf(prev) + 1) % order.length]);
  }, []);

  const cycleTimeSpeed = useCallback(() => {
    const order: TimeSpeed[] = ["slow", "normal", "fast"];
    setTimeSpeed((prev) => order[(order.indexOf(prev) + 1) % order.length]);
  }, []);

  const cycleSimCameraMode = useCallback(() => {
    const order: SimCameraMode[] = ["orbit", "drone", "topdown"];
    setSimCameraMode((prev) => order[(order.indexOf(prev) + 1) % order.length]);
  }, []);

  const toggleViewPerspective = useCallback(() => {
    setViewPerspective((prev) => (prev === "third" ? "first" : "third"));
  }, []);

  const toggleHud = useCallback(() => {
    setShowHud((prev) => !prev);
  }, []);

  const toggleDriveCameraMode = useCallback(() => {
    setDriveCameraMode((prev) => (prev === "follow" ? "hood" : "follow"));
  }, []);

  // Synthesized realistic dual-tone car horn (Q key) respecting volume setting
  const triggerHorn = useCallback(() => {
    if (typeof window === "undefined" || volume <= 0.01) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtx();
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18 * volume, ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.34);
      gain.connect(ctx.destination);

      [420, 525].forEach((freq) => {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.connect(gain);
        osc.start();
        osc.stop(ctx.currentTime + 0.36);
      });
      pushSimLog("Kendaraan", "Klakson dibunyikan (Beep!)", "vehicle");
    } catch {
      // Ignore audio autoplay block
    }
  }, [volume, pushSimLog]);

  const commandBossWalkTo = useCallback((pos: [number, number, number]) => {
    walkToTargetRef.current = pos;
  }, []);

  // Save & Load progress (localStorage + Cloud API fallback)
  const saveProgress = useCallback(async () => {
    const payload = {
      gameMinutes,
      gameDay,
      timeSpeed,
      autoDayNight,
      weatherMode,
      lightingPreset,
      performanceMode,
      sensitivity,
      volume,
      bossPos: bossPositionRef.current,
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(SIM_STORAGE_KEY, JSON.stringify(payload));
      const res = await fetch("/api/sim-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { storage?: string };
      setSaveStatus(
        json.storage === "supabase"
          ? "Tersimpan ke Cloud Supabase ✅"
          : "Tersimpan lokal & server ✅"
      );
      pushSimLog("Sistem Simpan", "Progres simulator berhasil disimpan.", "system");
    } catch {
      setSaveStatus("Tersimpan lokal ✅");
    }
  }, [
    gameMinutes,
    gameDay,
    timeSpeed,
    autoDayNight,
    weatherMode,
    lightingPreset,
    performanceMode,
    sensitivity,
    volume,
    bossPositionRef,
    pushSimLog,
  ]);

  const loadProgress = useCallback(async () => {
    try {
      let data: Record<string, unknown> | null = null;
      const res = await fetch("/api/sim-save");
      if (res.ok) {
        const json = (await res.json()) as { data?: Record<string, unknown> | null };
        if (json.data) data = json.data;
      }
      if (!data) {
        const raw = localStorage.getItem(SIM_STORAGE_KEY);
        if (raw) data = JSON.parse(raw) as Record<string, unknown>;
      }
      if (!data) {
        setSaveStatus("Belum ada data simpanan.");
        return;
      }
      if (typeof data.gameMinutes === "number") setGameMinutes(data.gameMinutes);
      if (typeof data.gameDay === "number") setGameDay(data.gameDay);
      if (typeof data.timeSpeed === "string") setTimeSpeed(data.timeSpeed as TimeSpeed);
      if (typeof data.autoDayNight === "boolean") setAutoDayNight(data.autoDayNight);
      if (typeof data.weatherMode === "string") setWeatherMode(data.weatherMode as WeatherMode);
      if (typeof data.lightingPreset === "string")
        setLightingPreset(data.lightingPreset as LightingPreset);
      if (typeof data.performanceMode === "string")
        setPerformanceMode(data.performanceMode as PerformanceMode);
      if (typeof data.sensitivity === "number") setSensitivity(data.sensitivity);
      if (typeof data.volume === "number") setVolume(data.volume);
      setSaveStatus("Simpanan terakhir dimuat ✅");
      pushSimLog("Sistem Simpan", "Progres terakhir berhasil dimuat.", "system");
    } catch {
      setSaveStatus("Gagal memuat simpanan.");
    }
  }, [setLightingPreset, setPerformanceMode, pushSimLog]);

  // Global Simulator Hotkeys (Tab, M, N, T, O, L, H, V, Q, F, Esc)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const k = e.key.toLowerCase();

      if (k === "tab") {
        e.preventDefault();
        setActiveSimModal((prev) => (prev === "directory" ? null : "directory"));
      } else if (k === "m") {
        setActiveSimModal((prev) => (prev === "map" ? null : "map"));
      } else if (k === "l") {
        setActiveSimModal((prev) => (prev === "mt5" ? null : "mt5"));
      } else if (k === "n") {
        cycleWeather();
      } else if (k === "t") {
        cycleTimeSpeed();
      } else if (k === "o") {
        cycleSimCameraMode();
      } else if (k === "v") {
        toggleViewPerspective();
      } else if (k === "h") {
        toggleHud();
      } else if (k === "c" && activeVehicleId) {
        toggleDriveCameraMode();
      } else if (k === "q" && activeVehicleId) {
        triggerHorn();
      } else if (k === "f") {
        if (activeVehicleId) {
          // Exit vehicle next to car door
          const cur = vehiclePositionsRef.current[activeVehicleId];
          if (cur) {
            teleportBoss([cur.pos[0] - 2.1, 0.18, cur.pos[2]], 1, "Halaman Parkir", cur.yaw);
          }
          pushSimLog("Bos Fajrez", "Turun dari kendaraan.", "vehicle");
          setActiveVehicleId(null);
          setVehicleSpeedKmh(0);
        } else {
          // Find nearest vehicle within 5.5m
          const [bx, , bz] = bossPositionRef.current;
          let best: { id: string; name: string; dist: number } | null = null;
          for (const v of DRIVABLE_VEHICLES) {
            const state = vehiclePositionsRef.current[v.id];
            if (!state) continue;
            const d = Math.hypot(state.pos[0] - bx, state.pos[2] - bz);
            if (d < 5.8 && (!best || d < best.dist)) {
              best = { id: v.id, name: v.name, dist: d };
            }
          }
          if (best) {
            setActiveVehicleId(best.id);
            pushSimLog("Bos Fajrez", `Mengemudikan ${best.name}!`, "vehicle");
          }
        }
      } else if (k === "escape") {
        if (activeSimModal) {
          setActiveSimModal(null);
        } else if (activeVehicleId) {
          setActiveVehicleId(null);
          setVehicleSpeedKmh(0);
        } else {
          // Esc returns Boss to MT5 Control Room
          setActiveFloor("l1");
          teleportBoss([-8.6, 0.18, -3.5], 1, "Ruang Kontrol MT5", Math.PI);
          pushSimLog("Bos Fajrez", "Kembali ke Ruang Kontrol MT5 (L1).", "system");
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    activeSimModal,
    activeVehicleId,
    bossPositionRef,
    cycleSimCameraMode,
    cycleTimeSpeed,
    cycleWeather,
    pushSimLog,
    setActiveFloor,
    teleportBoss,
    toggleDriveCameraMode,
    toggleHud,
    toggleViewPerspective,
    triggerHorn,
  ]);

  const value = useMemo<SimulatorContextValue>(
    () => ({
      gameMinutes,
      gameDay,
      formattedTime,
      timeSpeed,
      setTimeSpeed,
      cycleTimeSpeed,
      autoDayNight,
      setAutoDayNight,
      weatherMode,
      resolvedWeather,
      setWeatherMode,
      cycleWeather,
      simCameraMode,
      setSimCameraMode,
      cycleSimCameraMode,
      viewPerspective,
      setViewPerspective,
      toggleViewPerspective,
      showHud,
      setShowHud,
      toggleHud,
      sensitivity,
      setSensitivity,
      volume,
      setVolume,
      compassDeg,
      setCompassDeg,
      zoomPct,
      setZoomPct,
      currentLocationName,
      setCurrentLocationName,
      activeSimModal,
      setActiveSimModal,
      mt5Accounts,
      mt5Summary,
      staffVitals,
      invitedLoungeIds,
      toggleInviteLounge,
      applyLoungeInvite,
      simLogs,
      pushSimLog,
      activeVehicleId,
      setActiveVehicleId,
      vehicleSpeedKmh,
      setVehicleSpeedKmh,
      driveCameraMode,
      toggleDriveCameraMode,
      triggerHorn,
      vehiclePositionsRef,
      walkToTargetRef,
      commandBossWalkTo,
      saveStatus,
      saveProgress,
      loadProgress,
    }),
    [
      gameMinutes,
      gameDay,
      formattedTime,
      timeSpeed,
      cycleTimeSpeed,
      autoDayNight,
      weatherMode,
      resolvedWeather,
      cycleWeather,
      simCameraMode,
      cycleSimCameraMode,
      viewPerspective,
      toggleViewPerspective,
      showHud,
      toggleHud,
      sensitivity,
      volume,
      compassDeg,
      zoomPct,
      currentLocationName,
      activeSimModal,
      mt5Accounts,
      mt5Summary,
      staffVitals,
      invitedLoungeIds,
      toggleInviteLounge,
      applyLoungeInvite,
      simLogs,
      pushSimLog,
      activeVehicleId,
      vehicleSpeedKmh,
      driveCameraMode,
      toggleDriveCameraMode,
      triggerHorn,
      commandBossWalkTo,
      saveStatus,
      saveProgress,
      loadProgress,
    ]
  );

  return (
    <SimulatorContext.Provider value={value}>
      {children}
    </SimulatorContext.Provider>
  );
}

export function useSimulator(): SimulatorContextValue {
  const ctx = useContext(SimulatorContext);
  if (!ctx) {
    throw new Error("useSimulator must be used inside <SimulatorProvider>");
  }
  return ctx;
}
