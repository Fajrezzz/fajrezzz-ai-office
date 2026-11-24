# FAJREZZZ AI OFFICE — Kantor 3D

Kantor virtual 3D isometrik bergaya cyberpunk: gedung 3 lantai + **Crown Sky Deck** di atap, 15 karyawan robot AI, Bos Player, lift, kendaraan, dan panel Agent Management / Live Activity. Dibangun dengan Next.js 15, React 19, React Three Fiber, drei, dan postprocessing.

> Repo ini **hanya berisi Kantor 3D**. Semua fitur lain (studio video/Remotion, pipeline 7 divisi, kids studio, API AI generation, laporan render, tes) sudah dihapus. File di `src/components/office3d/` **tidak diubah satu baris pun** — hanya navigasi di sekelilingnya yang dipangkas.

## Jalankan

```bash
npm ci
npm run dev        # http://localhost:3000
npm run build      # build produksi
npm run lint
npm run typecheck
```

## Struktur

| Path | Isi |
|---|---|
| `src/app/page.tsx`, `layout.tsx`, `globals.css` | kerangka Next.js App Router |
| `src/components/OfficeShell.tsx` | shell: sidebar, header, area kerja |
| `src/components/office3d/` | **inti Kantor 3D** (23 file): `OfficeScene`, `DynamicVirtualOffice`, `VirtualOfficeCanvas`, `OfficeArchitecture`, `CrownSkyDeck`, `RooftopAttractions`, `InteriorFurnishing`, `InteriorActivityRooms`, `WorkstationCluster`, `RobotCharacter`, `RealisticHumanAvatar`, `BossPlayer`, `DrivableVehicles`, `CyberOutdoorCampus`, `CyberpunkSkyline`, `WeatherEffects`, `FloorPlanMiniMap`, `LiftRideHUD`, `NandaSimulatorHUD`, `SceneControlsHUD`, `AdaptivePerformanceController`, `OfficeExtrasStaff`, `realisticTextures` |
| `src/lib/office3d/` | logika pendukung scene: `interior-layout`, `elevator-controller`, `badminton-rally` |
| `src/store/` | `OfficeContext`, `SimulatorContext`, `AgencyContext` (state kantor, sim, agen) |
| `src/components/dashboard/` | panel `AgentManagementPanel` (15 agent / 7 divisi) & `LiveActivityPanel` |
| `src/components/layout/` | `Sidebar` (menu: Kantor 3D, Tim 15) & `TopHeader` |
| `src/app/api/` | route yang dipakai UI: `ai/status`, `work-engine`, `agents/think`, `agents/autopilot-topic`, `pipeline/[division]`, `sim-save` |
| `public/models/` | model avatar `.glb` (Vroid) untuk penghuni kantor |
| `src/middleware.ts` + `src/lib/security/` | guard API (rate limit, blokir tulis lintas-situs) |

## Catatan

- Tanpa kunci API, UI tetap jalan; panggilan AI (think/generate) butuh env provider yang diisi sendiri saat deploy.
- `middleware.ts` memblokir permintaan tulis lintas-situs ke route API.
- Video/laporan yang dulu ada di repo tersimpan di riwayat git (tag/PR lama) dan di Google Drive; working tree sekarang bersih dari aset itu.
