"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
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
  CameraPreset,
  NavSection,
  OfficeAgent,
  OfficeTask,
  PerformanceMode,
  RobotAnimationState,
  TaskStatus,
  Workstation,
} from "@/types/office";

function formatClock(date = new Date()): string {
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
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
  performanceMode: PerformanceMode;
  setPerformanceMode: (mode: PerformanceMode) => void;
  isSimulationRunning: boolean;
  setIsSimulationRunning: (running: boolean) => void;
  showLabelsIn3D: boolean;
  setShowLabelsIn3D: (show: boolean) => void;
  setAgentStatus: (agentId: string, status: RobotAnimationState) => void;
  sendAgentToWaypoint: (agentId: string, waypointId: string) => void;
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

export function OfficeProvider({ children }: { children: React.ReactNode }) {
  const [activeSection, setActiveSection] = useState<NavSection>("dashboard");
  const [agents, setAgents] = useState<OfficeAgent[]>(INITIAL_AGENTS);
  const [workstations, setWorkstations] =
    useState<Workstation[]>(INITIAL_WORKSTATIONS);
  const [tasks, setTasks] = useState<OfficeTask[]>(INITIAL_TASKS);
  const [activities, setActivities] =
    useState<ActivityEvent[]>(INITIAL_ACTIVITIES);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(
    "unit-01"
  );
  const [cameraPreset, setCameraPresetState] =
    useState<CameraPreset>("isometric");
  const [cameraResetTick, setCameraResetTick] = useState<number>(0);

  const setCameraPreset = useCallback((preset: CameraPreset) => {
    setCameraPresetState(preset);
    setCameraResetTick((tick) => tick + 1);
  }, []);
  const [performanceMode, setPerformanceMode] =
    useState<PerformanceMode>("balanced");
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(true);
  const [showLabelsIn3D, setShowLabelsIn3D] = useState<boolean>(true);

  // Auto-optimize performance mode for Android / mobile devices
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMobileViewport = window.innerWidth < 768;
    const isAndroidUA = /Android/i.test(navigator.userAgent);
    const hasLowHardwareConcurrency =
      typeof navigator.hardwareConcurrency === "number" &&
      navigator.hardwareConcurrency <= 4;

    if (isMobileViewport || isAndroidUA || hasLowHardwareConcurrency) {
      setPerformanceMode("eco");
    }
  }, []);

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
              "wp-hub-north";
            const destLabel =
              OFFICE_WAYPOINTS[targetWaypointId]?.label ?? targetWaypointId;
            currentActionLabel = `Berjalan menuju ${destLabel}`;
          } else if (status === "working") {
            const ws = workstations.find(
              (w) => w.id === agent.assignedWorkstationId
            );
            if (ws && agent.currentWaypointId !== ws.waypointId) {
              targetWaypointId = ws.waypointId;
              currentActionLabel = `Menuju ${ws.name} untuk simulasi kerja`;
            } else {
              currentActionLabel = `Simulasi kerja aktif di ${ws?.name ?? "Workstation"}`;
            }
          } else if (status === "idle") {
            currentActionLabel = "Mode idle visual (animasi pernapasan & scan)";
          } else {
            currentActionLabel = "Mode standby hemat daya";
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
                ? 68
                : status === "walking"
                ? 44
                : status === "idle"
                ? 18
                : 5,
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
              status: "idle",
              targetWaypointId: waypointId,
              currentActionLabel: `Sudah berada di ${destination.label}`,
            };
          }
          return {
            ...agent,
            status: "walking",
            targetWaypointId: waypointId,
            currentActionLabel: `Berjalan menuju ${destination.label}`,
            simulatedLoad: 46,
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

  const notifyAgentArrived = useCallback(
    (agentId: string, waypointId: string) => {
      const wp = OFFICE_WAYPOINTS[waypointId];
      setAgents((prev) =>
        prev.map((agent) => {
          if (agent.id !== agentId) return agent;
          const assignedWs = workstations.find(
            (w) => w.id === agent.assignedWorkstationId
          );
          const isHomeWorkstation = assignedWs?.waypointId === waypointId;
          const nextStatus: RobotAnimationState = isHomeWorkstation
            ? "working"
            : "idle";

          return {
            ...agent,
            currentWaypointId: waypointId,
            targetWaypointId: waypointId,
            status: nextStatus,
            simulatedLoad: isHomeWorkstation ? 62 : 24,
            currentActionLabel: isHomeWorkstation
              ? `Simulasi kerja di ${assignedWs?.name}`
              : `Idle di ${wp?.label ?? "Area Kantor"}`,
          };
        })
      );

      const targetAgent = agents.find((a) => a.id === agentId);
      if (targetAgent && wp) {
        addActivity(
          targetAgent.name,
          "robot-placeholder",
          `Tiba di ${wp.label} (${wp.zone === "workstation" ? "mode kerja simulasi" : "mode idle"}).`,
          "success",
          wp.label
        );
      }
    },
    [addActivity, agents, workstations]
  );

  // Autonomous subtle patrol loop when simulation is active
  useEffect(() => {
    if (!isSimulationRunning) return;

    const timer = window.setInterval(() => {
      setAgents((prev) => {
        const eligible = prev.filter(
          (a) => a.status === "idle" || a.status === "working"
        );
        if (eligible.length === 0) return prev;

        const chosen = eligible[Math.floor(Math.random() * eligible.length)];
        const nextOptions = chosen.patrolWaypoints.filter(
          (wp) => wp !== chosen.currentWaypointId
        );
        if (nextOptions.length === 0) return prev;

        const nextWp =
          nextOptions[Math.floor(Math.random() * nextOptions.length)];
        const destLabel = OFFICE_WAYPOINTS[nextWp]?.label ?? nextWp;

        return prev.map((agent) =>
          agent.id === chosen.id
            ? {
                ...agent,
                status: "walking",
                targetWaypointId: nextWp,
                simulatedLoad: 45,
                currentActionLabel: `Patroli otomatis menuju ${destLabel}`,
              }
            : agent
        );
      });
    }, 11000);

    return () => window.clearInterval(timer);
  }, [isSimulationRunning]);

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
        `Task baru dibuat: "${newTask.title}"${assigned ? ` → ${assigned.name}` : ""}.`,
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
          `Status task "${updatedTaskTitle}" diubah ke ${status.replace("_", " ").toUpperCase()}.`,
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
          `Task "${taskTitle}" ditugaskan ke ${assigned ? `${assigned.name} (Placeholder)` : "Unassigned"}.`,
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
      performanceMode,
      setPerformanceMode,
      isSimulationRunning,
      setIsSimulationRunning,
      showLabelsIn3D,
      setShowLabelsIn3D,
      setAgentStatus,
      sendAgentToWaypoint,
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
      performanceMode,
      isSimulationRunning,
      showLabelsIn3D,
      setAgentStatus,
      sendAgentToWaypoint,
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
