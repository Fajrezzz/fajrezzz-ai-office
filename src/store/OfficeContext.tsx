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
import {
  FLOOR_1_Y,
  FLOOR_2_Y,
  FLOOR_3_Y,
  INITIAL_ACTIVITIES,
  INITIAL_AGENTS,
  INITIAL_TASKS,
  INITIAL_WORKSTATIONS,
  OFFICE_WAYPOINTS,
} from "@/lib/data/initial-office-data";
import type { CreateTaskInput } from "@/lib/services/data-adapter";
import type {
  ActivityEvent,
  ActivitySeverity,
  BossActionState,
  BossFloor,
  BossTeleportCommand,
  CameraPreset,
  FloorView,
  LightingPreset,
  NavSection,
  OfficeAgent,
  OfficeTask,
  PerformanceMode,
  RobotAnimationState,
  TaskStatus,
  Vector3Tuple,
  WorkDealStatus,
  WorkOrderDeliverable,
  WorkOrderInput,
  Workstation,
} from "@/types/office";

export const ROOF_Y = 11.8;

export const BOSS_FLOOR_ELEVATIONS: Record<BossFloor, number> = {
  1: FLOOR_1_Y,
  2: FLOOR_2_Y,
  3: FLOOR_3_Y,
  4: ROOF_Y,
};

