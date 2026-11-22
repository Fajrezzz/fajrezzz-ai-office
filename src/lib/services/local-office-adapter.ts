import {
  INITIAL_ACTIVITIES,
  INITIAL_AGENTS,
  INITIAL_TASKS,
  INITIAL_WORKSTATIONS,
} from "@/lib/data/initial-office-data";
import type {
  CreateTaskInput,
  OfficeDataAdapter,
  UpdateTaskInput,
} from "@/lib/services/data-adapter";
import type {
  ActivityEvent,
  OfficeAgent,
  OfficeTask,
  Workstation,
} from "@/types/office";

/**
 * Phase 1 Local Simulation Adapter.
 * Stores state in-memory so the application runs immediately without external services.
 */
export class LocalOfficeAdapter implements OfficeDataAdapter {
  readonly adapterName = "local-visual-simulation";

  private agents: OfficeAgent[] = structuredClone(INITIAL_AGENTS);
  private workstations: Workstation[] = structuredClone(INITIAL_WORKSTATIONS);
  private tasks: OfficeTask[] = structuredClone(INITIAL_TASKS);
  private activities: ActivityEvent[] = structuredClone(INITIAL_ACTIVITIES);

  async getAgents(): Promise<OfficeAgent[]> {
    return structuredClone(this.agents);
  }

  async updateAgent(
    id: string,
    patch: Partial<
      Pick<
        OfficeAgent,
        | "status"
        | "assignedWorkstationId"
        | "targetWaypointId"
        | "currentActionLabel"
      >
    >
  ): Promise<OfficeAgent | null> {
    const idx = this.agents.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    this.agents[idx] = { ...this.agents[idx], ...patch };
    return structuredClone(this.agents[idx]);
  }

  async getWorkstations(): Promise<Workstation[]> {
    return structuredClone(this.workstations);
  }

  async getTasks(): Promise<OfficeTask[]> {
    return structuredClone(this.tasks);
  }

  async createTask(input: CreateTaskInput): Promise<OfficeTask> {
    const now = new Date().toISOString();
    const task: OfficeTask = {
      id: `task-${Date.now()}`,
      title: input.title,
      description: input.description,
      status: "backlog",
      priority: input.priority,
      category: input.category,
      assignedAgentId: input.assignedAgentId,
      createdAt: now,
      updatedAt: now,
      isSimulatedPlaceholder: true,
    };
    this.tasks = [task, ...this.tasks];
    return structuredClone(task);
  }

  async updateTask(
    id: string,
    patch: UpdateTaskInput
  ): Promise<OfficeTask | null> {
    const idx = this.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    this.tasks[idx] = {
      ...this.tasks[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    return structuredClone(this.tasks[idx]);
  }

  async deleteTask(id: string): Promise<boolean> {
    const before = this.tasks.length;
    this.tasks = this.tasks.filter((t) => t.id !== id);
    return this.tasks.length < before;
  }

  async getActivities(): Promise<ActivityEvent[]> {
    return structuredClone(this.activities);
  }

  async appendActivity(
    event: Omit<ActivityEvent, "id">
  ): Promise<ActivityEvent> {
    const created: ActivityEvent = {
      ...event,
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    this.activities = [created, ...this.activities].slice(0, 60);
    return structuredClone(created);
  }
}

export const localOfficeAdapter = new LocalOfficeAdapter();
