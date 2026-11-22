"use client";

import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Database,
  Filter,
  Plus,
  Trash2,
  UserCheck,
} from "lucide-react";
import { useOffice } from "@/store/OfficeContext";
import type { OfficeTask, TaskPriority, TaskStatus } from "@/types/office";

const STATUS_TABS: { id: "all" | TaskStatus; label: string }[] = [
  { id: "all", label: "Semua" },
  { id: "backlog", label: "Backlog" },
  { id: "in_progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
];

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: "bg-slate-800 text-slate-300 border-slate-700",
  medium: "bg-sky-500/15 text-sky-300 border-sky-500/35",
  high: "bg-purple-500/15 text-purple-300 border-purple-500/40",
  critical: "bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400/50",
};

export function TaskManagerPanel({ compact = false }: { compact?: boolean }) {
  const {
    tasks,
    agents,
    createTask,
    updateTaskStatus,
    assignTaskToAgent,
    deleteTask,
  } = useOffice();

  const [filterStatus, setFilterStatus] = useState<"all" | TaskStatus>("all");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [category, setCategory] =
    useState<OfficeTask["category"]>("architecture");
  const [assignedAgentId, setAssignedAgentId] = useState<string>("unit-01");
  const [showCreateForm, setShowCreateForm] = useState(!compact);

  const filteredTasks = useMemo(() => {
    if (filterStatus === "all") return tasks;
    return tasks.filter((t) => t.status === filterStatus);
  }, [filterStatus, tasks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2) return;
    createTask({
      title,
      description,
      priority,
      category,
      assignedAgentId: assignedAgentId || null,
    });
    setTitle("");
    setDescription("");
    if (compact) setShowCreateForm(false);
  };

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Filter className="mr-0.5 h-3.5 w-3.5 text-cyan-400" />
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                filterStatus === tab.id
                  ? "bg-cyan-500/25 text-cyan-200 ring-1 ring-cyan-400/50"
                  : "bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-xl border border-cyan-400/45 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/25"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{showCreateForm ? "Tutup Form" : "Task Baru"}</span>
        </button>
      </div>

      {/* Create Task Form */}
      {showCreateForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded-2xl border border-cyan-500/25 bg-[#070f24]/95 p-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold tracking-wider text-cyan-200 uppercase">
              Tambah Task Baru (Simulasi Lokal)
            </h3>
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <Database className="h-3 w-3 text-purple-400" />
              Siap sinkron Supabase
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Judul task (mis. Uji performa WebGL Android)"
              required
              className="rounded-xl border border-slate-700/80 bg-[#040917] px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-400 sm:col-span-2"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi singkat task..."
              rows={2}
              className="rounded-xl border border-slate-700/80 bg-[#040917] px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-400 sm:col-span-2"
            />

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="rounded-xl border border-slate-700/80 bg-[#040917] px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-400"
            >
              <option value="low">Prioritas: Low</option>
              <option value="medium">Prioritas: Medium</option>
              <option value="high">Prioritas: High</option>
              <option value="critical">Prioritas: Critical</option>
            </select>

            <select
              value={assignedAgentId}
              onChange={(e) => setAssignedAgentId(e.target.value)}
              className="rounded-xl border border-slate-700/80 bg-[#040917] px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-400"
            >
              <option value="">Belum ditugaskan</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  Unit: {a.name} (Placeholder)
                </option>
              ))}
            </select>

            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as OfficeTask["category"])
              }
              className="rounded-xl border border-slate-700/80 bg-[#040917] px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-400"
            >
              <option value="architecture">Kategori: Architecture</option>
              <option value="ui-ux">Kategori: UI / 3D UX</option>
              <option value="automation">Kategori: Automation</option>
              <option value="analytics">Kategori: Analytics</option>
              <option value="ops">Kategori: Ops / Supabase</option>
            </select>

            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
            >
              Simpan Task
            </button>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-[#060c1d]/70 p-8 text-center text-xs text-slate-400">
            Belum ada task pada filter status ini.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const assignedAgent = agents.find(
              (a) => a.id === task.assignedAgentId
            );
            return (
              <div
                key={task.id}
                className="rounded-2xl border border-cyan-500/20 bg-[#070f23]/90 p-3.5 transition hover:border-cyan-400/45"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                          PRIORITY_STYLES[task.priority]
                        }`}
                      >
                        {task.priority}
                      </span>
                      <span className="rounded-md bg-slate-800/90 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-300">
                        {task.category}
                      </span>
                      {task.status === "done" && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-white">
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="text-xs leading-relaxed text-slate-400">
                        {task.description}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    aria-label="Hapus task"
                    className="rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-500/15 hover:text-rose-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Task Controls Footer */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-2.5">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-3.5 w-3.5 text-cyan-400" />
                    <select
                      value={task.assignedAgentId ?? ""}
                      onChange={(e) =>
                        assignTaskToAgent(task.id, e.target.value || null)
                      }
                      className="rounded-lg border border-slate-700/80 bg-[#040917] px-2 py-1 text-[11px] text-slate-200 outline-none focus:border-cyan-400"
                    >
                      <option value="">Unassigned</option>
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} (Sim)
                        </option>
                      ))}
                    </select>
                    {assignedAgent && (
                      <span
                        className="hidden h-2 w-2 rounded-full sm:inline-block"
                        style={{ backgroundColor: assignedAgent.accentColor }}
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-slate-500" />
                    <select
                      value={task.status}
                      onChange={(e) =>
                        updateTaskStatus(task.id, e.target.value as TaskStatus)
                      }
                      className="rounded-lg border border-cyan-500/30 bg-[#061128] px-2 py-1 text-[11px] font-semibold text-cyan-200 outline-none focus:border-cyan-400"
                    >
                      <option value="backlog">Backlog</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