function formatClock(date = new Date()): string {
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export interface CameraFocusCommand {
  target: Vector3Tuple;
  offset?: Vector3Tuple;
  tick: number;
}

export interface CameraNudgeState {
  forward: number;
  right: number;
  up: number;
}

export interface BossJoystickState {
  x: number; // -1 (left) to +1 (right)
  y: number; // -1 (backward) to +1 (forward)
}

interface OfficeContextValue {
  activeSection: NavSection;
  setActiveSection: (section: NavSection) => void;
  agents: OfficeAgent[];
  workstations: Workstation[];
  tasks: OfficeTask[];
  activities: ActivityEvent[];
  selectedAgentId: string | null;
  setSelectedAgentId: (id: string | null) => void;
  cameraPreset: CameraPreset;
  cameraResetTick: number;
  setCameraPreset: (preset: CameraPreset) => void;
  cameraFocusCommand: CameraFocusCommand | null;
  focusCameraOn: (target: Vector3Tuple, offset?: Vector3Tuple) => void;
  focusOnAgent: (agentId: string) => void;
  cameraNudgeRef: React.MutableRefObject<CameraNudgeState>;
  activeFloor: FloorView;
  setActiveFloor: (floor: FloorView) => void;
  lightingPreset: LightingPreset;
  setLightingPreset: (lighting: LightingPreset) => void;
  autoRotate: boolean;
  setAutoRotate: (rotate: boolean) => void;
  performanceMode: PerformanceMode;
  performanceReady: boolean;
  setPerformanceMode: (mode: PerformanceMode) => void;
  isSimulationRunning: boolean;
  setIsSimulationRunning: (running: boolean) => void;
  showLabelsIn3D: boolean;
  setShowLabelsIn3D: (show: boolean) => void;
  // BOS FAJREZ Playable Character State
  isBossMode: boolean;
  setIsBossMode: (enabled: boolean) => void;
  bossFollowCamera: boolean;
  setBossFollowCamera: (follow: boolean) => void;
  bossFloor: BossFloor;
  setBossFloor: (floor: BossFloor) => void;
  bossActionState: BossActionState;
  setBossActionState: (state: BossActionState) => void;
  bossPositionRef: React.MutableRefObject<Vector3Tuple>;
  bossJoystickRef: React.MutableRefObject<BossJoystickState>;
  bossTeleportCommand: BossTeleportCommand | null;
  teleportBoss: (
    position: Vector3Tuple,
    floor: BossFloor,
    label?: string,
    yaw?: number
  ) => void;
  moveBossToFloor: (floor: BossFloor) => void;
  // Zero-Cost Work Engine & Revenue Tracker
  workOrders: WorkOrderDeliverable[];
  isGeneratingWork: boolean;
  runWorkOrder: (input: WorkOrderInput) => Promise<WorkOrderDeliverable | null>;
  updateWorkOrderDeal: (
    orderId: string,
    dealStatus: WorkDealStatus,
    dealValueIdr?: number
  ) => void;
  deleteWorkOrder: (orderId: string) => void;
  // Agent & Task actions
  setAgentStatus: (agentId: string, status: RobotAnimationState) => void;
  sendAgentToWaypoint: (agentId: string, waypointId: string) => void;
  dispatchAgentRealWork: (
    agentId: string,
    mode: "working" | "idle" | "error",
    waypointId: string,
    actionLabel: string
  ) => void;
  assignAgentWorkstation: (agentId: string, workstationId: string) => void;
  notifyAgentArrived: (agentId: string, waypointId: string) => void;
  createTask: (input: CreateTaskInput) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  assignTaskToAgent: (taskId: string, agentId: string | null) => void;
  deleteTask: (taskId: string) => void;
  addActivity: (
    actor: string,
    actorType: ActivityEvent["actorType"],
    message: string,
    severity?: ActivitySeverity,
    zone?: string
  ) => void;
  clearActivities: () => void;
}

const OfficeContext = createContext<OfficeContextValue | null>(null);

const IDLE_LOUNGE_WAYPOINTS: Record<string, string> = {
  "staff-01": "wp-seat-06",
  "staff-02": "wp-seat-03",
  "staff-03": "wp-seat-07",
  "staff-04": "wp-seat-05",
  "staff-05": "wp-seat-01",
  "staff-06": "wp-seat-02",
  "staff-07": "wp-seat-04",
  "staff-08": "wp-seat-08",
};

export function OfficeProvider({ children }: { children: React.ReactNode }) {
  const [activeSection, setActiveSection] = useState<NavSection>("dashboard");
  // All agents start genuinely IDLE (ngopi/santai) until a real division runs!
  const [agents, setAgents] = useState<OfficeAgent[]>(() =>
    INITIAL_AGENTS.map((a) => {
      const idleWp = IDLE_LOUNGE_WAYPOINTS[a.id] ?? a.currentWaypointId;
      return {
        ...a,
        status: "idle",
        pendingWorkState: "idle",
        currentWaypointId: idleWp,
        targetWaypointId: idleWp,
        simulatedLoad: 0,
        currentActionLabel: "☕ Antrean kosong — IDLE / ngopi santai",
      };
    })
  );
  const [workstations, setWorkstations] =
    useState<Workstation[]>(INITIAL_WORKSTATIONS);
  const [tasks, setTasks] = useState<OfficeTask[]>(INITIAL_TASKS);
  const [workOrders, setWorkOrders] = useState<WorkOrderDeliverable[]>([]);
  const [isGeneratingWork, setIsGeneratingWork] = useState<boolean>(false);
  const [activities, setActivities] =
    useState<ActivityEvent[]>(INITIAL_ACTIVITIES);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(
    "staff-01"
  );
  const [cameraPreset, setCameraPresetState] =
    useState<CameraPreset>("front");
  const [cameraResetTick, setCameraResetTick] = useState<number>(0);
  const [cameraFocusCommand, setCameraFocusCommand] =
    useState<CameraFocusCommand | null>(null);
  const cameraNudgeRef = useRef<CameraNudgeState>({
    forward: 0,
    right: 0,
    up: 0,
  });

  // BOS FAJREZ Playable Character Refs & State
  const [isBossMode, setIsBossModeState] = useState<boolean>(false);
  const [bossFollowCamera, setBossFollowCamera] = useState<boolean>(true);
  const [bossFloor, setBossFloor] = useState<BossFloor>(1);
  const [bossActionState, setBossActionState] =
    useState<BossActionState>("idle");
  const bossPositionRef = useRef<Vector3Tuple>([2.8, FLOOR_1_Y, 6.2]);
  const bossJoystickRef = useRef<BossJoystickState>({ x: 0, y: 0 });
  const [bossTeleportCommand, setBossTeleportCommand] =
    useState<BossTeleportCommand | null>(null);

  const [activeFloor, setActiveFloorState] = useState<FloorView>("all");
  const [lightingPreset, setLightingPreset] =
    useState<LightingPreset>("day");
  const [autoRotate, setAutoRotate] = useState<boolean>(false);

  const syncFloorCutawayForBoss = useCallback((floor: BossFloor) => {
    if (floor === 1) {
      setActiveFloorState("all");
    } else if (floor === 2) {
      setActiveFloorState("l2");
    } else if (floor === 3) {
      setActiveFloorState("l3");
    } else {
      setActiveFloorState("roof");
    }
  }, []);

  const setIsBossMode = useCallback(
    (enabled: boolean) => {
      setIsBossModeState(enabled);
      if (enabled) {
        setAutoRotate(false);
        setBossFollowCamera(true);
        syncFloorCutawayForBoss(bossFloor);
      } else {
        bossJoystickRef.current.x = 0;
        bossJoystickRef.current.y = 0;
      }
    },
    [bossFloor, syncFloorCutawayForBoss]
  );

  const setCameraPreset = useCallback((preset: CameraPreset) => {
    setBossFollowCamera(false);
    setCameraFocusCommand(null);
    setCameraPresetState(preset);
    setCameraResetTick((tick) => tick + 1);
    if (preset === "interior") {
      setActiveFloorState("l2");
    } else if (preset === "executive") {
      setActiveFloorState("l3");
    } else if (preset === "rooftop") {
      setActiveFloorState("roof");
    } else {
      setActiveFloorState("all");
    }
  }, []);

  const setActiveFloor = useCallback((floor: FloorView) => {
    setBossFollowCamera(false);
    setCameraFocusCommand(null);
    setActiveFloorState(floor);
    if (floor === "l2") {
      setCameraPresetState("interior");
    } else if (floor === "l3") {
      setCameraPresetState("executive");
    } else if (floor === "roof") {
      setCameraPresetState("rooftop");
    } else if (floor === "all") {
      setCameraPresetState("front");
    } else if (floor === "l1") {
      setCameraPresetState("pool");
    }
    setCameraResetTick((tick) => tick + 1);
  }, []);

  const focusCameraOn = useCallback(
    (target: Vector3Tuple, offset?: Vector3Tuple) => {
      setBossFollowCamera(false);
      setAutoRotate(false);
      setCameraFocusCommand({
        target,
        offset,
        tick: Date.now() + Math.random(),
      });
    },
    []
  );

  const focusOnAgent = useCallback(
    (agentId: string) => {
      const targetAgent = agents.find((a) => a.id === agentId);
      if (!targetAgent) return;
      setSelectedAgentId(agentId);
      const wp = OFFICE_WAYPOINTS[targetAgent.currentWaypointId];
      if (!wp) return;

      if (wp.floor === 2) {
        setActiveFloorState("l2");
      } else if (wp.floor === 3) {
        setActiveFloorState("l3");
      } else {
        setActiveFloorState("all");
      }

      focusCameraOn(
        [wp.position[0], wp.position[1] + 1.15, wp.position[2]],
        [3.6, 2.4, 4.6]
      );
    },
    [agents, focusCameraOn]
  );

  const [performanceMode, setPerformanceModeState] =
    useState<PerformanceMode>("balanced");
  const [performanceReady, setPerformanceReady] = useState<boolean>(false);
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(true);
  const [showLabelsIn3D, setShowLabelsIn3D] = useState<boolean>(true);

  const setPerformanceMode = useCallback((mode: PerformanceMode) => {
    setPerformanceModeState(mode);
    try {
      window.localStorage.setItem("fajrezzz_perf_mode", mode);
    } catch {
      // Ignore storage errors
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const savedPerf = window.localStorage.getItem("fajrezzz_perf_mode");
      if (
        savedPerf === "eco" ||
        savedPerf === "balanced" ||
        savedPerf === "high"
      ) {
        setPerformanceModeState(savedPerf);
      } else {
        const isMobileViewport = window.innerWidth < 768;
        const isAndroidUA = /Android/i.test(navigator.userAgent);
        const isCoarsePointer =
          typeof window.matchMedia === "function" &&
          window.matchMedia("(pointer: coarse)").matches;
        const hasLowHardwareConcurrency =
          typeof navigator.hardwareConcurrency === "number" &&
          navigator.hardwareConcurrency <= 4;

        if (
          isMobileViewport ||
          isAndroidUA ||
          isCoarsePointer ||
          hasLowHardwareConcurrency
        ) {
          setPerformanceModeState("eco");
        }
      }

      const savedTasks = window.localStorage.getItem("fajrezzz_local_tasks_v2");
      if (savedTasks) {
        const parsed = JSON.parse(savedTasks) as OfficeTask[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTasks(parsed);
        }
      }

      const savedOrders = window.localStorage.getItem(
        "fajrezzz_work_orders_v1"
      );
      if (savedOrders) {
        const parsedOrders = JSON.parse(savedOrders) as WorkOrderDeliverable[];
        if (Array.isArray(parsedOrders)) {
          setWorkOrders(parsedOrders);
        }
      }
    } catch {
      // Ignore invalid localStorage state
    } finally {
      setPerformanceReady(true);
    }
  }, []);

  useEffect(() => {
    if (!performanceReady || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        "fajrezzz_local_tasks_v2",
        JSON.stringify(tasks)
      );
      window.localStorage.setItem(
        "fajrezzz_work_orders_v1",
        JSON.stringify(workOrders.slice(0, 25))
      );
    } catch {
      // Ignore quota errors
    }
  }, [performanceReady, tasks, workOrders]);

  const addActivity = useCallback(
    (
      actor: string,
      actorType: ActivityEvent["actorType"],
      message: string,
      severity: ActivitySeverity = "info",
      zone?: string
    ) => {
      const event: ActivityEvent = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: formatClock(),
        actor,
        actorType,
        message,
        severity,
        zone,
      };
      setActivities((prev) => [event, ...prev].slice(0, 60));
    },
    []
  );

  const teleportBoss = useCallback(
    (
      position: Vector3Tuple,
      floor: BossFloor,
      label?: string,
      yaw?: number
    ) => {
      setBossFloor(floor);
      bossPositionRef.current = [...position];
      setBossTeleportCommand({
        position,
        floor,
        yaw,
        tick: Date.now() + Math.random(),
      });
      syncFloorCutawayForBoss(floor);
      setBossFollowCamera(true);
      if (label) {
        addActivity(
          "BOS FAJREZ",
          "user",
          `Berpindah ke ${label} (Lantai ${floor === 4 ? "Atap" : floor}).`,
          "success",
          label
        );
      }
    },
    [addActivity, syncFloorCutawayForBoss]
  );

  const moveBossToFloor = useCallback(
    (floor: BossFloor) => {
      const cur = bossPositionRef.current;
      // Keep X/Z inside building interior when going up to L2/L3/Roof
      const clampedX = Math.max(-12.2, Math.min(12.2, cur[0]));
      const clampedZ =
        floor === 1
          ? Math.max(-8.5, Math.min(16.8, cur[2]))
          : Math.max(-8.5, Math.min(4.2, cur[2]));
      const nextY = BOSS_FLOOR_ELEVATIONS[floor];
      const floorName =
        floor === 1
          ? "Lantai 1 & Area Kolam"
          : floor === 2
          ? "Lantai 2 Operations Hall"
          : floor === 3
          ? "Lantai 3 Executive Suite"
          : "Atap Helipad & Padel";

      teleportBoss([clampedX, nextY, clampedZ], floor, floorName);
    },
    [teleportBoss]
  );

  const clearActivities = useCallback(() => {
    setActivities([
      {
        id: `act-reset-${Date.now()}`,
        timestamp: formatClock(),
        actor: "SYSTEM",
        actorType: "system",
        message: "Log aktivitas simulasi dibersihkan oleh pengguna.",
        severity: "system",
        zone: "Core OS",
      },
    ]);
  }, []);

  const setAgentStatus = useCallback(
    (agentId: string, status: RobotAnimationState) => {
      setAgents((prev) =>
        prev.map((agent) => {
          if (agent.id !== agentId) return agent;

          let targetWaypointId = agent.targetWaypointId;
          let currentActionLabel = agent.currentActionLabel;

          if (status === "walking") {
            const candidates = agent.patrolWaypoints.filter(
              (wp) => wp !== agent.currentWaypointId
            );
            targetWaypointId =
              candidates[Math.floor(Math.random() * candidates.length)] ??
              agent.patrolWaypoints[0] ??
              agent.currentWaypointId;
            const destLabel =
              OFFICE_WAYPOINTS[targetWaypointId]?.label ?? targetWaypointId;
            currentActionLabel = `Berjalan menuju ${destLabel}`;
          } else if (status === "working") {
            const ws = workstations.find(
              (w) => w.id === agent.assignedWorkstationId
            );
            if (
              agent.floor === 2 &&
              ws &&
              agent.currentWaypointId !== ws.waypointId
            ) {
              targetWaypointId = ws.waypointId;
              currentActionLabel = `Menuju ${ws.name} untuk simulasi kerja`;
            } else {
              currentActionLabel = `Simulasi kerja aktif di ${
                OFFICE_WAYPOINTS[agent.currentWaypointId]?.label ?? "Area Kantor"
              }`;
            }
          } else if (status === "idle") {
            currentActionLabel = "Mode idle visual (bernapas & melihat sekitar)";
          } else {
            currentActionLabel = "Mode standby istirahat";
          }

          return {
            ...agent,
            status:
              status === "working" && targetWaypointId !== agent.currentWaypointId
                ? "walking"
                : status,
            targetWaypointId,
            currentActionLabel,
            simulatedLoad:
              status === "working"
                ? 74
                : status === "walking"
                ? 48
                : status === "idle"
                ? 22
                : 8,
          };
        })
      );

      const agent = agents.find((a) => a.id === agentId);
      if (agent) {
        addActivity(
          agent.name,
          "robot-placeholder",
          `Status animasi diubah menjadi ${status.toUpperCase()} (simulasi lokal).`,
          status === "standby" ? "warning" : "info",
          OFFICE_WAYPOINTS[agent.currentWaypointId]?.label
        );
      }
    },
    [addActivity, agents, workstations]
  );

  const sendAgentToWaypoint = useCallback(
    (agentId: string, waypointId: string) => {
      const destination = OFFICE_WAYPOINTS[waypointId];
      if (!destination) return;

      setAgents((prev) =>
        prev.map((agent) => {
          if (agent.id !== agentId) return agent;
          if (agent.currentWaypointId === waypointId) {
            return {
              ...agent,
              floor: destination.floor,
              status: "idle",
              targetWaypointId: waypointId,
              currentActionLabel: `Sudah berada di ${destination.label}`,
            };
          }
          return {
            ...agent,
            floor: destination.floor,
            status: "walking",
            targetWaypointId: waypointId,
            currentActionLabel: `Berjalan menuju ${destination.label}`,
            simulatedLoad: 50,
          };
        })
      );

      const targetAgent = agents.find((a) => a.id === agentId);
      if (targetAgent) {
        addActivity(
          targetAgent.name,
          "robot-placeholder",
          `Navigasi visual diarahkan ke ${destination.label}.`,
          "info",
          destination.label
        );
      }
    },
    [addActivity, agents]
  );

  const assignAgentWorkstation = useCallback(
    (agentId: string, workstationId: string) => {
      const ws = workstations.find((w) => w.id === workstationId);
      if (!ws) return;

      setWorkstations((prev) =>
        prev.map((item) => {
          if (item.id === workstationId) {
            return { ...item, assignedAgentId: agentId };
          }
          if (item.assignedAgentId === agentId) {
            return { ...item, assignedAgentId: null };
          }
          return item;
        })
      );

      setAgents((prev) =>
        prev.map((agent) => {
          if (agent.id !== agentId) return agent;
          const alreadyThere = agent.currentWaypointId === ws.waypointId;
          return {
            ...agent,
            floor: ws.floor,
            assignedWorkstationId: workstationId,
            targetWaypointId: ws.waypointId,
            status: alreadyThere ? "working" : "walking",
            currentActionLabel: alreadyThere
              ? `Simulasi aktif di ${ws.name}`
              : `Berpindah menuju ${ws.name}`,
          };
        })
      );

      const targetAgent = agents.find((a) => a.id === agentId);
      if (targetAgent) {
        addActivity(
          targetAgent.name,
          "user",
          `Ditugaskan ke ${ws.code} (${ws.name}).`,
          "success",
          ws.code
        );
      }
    },
    [addActivity, agents, workstations]
  );

  const dispatchAgentRealWork = useCallback(
    (
      agentId: string,
      mode: "working" | "idle" | "error",
      waypointId: string,
      actionLabel: string
    ) => {
      const dest = OFFICE_WAYPOINTS[waypointId];
      if (!dest) return;

      setAgents((prev) =>
        prev.map((agent) => {
          if (agent.id !== agentId) return agent;
          const alreadyThere = agent.currentWaypointId === waypointId;
          return {
            ...agent,
            floor: dest.floor,
            targetWaypointId: waypointId,
            pendingWorkState: mode,
            status: alreadyThere ? mode : "walking",
            simulatedLoad: mode === "working" ? 100 : 0,
            currentActionLabel: actionLabel,
          };
        })
      );
    },
    []
  );

  const notifyAgentArrived = useCallback(
    (agentId: string, waypointId: string) => {
      const wp = OFFICE_WAYPOINTS[waypointId];
      setAgents((prev) =>
        prev.map((agent) => {
          if (agent.id !== agentId) return agent;
          // Respect ONLY real pendingWorkState (never fake-work when queue is empty!)
          const nextStatus: RobotAnimationState =
            agent.pendingWorkState ?? "idle";

          return {
            ...agent,
            floor: wp?.floor ?? agent.floor,
            currentWaypointId: waypointId,
            targetWaypointId: waypointId,
            status: nextStatus,
            simulatedLoad: nextStatus === "working" ? 100 : 0,
            currentActionLabel:
              agent.currentActionLabel ||
              (nextStatus === "working"
                ? `Mengerjakan tugas nyata di ${wp?.label ?? "Meja"}`
                : nextStatus === "error"
                ? `Error di ${wp?.label ?? "Meja"}`
                : `☕ IDLE / santai di ${wp?.label ?? "Lounge"}`),
          };
        })
      );
    },
    []
  );

  const createTask = useCallback(
    (input: CreateTaskInput) => {
      const now = new Date().toISOString();
      const newTask: OfficeTask = {
        id: `task-${Date.now()}`,
        title: input.title.trim(),
        description: input.description.trim(),
        status: "backlog",
        priority: input.priority,
        category: input.category,
        assignedAgentId: input.assignedAgentId,
        createdAt: now,
        updatedAt: now,
        isSimulatedPlaceholder: true,
      };
      setTasks((prev) => [newTask, ...prev]);

      const assigned = agents.find((a) => a.id === input.assignedAgentId);
      addActivity(
        "OPERATOR",
        "user",
        `Task baru dibuat: "${newTask.title}"${
          assigned ? ` → ${assigned.name}` : ""
        }.`,
        "success",
        "Task Manager"
      );
    },
    [addActivity, agents]
  );

  const updateTaskStatus = useCallback(
    (taskId: string, status: TaskStatus) => {
      let updatedTaskTitle = "";
      let linkedAgentId: string | null = null;

      setTasks((prev) =>
        prev.map((task) => {
          if (task.id !== taskId) return task;
          updatedTaskTitle = task.title;
          linkedAgentId = task.assignedAgentId;
          return {
            ...task,
            status,
            updatedAt: new Date().toISOString(),
          };
        })
      );

      if (status === "in_progress" && linkedAgentId) {
        const agent = agents.find((a) => a.id === linkedAgentId);
        const ws = workstations.find(
          (w) => w.id === agent?.assignedWorkstationId
        );
        if (agent && ws) {
          sendAgentToWaypoint(agent.id, ws.waypointId);
        }
      }

      if (updatedTaskTitle) {
        addActivity(
          "OPERATOR",
          "user",
          `Status task "${updatedTaskTitle}" diubah ke ${status
            .replace("_", " ")
            .toUpperCase()}.`,
          status === "done" ? "success" : "info",
          "Task Manager"
        );
      }
    },
    [addActivity, agents, sendAgentToWaypoint, workstations]
  );

  const assignTaskToAgent = useCallback(
    (taskId: string, agentId: string | null) => {
      let taskTitle = "";
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id !== taskId) return task;
          taskTitle = task.title;
          return {
            ...task,
            assignedAgentId: agentId,
            updatedAt: new Date().toISOString(),
          };
        })
      );

      const assigned = agents.find((a) => a.id === agentId);
      if (taskTitle) {
        addActivity(
          "OPERATOR",
          "user",
          `Task "${taskTitle}" ditugaskan ke ${
            assigned ? `${assigned.name} (Placeholder)` : "Unassigned"
          }.`,
          "info",
          "Task Manager"
        );
      }
    },
    [addActivity, agents]
  );

  const deleteTask = useCallback(
    (taskId: string) => {
      const target = tasks.find((t) => t.id === taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (target) {
        addActivity(
          "OPERATOR",
          "user",
          `Task "${target.title}" dihapus dari daftar.`,
          "warning",
          "Task Manager"
        );
      }
    },
    [addActivity, tasks]
  );

  const runWorkOrder = useCallback(
    async (input: WorkOrderInput): Promise<WorkOrderDeliverable | null> => {
      setIsGeneratingWork(true);

      // Dispatch all 10 staff to actively work on Bos FAJREZ's order in 3D!
      setAgents((prev) =>
        prev.map((agent) => {
          const homeWs = workstations.find(
            (w) => w.id === agent.assignedWorkstationId
          );
          if (agent.floor === 2 && homeWs) {
            const atDesk = agent.currentWaypointId === homeWs.waypointId;
            return {
              ...agent,
              status: atDesk ? "working" : "walking",
              targetWaypointId: homeWs.waypointId,
              simulatedLoad: 88,
              currentActionLabel: `Mengerjakan paket "${input.businessName}"`,
            };
          }
          return {
            ...agent,
            status: "working",
            simulatedLoad: 82,
            currentActionLabel: `Menyiapkan strategi & outreach "${input.businessName}"`,
          };
        })
      );

      addActivity(
        "BOS FAJREZ",
        "user",
        `Perintah kerja baru dikirim ke 10 karyawan: "${input.businessName}" (${input.niche} - ${input.city}).`,
        "info",
        "Work Studio"
      );

      try {
        const res = await fetch("/api/work-engine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) return null;

        const data = (await res.json()) as {
          ok: boolean;
          deliverable: WorkOrderDeliverable;
        };

        if (data.ok && data.deliverable) {
          setWorkOrders((prev) => [data.deliverable, ...prev]);
          addActivity(
            "10 KARYAWAN",
            "robot-placeholder",
            `Paket "${input.businessName}" selesai: Website HTML, 7 Naskah Viral, 3 Script WA/DM & Invoice (Rp 0 Gratis).`,
            "success",
            "Work Studio"
          );
          return data.deliverable;
        }
        return null;
      } catch {
        addActivity(
          "SYSTEM",
          "system",
          `Gagal memproduksi paket "${input.businessName}". Coba ulangi.`,
          "warning",
          "Work Studio"
        );
        return null;
      } finally {
        setIsGeneratingWork(false);
      }
    },
    [addActivity, workstations]
  );

  const updateWorkOrderDeal = useCallback(
    (orderId: string, dealStatus: WorkDealStatus, dealValueIdr?: number) => {
      setWorkOrders((prev) =>
        prev.map((order) => {
          if (order.id !== orderId) return order;
          return {
            ...order,
            dealStatus,
            dealValueIdr:
              typeof dealValueIdr === "number" && Number.isFinite(dealValueIdr)
                ? Math.max(0, Math.round(dealValueIdr))
                : order.dealValueIdr,
          };
        })
      );

      const target = workOrders.find((o) => o.id === orderId);
      if (target) {
        addActivity(
          "BOS FAJREZ",
          "user",
          `Status proyek "${target.input.businessName}" diperbarui menjadi ${dealStatus.toUpperCase()}.`,
          dealStatus === "paid" ? "success" : "info",
          "Revenue Tracker"
        );
      }
    },
    [addActivity, workOrders]
  );

  const deleteWorkOrder = useCallback((orderId: string) => {
    setWorkOrders((prev) => prev.filter((o) => o.id !== orderId));
  }, []);

  const value = useMemo<OfficeContextValue>(
    () => ({
      activeSection,
      setActiveSection,
      agents,
      workstations,
      tasks,
      activities,
      selectedAgentId,
      setSelectedAgentId,
      cameraPreset,
      cameraResetTick,
      setCameraPreset,
      cameraFocusCommand,
      focusCameraOn,
      focusOnAgent,
      cameraNudgeRef,
      activeFloor,
      setActiveFloor,
      lightingPreset,
      setLightingPreset,
      autoRotate,
      setAutoRotate,
      performanceMode,
      performanceReady,
      setPerformanceMode,
      isSimulationRunning,
      setIsSimulationRunning,
      showLabelsIn3D,
      setShowLabelsIn3D,
      isBossMode,
      setIsBossMode,
      bossFollowCamera,
      setBossFollowCamera,
      bossFloor,
      setBossFloor,
      bossActionState,
      setBossActionState,
      bossPositionRef,
      bossJoystickRef,
      bossTeleportCommand,
      teleportBoss,
      moveBossToFloor,
      workOrders,
      isGeneratingWork,
      runWorkOrder,
      updateWorkOrderDeal,
      deleteWorkOrder,
      setAgentStatus,
      sendAgentToWaypoint,
      dispatchAgentRealWork,
      assignAgentWorkstation,
      notifyAgentArrived,
      createTask,
      updateTaskStatus,
      assignTaskToAgent,
      deleteTask,
      addActivity,
      clearActivities,
    }),
    [
      activeSection,
      agents,
      workstations,
      tasks,
      activities,
      selectedAgentId,
      cameraPreset,
      cameraResetTick,
      setCameraPreset,
      cameraFocusCommand,
      focusCameraOn,
      focusOnAgent,
      activeFloor,
      setActiveFloor,
      lightingPreset,
      autoRotate,
      performanceMode,
      performanceReady,
      setPerformanceMode,
      isSimulationRunning,
      showLabelsIn3D,
      isBossMode,
      setIsBossMode,
      bossFollowCamera,
      bossFloor,
      bossActionState,
      bossTeleportCommand,
      teleportBoss,
      moveBossToFloor,
      workOrders,
      isGeneratingWork,
      runWorkOrder,
      updateWorkOrderDeal,
      deleteWorkOrder,
      setAgentStatus,
      sendAgentToWaypoint,
      dispatchAgentRealWork,
      assignAgentWorkstation,
      notifyAgentArrived,
      createTask,
      updateTaskStatus,
      assignTaskToAgent,
      deleteTask,
      addActivity,
      clearActivities,
    ]
  );

  return (
    <OfficeContext.Provider value={value}>{children}</OfficeContext.Provider>
  );
}

export function useOffice() {
  const ctx = useContext(OfficeContext);
  if (!ctx) {
    throw new Error("useOffice must be used within an OfficeProvider");
  }
  return ctx;
}
