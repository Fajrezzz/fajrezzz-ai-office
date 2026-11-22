import type {
  ActivityEvent,
  OfficeAgent,
  OfficeTask,
  Workstation,
} from "@/types/office";

export interface CreateTaskInput {
  title: string;
  description: string;
  priority: OfficeTask["priority"];
  category: OfficeTask["category"];
  assignedAgentId: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: OfficeTask["status"];
  priority?: OfficeTask["priority"];
  assignedAgentId?: string | null;
}

/**
 * Repository interface allowing FAJREZZZ AI OFFICE to swap seamlessly
 * between Phase 1 local simulation (`LocalOfficeAdapter`) and
 * Phase 2 persistent backend (`SupabaseOfficeAdapter`).
 */
export interface OfficeDataAdapter {
  readonly adapterName: string;
  getAgents(): Promise<OfficeAgent[]>;
  updateAgent(
    id: string,
    patch: Partial<Pick<OfficeAgent, "status" | "assignedWorkstationId" | "targetWaypointId" | "currentActionLabel">>
  ): Promise<OfficeAgent | null>;
  getWorkstations(): Promise<Workstation[]>;
  getTasks(): Promise<OfficeTask[]>;
  createTask(input: CreateTaskInput): Promise<OfficeTask>;
  updateTask(id: string, patch: UpdateTaskInput): Promise<OfficeTask | null>;
  deleteTask(id: string): Promise<boolean>;
  getActivities(): Promise<ActivityEvent[]>;
  appendActivity(event: Omit<ActivityEvent, "id">): Promise<ActivityEvent>;
}
