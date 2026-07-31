import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateWorkflowStatus } from "@/lib/actions";
import { CAPABILITY_LABELS, tailoredDeepDiveQuestions } from "@/lib/capabilities";
import { compositeScore, finalTier, rowStatus, TIER_LABELS } from "@/lib/scoring";
import { VERTICAL_LABELS } from "@/lib/verticals";
import { AssessmentCopilot } from "./AssessmentCopilot";
import { StageSelector } from "./StageSelector";
import { CompliantToolSelect, ScoringDetailsForm } from "./WorkflowScoringControls";

const STATUS_STYLES: Record<string, string> = {
  IDENTIFIED: "bg-sky-50 text-sky-700",
  IN_SPRINT: "bg-amber-50 text-amber-700",
  SHIPPED: "bg-emerald-50 text-emerald-700",
};

const TIER_BADGE: Record<string, string> = {
  P1: "bg-red-50 text-red-700",
  P2: "bg-amber-50 text-amber-700",
  P3: "bg-neutral-100 text-neutral-600",
  NOT_RECOMMENDED: "bg-neutral-100 text-neutral-400",
};

const GATE_BADGE: Record<string, string> = {
  PASS: "bg-emerald-50 text-emerald-700",
  DEMOTED: "bg-red-50 text-red-700",
  PENDING: "bg-amber-50 text-amber-700",
  NA: "bg-neutral-100 text-neutral-500",
};

const GATE_LABEL: Record<string, string> = {
  PASS: "PASS — Priority 1 confirmed",
  DEMOTED: "Quality gate demoted — no confirmed tool",
  PENDING: "Tool status not yet confirmed",
  NA: "Gate not applicable",
};

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await prisma.robusClient.findUnique({
    where: { id },
    include: { workflows: { orderBy: { createdAt: "desc" } } },
  });
  if (!client) notFound();

  const playbooks = await prisma.playbook.findMany();
  const playbookByTag = new Map(playbooks.map((p) => [p.capabilityTag, p]));

  const sortedWorkflows = [...client.workflows].sort(
    (a, b) => compositeScore(b) - compositeScore(a)
  );

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">{client.name}</h1>
          <p className="text-sm text-neutral-500 mt-1">{VERTICAL_LABELS[client.vertical]}</p>
        </div>
        <StageSelector clientId={id} stage={client.stage} />
      </div>

      <div className="mb-6">
        <AssessmentCopilot
          clientId={id}
          existingCapabilityTags={client.workflows.map((w) => w.capabilityTag)}
        />
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-900 px-5 py-4 border-b border-neutral-100">
          Identified workflows ({sortedWorkflows.length})
        </h2>
        <div className="divide-y divide-neutral-100">
          {sortedWorkflows.length === 0 && (
            <p className="px-5 py-6 text-sm text-neutral-400">
              None yet — use the Assessment Copilot above to analyze interview notes.
            </p>
          )}
          {sortedWorkflows.map((w) => {
            const playbook = playbookByTag.get(w.capabilityTag);
            const composite = compositeScore(w);
            const gate = finalTier(w);
            const status = rowStatus(w);
            const isDemoted = gate.gateResult === "DEMOTED";
            const isGatePending = gate.gateResult === "PENDING";
            return (
              <details
                key={w.id}
                className={`px-5 py-4 ${isDemoted ? "bg-red-50/50" : isGatePending ? "bg-amber-50/40" : ""}`}
              >
                <summary className="cursor-pointer flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-neutral-900">
                        {CAPABILITY_LABELS[w.capabilityTag]}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TIER_BADGE[gate.tier ?? "P2"]}`}>
                        {gate.tier ? TIER_LABELS[gate.tier] : "Pending gate"}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status === "Complete" ? "bg-neutral-100 text-neutral-500" : "bg-amber-50 text-amber-700"}`}>
                        {status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Composite {composite}/20 · Frequency {w.frequencyScore} · Time Cost {w.timeBurdenScore} · Error Rate &amp; Risk {w.errorRiskScore} · AI Tool Availability {w.automationReadinessScore}
                    </p>
                  </div>
                  <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[w.status]}`}>
                    {w.status.replace("_", " ")}
                  </span>
                </summary>

                <div className="mt-3 pl-1 space-y-3">
                  {w.sourceNotes && (
                    <p className="text-xs text-neutral-500 italic">Source: &ldquo;{w.sourceNotes}&rdquo;</p>
                  )}

                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${GATE_BADGE[gate.gateResult]}`}>
                      {GATE_LABEL[gate.gateResult]}
                    </span>
                    <CompliantToolSelect workflow={w} />
                  </div>

                  <ScoringDetailsForm workflow={w} />

                  {playbook && (
                    <div className="bg-neutral-50 rounded-lg p-3 text-sm">
                      <p className="font-medium text-neutral-800 mb-1">{playbook.title}</p>
                      <p className="text-xs text-neutral-500 mb-2">Common tools: {playbook.commonTools}</p>
                      <p className="text-xs text-neutral-500 mb-2">
                        Est. hours: {playbook.estimatedHoursWithout} → {playbook.estimatedHoursWith} per engagement
                      </p>
                      <ol className="list-decimal list-inside text-xs text-neutral-600 space-y-0.5">
                        {playbook.steps.split("\n").map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <div className="bg-indigo-50 rounded-lg p-3 text-sm">
                    <p className="font-medium text-indigo-900 mb-2">
                      Ask {client.name} next, about this specific workflow
                    </p>
                    <ol className="list-decimal list-inside text-xs text-indigo-800 space-y-1">
                      {tailoredDeepDiveQuestions(w).map((q, i) => (
                        <li key={i}>&ldquo;{q}&rdquo;</li>
                      ))}
                    </ol>
                  </div>

                  <div className="flex gap-2">
                    {(["IDENTIFIED", "IN_SPRINT", "SHIPPED"] as const).map((status) => (
                      <form
                        key={status}
                        action={async () => {
                          "use server";
                          await updateWorkflowStatus(w.id, status);
                        }}
                      >
                        <button
                          disabled={w.status === status}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-default"
                        >
                          Mark {status.replace("_", " ").toLowerCase()}
                        </button>
                      </form>
                    ))}
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </div>
  );
}
