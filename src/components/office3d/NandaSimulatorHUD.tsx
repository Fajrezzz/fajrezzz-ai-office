"use client";

import React from "react";
import {
  Activity,
  MapPin,
  Save,
  UploadCloud,
  Volume2,
  X,
} from "lucide-react";
import { useOffice } from "@/store/OfficeContext";
import {
  TELEPORT_LOCATIONS,
  useSimulator,
  type TimeSpeed,
  type WeatherMode,
} from "@/store/SimulatorContext";
import type { BossFloor, FloorView, PerformanceMode } from "@/types/office";

export function NandaSimulatorHUD() {
  const {
    performanceMode,
    setPerformanceMode,
    setActiveFloor,
    teleportBoss,
    agents,
  } = useOffice();

  const {
    timeSpeed,
    setTimeSpeed,
    autoDayNight,
    setAutoDayNight,
    weatherMode,
    setWeatherMode,
    showHud,
    toggleHud,
    sensitivity,
    setSensitivity,
    volume,
    setVolume,
    activeSimModal,
    setActiveSimModal,
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
    pushSimLog,
    saveStatus,
    saveProgress,
    loadProgress,
  } = useSimulator();

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
      {/* Top location/clock/weather ticker bar removed for a calm, uncluttered 3D viewport */}

      {/* DRIVING SPEEDOMETER & CONTROLS BANNER WHEN DRIVING ANY OF THE 9 REALISTIC VEHICLES */}
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
      {activeSimModal && activeSimModal !== "mt5" && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm">
          <div className="max-h-[84vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-cyan-400/35 bg-slate-950/95 p-4 text-slate-100 shadow-2xl">
            <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-black tracking-wide text-cyan-200">
                {activeSimModal === "directory" && `👥 DIREKTORI ${staffVitals.length} KARYAWAN KANTOR`}
                {activeSimModal === "lounge" && "☕ UNDANG NGOBROL SANTAI (LOUNGE CEO L3)"}
                {activeSimModal === "map" && "🗺️ PETA KANTOR & TELEPORTASI CEPAT"}
                {activeSimModal === "settings" && "⚙️ PENGATURAN KANTOR & SIMPAN CLOUD"}
                {activeSimModal === "help" && "🎮 PANDUAN KONTROL KANTOR 3D"}
              </h3>
              <button
                type="button"
                onClick={() => setActiveSimModal(null)}
                className="rounded-lg bg-slate-800 p-1 text-slate-300 hover:bg-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 1. 22 STAFF DIRECTORY + ENERGY/FITNESS + RECENT ACTIVITY */}
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

            {/* 2. UNDANG NGOBROL SANTAI (1-4 KARYAWAN KE LOUNGE CEO) */}
            {activeSimModal === "lounge" && (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  Pilih <b>1–4 karyawan</b> untuk diundang ngobrol santai bersama Bos di <b>Lounge Kamar CEO Lantai 3</b>.
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

            {/* 3. PETA & TELEPORTASI CEPAT */}
            {activeSimModal === "map" && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {TELEPORT_LOCATIONS.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => {
                      const fv: FloorView =
                        loc.floor === 1
                          ? "l1"
                          : loc.floor === 2
                            ? "l2"
                            : loc.floor === 3
                              ? "l3"
                              : loc.floor === 4
                                ? "l4"
                                : loc.floor === 5
                                  ? "l5"
                                  : loc.floor === 6
                                    ? "roof"
                                    : "all";
                      setActiveFloor(fv);
                      const targetBossFloor: BossFloor = (
                        loc.floor >= 1 && loc.floor <= 6 ? loc.floor : 1
                      ) as BossFloor;
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

            {/* 4. PENGATURAN LENGKAP + SIMPAN CLOUD */}
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

            {/* 5. BANTUAN KONTROL LENGKAP */}
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
                  ["Tab", "Direktori 22 Karyawan"],
                  ["M", "Peta & Teleportasi"],
                  ["N / T", "Cuaca / Kecepatan Waktu"],
                  ["H", "Sembunyikan HUD"],
                  ["Esc", "Kembali ke Lobi Utama"],
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
