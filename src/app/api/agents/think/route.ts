import { NextResponse } from "next/server";
import { callFreeTierLLM } from "@/lib/ai/llm-provider";
import { buildInstalledSkillsPrompt } from "@/lib/ai/github-skills-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface AgentThinkRequest {
  agentId: string;
  agentName: string;
  agentRole: string;
  currentStatus?: string;
  currentLocation?: string;
  recentMemory?: string[];
  channelGoal?: string;
}

export interface AgentThinkDecision {
  thought: string;
  decision: "work_desk" | "collaborate" | "coffee_break" | "director_briefing";
  actionLabel: string;
  chatBubble: string;
  deliverableTitle: string;
  deliverableOutput: string;
  targetPeerName?: string;
}

const VALID_DECISIONS = new Set([
  "work_desk",
  "collaborate",
  "coffee_break",
  "director_briefing",
]);

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<AgentThinkRequest>;
    const agentId = (body.agentId || "staff-01").trim();
    const agentName = (body.agentName || "Staf Fajrezzz").trim();
    const agentRole = (body.agentRole || "Tim Konten AI").trim();
    const currentStatus = (body.currentStatus || "working").trim();
    const currentLocation = (body.currentLocation || "Kantor Lantai 2").trim();
    const recentMemory = Array.isArray(body.recentMemory)
      ? body.recentMemory.slice(0, 5)
      : [];
    const channelGoal =
      (body.channelGoal || "").trim() ||
      "Memproduksi video TikTok 9:16 kualitas tinggi bertema AI Agent, Claude Code, AI coding tools, multi-agent systems, dan otomasi AI untuk Fajrezzz AI Office.";

    const { promptBlock, activeSkillRepos } = buildInstalledSkillsPrompt("think");

    const systemPrompt = `Kamu adalah ${agentName}, seorang staf AI otonom yang bekerja secara nyata di kantor virtual "FAJREZZZ AI OFFICE" sebagai "${agentRole}".
Kamu punya otak AI sendiri, inisiatif sendiri, memori jangka panjang, dan telah terpasang modul GitHub AI Skills profesional untuk meningkatkan kecerdasanmu.

${promptBlock}

ATURAN WAJIB:
1. Berpikir secara konkret, segar, dan spesifik sesuai keahlianmu ("${agentRole}") — JANGAN generik atau klise.
2. Buat deliverableOutput yang NYATA & LANGSUNG BISA DIPAKAI (misal: 2 ide hook viral + angka, 3 judul CTR tinggi, 1 paragraf pembuka naskah 15 detik, rekomendasi tempo audio/SFX, temuan QC konkret, atau jadwal jam tayang terbaik).
3. Balas HANYA dalam JSON valid tanpa markdown fence dengan struktur persis:
{
  "thought": "1-2 kalimat isi pikiran otonom kamu dalam bahasa Indonesia natural",
  "decision": "work_desk | collaborate | coffee_break | director_briefing",
  "actionLabel": "status kerja singkat maks 52 karakter untuk HUD 3D",
  "chatBubble": "ucapan/pikiran singkat maks 62 karakter yang muncul di atas kepalamu di 3D",
  "deliverableTitle": "judul singkat hasil kerja nyata yang barusan kamu hasilkan",
  "deliverableOutput": "hasil kerja nyata 2-4 baris yang bernilai tinggi untuk tim Fajrezzz",
  "targetPeerName": "opsional, nama rekan tim jika decision=collaborate"
}`;

    const userPrompt = `KONDISI SAAT INI:
- Nama: ${agentName} (${agentId})
- Peran: ${agentRole}
- Status saat ini: ${currentStatus} di ${currentLocation}
- Target Utama Kantor: ${channelGoal}
- Memori aktivitas kantor terbaru:
${recentMemory.length > 0 ? recentMemory.map((m, i) => `  ${i + 1}. ${m}`).join("\n") : "  (Baru mulai shift hari ini)"}
- Waktu sekarang: ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}

Sekarang pikirkan secara mandiri apa yang paling penting kamu kerjakan detik ini, putuskan posisimu di kantor, dan hasilkan 1 output kerja nyata yang konkret!`;

    const result = await callFreeTierLLM<Partial<AgentThinkDecision>>({
      systemPrompt,
      userPrompt,
      expectJson: true,
      temperature: 0.85,
      maxTokens: 650,
      timeoutMs: 22000,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          code: result.code,
        },
        { status: result.httpStatus }
      );
    }

    const raw = result.parsed || {};
    const decision = VALID_DECISIONS.has(String(raw.decision))
      ? (raw.decision as AgentThinkDecision["decision"])
      : "work_desk";

    const clean: AgentThinkDecision = {
      thought:
        typeof raw.thought === "string" && raw.thought.trim().length > 4
          ? raw.thought.trim().slice(0, 260)
          : `Saya (${agentName}) sedang meninjau prioritas ${agentRole} agar performa channel Fajrezzz naik hari ini.`,
      decision,
      actionLabel:
        typeof raw.actionLabel === "string" && raw.actionLabel.trim().length > 2
          ? raw.actionLabel.trim().slice(0, 64)
          : `Otonom AI: Fokus ${agentRole}`,
      chatBubble:
        typeof raw.chatBubble === "string" && raw.chatBubble.trim().length > 2
          ? raw.chatBubble.trim().slice(0, 74)
          : `💡 Baru dapat ide baru untuk ${agentRole}!`,
      deliverableTitle:
        typeof raw.deliverableTitle === "string" && raw.deliverableTitle.trim()
          ? raw.deliverableTitle.trim().slice(0, 90)
          : `Inisiatif ${agentRole}`,
      deliverableOutput:
        typeof raw.deliverableOutput === "string" && raw.deliverableOutput.trim()
          ? raw.deliverableOutput.trim().slice(0, 600)
          : raw.thought || `Rencana aksi otonom dari ${agentName}.`,
      targetPeerName:
        typeof raw.targetPeerName === "string" ? raw.targetPeerName.trim() : undefined,
    };

    return NextResponse.json({
      ok: true,
      agentId,
      agentName,
      agentRole,
      provider: result.provider,
      model: result.model,
      durationMs: result.durationMs,
      activeSkillsUsed: activeSkillRepos,
      data: clean,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Agent think failed",
      },
      { status: 500 }
    );
  }
}
