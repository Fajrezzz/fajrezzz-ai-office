"use client";

import React from "react";
import {
  Activity,
  BarChart3,
  Car,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  Coffee,
  Compass,
  Clock,
  HelpCircle,
  MapPin,
  Save,
  Settings,
  Sun,
  UploadCloud,
  Users,
  Volume2,
  X,
} from "lucide-react";
import { useOffice } from "@/store/OfficeContext";
import {
  DRIVABLE_VEHICLES,
  TELEPORT_LOCATIONS,
  useSimulator,
  type TimeSpeed,
  type WeatherMode,
} from "@/store/SimulatorContext";
import type { PerformanceMode } from "@/types/office";

function fmtUsd(n: number, signed = false) {
  const abs = Math.abs(n);
  const str =
    abs >= 1000
      ? `$${(abs / 1000).toFixed(1)}k`
      : `$${abs.toFixed(0)}`;
  if (!signed) return str;
  return n >= 0 ? `+${str}` : `-${str}`;
}

export function NandaSimulatorHUD() {
  const {
    performanceMode,
    setPerformanceMode,
    setActiveFloor,
    teleportBoss,
    bossPositionRef,
    agents,
  } = useOffice();

  const {
    formattedTime,
    gameDay,
    timeSpeed,
    setTimeSpeed,
    autoDayNight,
    setAutoDayNight,
    weatherMode,
    resolvedWeather,
    setWeatherMode,
    cycleWeather,
    simCameraMode,
    cycleSimCameraMode,
    viewPerspective,
    toggleViewPerspective,
    showHud,
    toggleHud,
    sensitivity,
    setSensitivity,
    volume,
    setVolume,
    compassDeg,
    zoomPct,
    currentLocationName,
    activeSimModal,
    setActiveSimModal,
    mt5Accounts,
    mt5Summary,
    staffVitals,
    invitedLoungeIds,
    toggleInviteLounge,
    applyLoungeInvite,
    simLogs,
    activeVehicleId,
    setActiveVehicleId,
    vehicleSpeedKmh,
    driveCameraMode,
    toggleDriveCameraMode,
    triggerHorn,
    vehiclePositionsRef,
    pushSimLog,
    saveStatus,
    saveProgress,
    loadProgress,
  } = useSimulator();

  const WeatherIcon =
    resolvedWeather === "rain"
      ? CloudRain
      : resolvedWeather === "storm"
        ? CloudLightning
        : resolvedWeather === "fog"
          ? CloudFog
          : resolvedWeather === "cloudy"
            ? Cloud
            : Sun;

  const weatherLabel: Record<string, string> = {
    dynamic: "Dinamis",
    clear: "Cerah",
    cloudy: "Berawan",
    rain: "Hujan",
    storm: "Badai",
    fog: "Berkabut",
  };

  if (!showHud) {
    return (
      <button
        type="button"
        onClick={toggleHud}
        className="pointer-events-auto fixed bottom-20 right-3 z-30 rounded-full border border-cyan-400/50 bg-slate-950/85 px-3 py-1.5 text-[11px] font-bold text-cyan-200 shadow-lg backdrop-blur"
      >
        Tampilkan HUD (H)
      </button>
    );
  }

  return (
    <>
      {/* TOP CYBERPUNK TELEMETRY BAR (FUND · DD · HARI · MINGGU · BULAN · FLOATING · CLOCK · WEATHER) */}
      <div className="pointer-events-none absolute inset-x-2 top-14 z-20 flex flex-col gap-1.5 sm:inset-x-3">
        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto rounded-xl border border-cyan-400/30 bg-slate-950/82 px-2.5 py-1.5 text-[10px] shadow-xl backdrop-blur-md">
          <span className="shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 font-extrabold tracking-wider text-amber-300 border border-amber-400/40">
            SIMULASI
          </span>

          <button
            type="button"
            onClick={() => setActiveSimModal("mt5")}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-slate-900/90 px-2 py-0.5 hover:bg-slate-800"
            title="Klik untuk buka MT5 Monitor 18 Akun (L)"
          >
            <span className="text-slate-400">FUND <b className="text-white">{fmtUsd(mt5Summary.fund)}</b></span>
            <span className="text-slate-400">DD <b className="text-rose-400">{mt5Summary.drawdownPct}%</b></span>
            <span className="text-slate-400">HARI <b className="text-emerald-400">{fmtUsd(mt5Summary.dailyPnl, true)}</b></span>
            <span className="hidden sm:inline text-slate-400">MINGGU <b className="text-emerald-300">{fmtUsd(mt5Summary.weeklyPnl, true)}</b></span>
            <span className="hidden md:inline text-slate-400">BULAN <b className="text-cyan-300">{fmtUsd(mt5Summary.monthlyPnl, true)}</b></span>
            <span className="text-slate-400">
              FLT{" "}
              <b className={mt5Summary.floatingPnl >= 0 ? "text-emerald-400" : "text-rose-400"}>
                {fmtUsd(mt5Summary.floatingPnl, true)}
              </b>
            </span>
          </button>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <span className="flex items-center gap-1 rounded-lg bg-slate-900/90 px-2 py-0.5 font-mono text-cyan-200">
              <Clock className="h-3 w-3 text-cyan-400" />
              {formattedTime} · H{gameDay}
            </span>
            <button
              type="button"
              onClick={cycleWeather}
              className="flex items-center gap-1 rounded-lg bg-slate-900/90 px-2 py-0.5 text-sky-200 hover:bg-slate-800"
              title="Ganti Cuaca (N)"
            >
              <WeatherIcon className="h-3 w-3 text-sky-400" />
              <span>{weatherLabel[resolvedWeather]}</span>
            </button>
            <span className="hidden lg:flex items-center gap-1 rounded-lg bg-slate-900/90 px-2 py-0.5 text-slate-300">
              <Compass className="h-3 w-3 text-fuchsia-400" />
              {Math.round(compassDeg)}° · {zoomPct}%
            </span>
          </div>
        </div>

        {/* SECOND MICRO BAR: LOCATION + QUICK SIMULATOR TOOLS */}
        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto">
          <span className="shrink-0 rounded-full border border-fuchsia-400/35 bg-slate-950/80 px-2.5 py-1 text-[10px] font-semibold text-fuchsia-200 backdrop-blur">
            📍 {currentLocationName}
          </span>

          <button
            type="button"
            onClick={() => setActiveSimModal("mt5")}
            className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-400/40 bg-slate-950/80 px-2.5 py-1 text-[10px] font-bold text-emerald-300 hover:bg-emerald-950/70"
          >
            <BarChart3 className="h-3 w-3" /> MT5 · 18
          </button>

          <button
            type="button"
            onClick={() => setActiveSimModal("directory")}
            className="flex shrink-0 items-center gap-1 rounded-full border border-cyan-400/40 bg-slate-950/80 px-2.5 py-1 text-[10px] font-bold text-cyan-200 hover:bg-cyan-950/70"
          >
            <Users className="h-3 w-3" /> Staf (20)
          </button>

          <button
            type="button"
            onClick={() => setActiveSimModal("lounge")}
            className="flex shrink-0 items-center gap-1 rounded-full border border-amber-400/40 bg-slate-950/80 px-2.5 py-1 text-[10px] font-bold text-amber-200 hover:bg-amber-950/70"
          >
            <Coffee className="h-3 w-3" /> Undang Ngobrol
          </button>

          <button
            type="button"
            onClick={() => setActiveSimModal("map")}
            className="flex shrink-0 items-center gap-1 rounded-full border border-violet-400/40 bg-slate-950/80 px-2.5 py-1 text-[10px] font-bold text-violet-200 hover:bg-violet-950/70"
          >
            <MapPin className="h-3 w-3" /> Peta (M)
          </button>

          <button
            type="button"
            onClick={() => {
              if (activeVehicleId) {
                const cur = vehiclePositionsRef.current[activeVehicleId];
                if (cur) teleportBoss([cur.pos[0] - 2.1, 0.18, cur.pos[2]], 1, "Halaman Parkir", cur.yaw);
                setActiveVehicleId(null);
                pushSimLog("Bos Fajrez", "Turun dari kendaraan.", "vehicle");
              } else {
                const [bx, , bz] = bossPositionRef.current;
                let nearest = DRIVABLE_VEHICLES[0];
                let minD = Infinity;
                for (const v of DRIVABLE_VEHICLES) {
                  const st = vehiclePositionsRef.current[v.id];
                  if (!st) continue;
                  const d = Math.hypot(st.pos[0] - bx, st.pos[2] - bz);
                  if (d < minD) {
                    minD = d;
                    nearest = v;
                  }
                }
                setActiveVehicleId(nearest.id);
                pushSimLog("Bos Fajrez", `Mengemudikan ${nearest.name}!`, "vehicle");
              }
            }}
            className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
              activeVehicleId
                ? "border-rose-400 bg-rose-500/25 text-rose-200"
                : "border-sky-400/40 bg-slate-950/80 text-sky-200 hover:bg-sky-950/70"
            }`}
          >
            <Car className="h-3 w-3" /> {activeVehicleId ? "Turun (F)" : "Kemudi (9)"}
          </button>

          <button
            type="button"
            onClick={cycleSimCameraMode}
            className="shrink-0 rounded-full border border-slate-600 bg-slate-950/80 px-2.5 py-1 text-[10px] font-semibold text-slate-200 hover:bg-slate-800"
            title="Mode Kamera (O)"
          >
            🎥 {simCameraMode === "orbit" ? "Orbit" : simCameraMode === "drone" ? "Drone" : "Atas"}
          </button>

          <button
            type="button"
            onClick={toggleViewPerspective}
            className="shrink-0 rounded-full border border-slate-600 bg-slate-950/80 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:bg-slate-800"
            title="Sudut Pandang 1/3 Orang (V)"
          >
            {viewPerspective === "first" ? "1st" : "3rd"}
          </button>

          <button
            type="button"
            onClick={() => setActiveSimModal("settings")}
            className="flex shrink-0 items-center gap-1 rounded-full border border-slate-600 bg-slate-950/80 px-2.5 py-1 text-[10px] font-semibold text-slate-200 hover:bg-slate-800"
          >
            <Settings className="h-3 w-3" /> Setelan
          </button>

          <button
            type="button"
            onClick={() => setActiveSimModal("help")}
            className="flex shrink-0 items-center gap-1 rounded-full border border-slate-600 bg-slate-950/80 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:bg-slate-800"
            title="Bantuan Tombol"
          >
            <HelpCircle className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* DRIVING SPEEDOMETER & CONTROLS BANNER WHEN DRIVING ANY OF THE 9 VEHICLES */}
      {activeVehicleId && (
        <div className="pointer-events-auto absolute bottom-28 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-cyan-400/50 bg-slate-950/90 px-4 py-2 text-xs text-white shadow-2xl backdrop-blur-md">
          <span className="font-mono text-base font-black text-cyan-300">
            {vehicleSpeedKmh} <span className="text-[10px] font-normal text-slate-400">km/h</span>
          </span>
          <span className="text-[11px] text-slate-300">W/S Gas · A/D Belok · Space Rem</span>
          <button
            type="button"
            onClick={triggerHorn}
            className="rounded-lg bg-amber-500/20 px-2 py-1 text-[11px] font-bold text-amber-300 border border-amber-400/40"
          >
            📢 Q
          </button>
          <button
            type="button"
            onClick={toggleDriveCameraMode}
            className="rounded-lg bg-cyan-500/20 px-2 py-1 text-[11px] font-bold text-cyan-200 border border-cyan-400/40"
          >
            📷 {driveCameraMode === "follow" ? "Kejar" : "Kap"} (C)
          </button>
          <button
            type="button"
            onClick={() => setActiveVehicleId(null)}
            className="rounded-lg bg-rose-500/25 px-2 py-1 text-[11px] font-bold text-rose-200 border border-rose-400/40"
          >
            Turun (F)
          </button>
        </div>
      )}

      {/* MODAL OVERLAY CONTAINER */}
      {activeSimModal && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm">
          <div className="max-h-[84vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-cyan-400/35 bg-slate-950/95 p-4 text-slate-100 shadow-2xl">
            <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black tracking-wide text-cyan-200">
                  {activeSimModal === "mt5" && "📊 MT5 MONITOR · 18 AKUN (SIMULASI)"}
                  {activeSimModal === "directory" && "👥 DIREKTORI 20 STAF · ENERGI & AKTIVITAS"}
                  {activeSimModal === "lounge" && "☕ UNDANG NGOBROL SANTAI (LOUNGE CEO L3)"}
                  {activeSimModal === "map" && "🗺️ PETA KANTOR & TELEPORTASI CEPAT"}
                  {activeSimModal === "settings" && "⚙️ PENGATURAN SIMULATOR & SIMPAN CLOUD"}
                  {activeSimModal === "help" && "🎮 PANDUAN KONTROL KANTOR DUNIA TERBUKA"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveSimModal(null)}
                className="rounded-lg bg-slate-800 p-1 text-slate-300 hover:bg-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 1. MT5 MONITOR · 18 AKUN MODAL */}
            {activeSimModal === "mt5" && (
              <div className="space-y-3">
                <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-2.5 text-[11px] text-amber-200">
                  ⚠️ <b>Mode SIMULASI:</b> Data 18 akun MT5 di bawah adalah data simulasi visual untuk monitoring ruang kontrol.
                </div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {[
                    ["FUND", fmtUsd(mt5Summary.fund), "text-white"],
                    ["DD", `${mt5Summary.drawdownPct}%`, "text-rose-400"],
                    ["HARI", fmtUsd(mt5Summary.dailyPnl, true), "text-emerald-400"],
                    ["MINGGU", fmtUsd(mt5Summary.weeklyPnl, true), "text-emerald-300"],
                    ["BULAN", fmtUsd(mt5Summary.monthlyPnl, true), "text-cyan-300"],
                    [
                      "FLOATING",
                      fmtUsd(mt5Summary.floatingPnl, true),
                      mt5Summary.floatingPnl >= 0 ? "text-emerald-400" : "text-rose-400",
                    ],
                  ].map(([k, v, cls]) => (
                    <div key={k} className="rounded-xl border border-slate-800 bg-slate-900/90 p-2 text-center">
                      <div className="text-[9px] font-bold text-slate-400">{k}</div>
                      <div className={`font-mono text-xs font-black ${cls}`}>{v}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {mt5Accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/75 px-3 py-2 text-[11px]"
                    >
                      <div>
                        <div className="font-bold text-white">
                          {acc.name} <span className="font-mono text-[10px] text-slate-400">#{acc.login}</span>
                        </div>
                        <div className="text-[10px] text-cyan-300">{acc.strategy} · {acc.openTrades} pos</div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="font-bold text-slate-100">${acc.balance.toLocaleString()}</div>
                        <div className={acc.floatingPnl >= 0 ? "text-emerald-400" : "text-rose-400"}>
                          {acc.floatingPnl >= 0 ? "+" : ""}${acc.floatingPnl.toFixed(0)} · DD {acc.drawdownPct}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. 20 STAFF DIRECTORY + ENERGY/FITNESS + RECENT ACTIVITY */}
            {activeSimModal === "directory" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {staffVitals.map((st) => (
                    <div
                      key={st.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 text-[11px]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{st.name}</span>
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-cyan-300">
                          L{st.floor}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">{st.role} · {st.activity}</div>
                      <div className="mt-1.5 space-y-1">
                        <div className="flex items-center gap-2 text-[9px]">
                          <span className="w-14 text-emerald-300">Energi {st.energy}%</span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                            <div className="h-full bg-emerald-400" style={{ width: `${st.energy}%` }} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[9px]">
                          <span className="w-14 text-cyan-300">Bugar {st.fitness}%</span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                            <div className="h-full bg-cyan-400" style={{ width: `${st.fitness}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-fuchsia-300">
                    <Activity className="h-3.5 w-3.5" /> Aktivitas Terbaru
                  </div>
                  <div className="space-y-1">
                    {simLogs.slice(0, 8).map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between rounded-lg bg-slate-900/70 px-2.5 py-1.5 text-[11px]"
                      >
                        <span>
                          <b className="text-cyan-300">{log.actor}:</b> {log.text}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">{log.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. UNDANG NGOBROL SANTAI (1-4 KARYAWAN KE LOUNGE CEO) */}
            {activeSimModal === "lounge" && (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  Pilih <b>1–4 karyawan</b> untuk diundang ngobrol santai bersama Bos di <b>Lounge Kamar CEO Lantai 3</b>. Karyawan lain tetap menjalankan jadwal normalnya.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {agents.map((ag) => {
                    const selected = invitedLoungeIds.includes(ag.id);
                    return (
                      <button
                        key={ag.id}
                        type="button"
                        onClick={() => toggleInviteLounge(ag.id)}
                        className={`rounded-xl border p-2.5 text-left text-xs transition ${
                          selected
                            ? "border-amber-400 bg-amber-500/20 text-amber-100"
                            : "border-slate-800 bg-slate-900/75 text-slate-300 hover:border-slate-600"
                        }`}
                      >
                        <div className="font-bold">{ag.name}</div>
                        <div className="text-[10px] text-slate-400">{ag.role}</div>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  disabled={invitedLoungeIds.length === 0}
                  onClick={applyLoungeInvite}
                  className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-cyan-400 py-2.5 text-xs font-black text-slate-950 disabled:opacity-40"
                >
                  ☕ Undang {invitedLoungeIds.length} Karyawan ke Lounge CEO L3
                </button>
              </div>
            )}

            {/* 4. PETA & TELEPORTASI CEPAT */}
            {activeSimModal === "map" && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {TELEPORT_LOCATIONS.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => {
                      const fv =
                        loc.floor === 1
                          ? "l1"
                          : loc.floor === 2
                            ? "l2"
                            : loc.floor === 3
                              ? "l3"
                              : loc.floor === 4
                                ? "roof"
                                : "all";
                      setActiveFloor(fv);
                      const targetBossFloor = (loc.floor >= 1 && loc.floor <= 4 ? loc.floor : 1) as 1 | 2 | 3 | 4;
                      teleportBoss(loc.position, targetBossFloor, loc.label, loc.yaw);
                      pushSimLog("Teleportasi", `Pindah cepat ke ${loc.label}.`, "system");
                      setActiveSimModal(null);
                    }}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2.5 text-left text-xs hover:border-cyan-400/60 hover:bg-slate-800"
                  >
                    <div>
                      <div className="font-bold text-white">{loc.label}</div>
                      <div className="text-[10px] text-cyan-300">{loc.zone}</div>
                    </div>
                    <MapPin className="h-4 w-4 text-fuchsia-400" />
                  </button>
                ))}
              </div>
            )}

            {/* 5. PENGATURAN LENGKAP + SIMPAN CLOUD */}
            {activeSimModal === "settings" && (
              <div className="space-y-3 text-xs">
                <div>
                  <div className="mb-1 font-bold text-slate-300">Kualitas Grafis (Target 30+ FPS HP)</div>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        ["high", "Tinggi (Bloom+Refleksi+Kabut)"],
                        ["balanced", "Sedang (Bloom)"],
                        ["eco", "Rendah (Emissive Hemat)"],
                      ] as [PerformanceMode, string][]
                    ).map(([id, lbl]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPerformanceMode(id)}
                        className={`rounded-xl border p-2 text-[11px] font-bold ${
                          performanceMode === id
                            ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                            : "border-slate-800 bg-slate-900 text-slate-400"
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-1 font-bold text-slate-300">Kecepatan Waktu Game</div>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        ["slow", "Lambat (48 mnt/hari)"],
                        ["normal", "Normal (24 mnt/hari)"],
                        ["fast", "Cepat (8 mnt/hari)"],
                      ] as [TimeSpeed, string][]
                    ).map(([id, lbl]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setTimeSpeed(id)}
                        className={`rounded-xl border p-2 text-[11px] font-bold ${
                          timeSpeed === id
                            ? "border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-200"
                            : "border-slate-800 bg-slate-900 text-slate-400"
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-1 font-bold text-slate-300">Cuaca Dunia Terbuka</div>
                  <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                    {(["dynamic", "clear", "cloudy", "rain", "storm", "fog"] as WeatherMode[]).map(
                      (wm) => (
                        <button
                          key={wm}
                          type="button"
                          onClick={() => setWeatherMode(wm)}
                          className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold ${
                            weatherMode === wm
                              ? "border-sky-400 bg-sky-500/20 text-sky-200"
                              : "border-slate-800 bg-slate-900 text-slate-400"
                          }`}
                        >
                          {weatherLabel[wm]}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2">
                  <span>Siang/Malam otomatis mengikuti jam game</span>
                  <input
                    type="checkbox"
                    checked={autoDayNight}
                    onChange={(e) => setAutoDayNight(e.target.checked)}
                    className="h-4 w-4 accent-cyan-400"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-2.5">
                    <div className="mb-1 flex justify-between text-[11px]">
                      <span>Sensitivitas Kamera</span>
                      <span className="font-mono text-cyan-300">{sensitivity.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min={0.4}
                      max={2.0}
                      step={0.1}
                      value={sensitivity}
                      onChange={(e) => setSensitivity(Number(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-2.5">
                    <div className="mb-1 flex justify-between text-[11px]">
                      <span className="flex items-center gap-1"><Volume2 className="h-3 w-3" /> Volume</span>
                      <span className="font-mono text-cyan-300">{Math.round(volume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={saveProgress}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/20 py-2.5 font-bold text-emerald-300 border border-emerald-400/50 hover:bg-emerald-500/30"
                  >
                    <Save className="h-4 w-4" /> Simpan Progres (Cloud)
                  </button>
                  <button
                    type="button"
                    onClick={loadProgress}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-cyan-500/20 py-2.5 font-bold text-cyan-200 border border-cyan-400/50 hover:bg-cyan-500/30"
                  >
                    <UploadCloud className="h-4 w-4" /> Muat Simpanan Terakhir
                  </button>
                </div>
                {saveStatus && (
                  <div className="text-center text-[11px] font-bold text-emerald-300">
                    {saveStatus}
                  </div>
                )}
              </div>
            )}

            {/* 6. BANTUAN KONTROL LENGKAP */}
            {activeSimModal === "help" && (
              <div className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-3">
                {[
                  ["WASD", "Jalan karakter"],
                  ["Shift", "Lari cepat"],
                  ["Space", "Lompat / Rem tangan"],
                  ["F", "Naik / Turun 9 Mobil"],
                  ["W/S + A/D", "Gas, Rem & Belok mobil"],
                  ["Q / C", "Klakson / Kamera mobil"],
                  ["V", "Kamera 1st / 3rd Person"],
                  ["O", "Mode Orbit / Drone / Atas"],
                  ["Tab", "Direktori 20 Staf"],
                  ["M", "Peta & Teleportasi"],
                  ["L", "Laporan MT5 (18 Akun)"],
                  ["N / T", "Cuaca / Kecepatan Waktu"],
                  ["H", "Sembunyikan HUD"],
                  ["Esc", "Kembali ke Ruang Kontrol"],
                ].map(([k, d]) => (
                  <div key={k} className="rounded-lg border border-slate-800 bg-slate-900/80 p-2">
                    <div className="font-mono font-black text-cyan-300">{k}</div>
                    <div className="text-slate-300">{d}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
