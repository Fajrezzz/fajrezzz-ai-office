import { isSupabaseClientConfigured, publicConfig } from "@/lib/config/env";
import type {
  CreateTaskInput,
  OfficeDataAdapter,
  UpdateTaskInput,
} from "@/lib/services/data-adapter";
import { localOfficeAdapter } from "@/lib/services/local-office-adapter";
import type {
  ActivityEvent,
  OfficeAgent,
  OfficeTask,
  Workstation,
} from "@/types/office";

/**
 * Phase 2 Integration Skeleton — Supabase Adapter
 *
 * Planned Supabase tables:
 * - `office_agents` (id, code, name, role, status, assigned_workstation_id, future_model_slot, updated_at)
 * - `office_tasks` (id, title, description, status, priority, category, assigned_agent_id, created_at, updated_at)
 * - `office_activity_logs` (id, actor, actor_type, message, severity, zone, created_at)
 * - `office_workstations` (id, code, name, assigned_agent_id, specs)
 *
 * Until `@supabase/supabase-js` is connected in Phase 2, calls safely fall back
 * to `localOfficeAdapter` without throwing runtime errors.
 */
export class SupabaseOfficeAdapter implements OfficeDataAdapter {
  readonly adapterName = "supabase-placeholder-skeleton";

  get isReady(): boolean {
    return (
      publicConfig.dataMode === "supabase" && isSupabaseClientConfigured()
    );
  }

  async getAgents(): Promise<OfficeAgent[]> {
    return localOfficeAdapter.getAgents();
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
    return localOfficeAdapter.updateAgent(id, patch);
  }

  async getWorkstations(): Promise<Workstation[]> {
    return localOfficeAdapter.getWorkstations();
  }

  async getTasks(): Promise<OfficeTask[]> {
    return localOfficeAdapter.getTasks();
  }

  async createTask(input: CreateTaskInput): Promise<OfficeTask> {
    return localOfficeAdapter.createTask(input);
  }

  async updateTask(
    id: string,
    patch: UpdateTaskInput
  ): Promise<OfficeTask | null> {
    return localOfficeAdapter.updateTask(id, patch);
  }

  async deleteTask(id: string): Promise<boolean> {
    return localOfficeAdapter.deleteTask(id);
  }

  async getActivities(): Promise<ActivityEvent[]> {
    return localOfficeAdapter.getActivities();
  }

  async appendActivity(
    event: Omit<ActivityEvent, "id">
  ): Promise<ActivityEvent> {
    return localOfficeAdapter.appendActivity(event);
  }
}

export const supabaseOfficeAdapter = new SupabaseOfficeAdapter();
