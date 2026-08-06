// Lead Qualification and Discovery Call decision logic — Notion CRM Cluster
// C1 (Databases 1 and 3), ported from spec into real code. Every derived
// value here is computed from raw stored inputs, never itself stored —
// same rule as the AI Opportunity Scoring Matrix (src/lib/scoring.ts).

export type QualificationGates = {
  gateB1: boolean;
  gateC1: boolean;
  gateD1: boolean;
  gateE1: boolean;
  gateF4: boolean;
};

export type QualificationScores = {
  scoreA: number;
  scoreB: number;
  scoreC: number;
  scoreD: number;
  scoreE: number;
};

export type QualificationOutcome = "QUALIFIED" | "NURTURE" | "NOT_QUALIFIED";

// Total out of 30 — displayed, not itself a decision.
export function qualificationTotal(s: QualificationScores): number {
  return s.scoreA + s.scoreB + s.scoreC + s.scoreD + s.scoreE;
}

// Workflow floor out of 14 (Score B + Score C) — the real qualifier. A
// prospect cannot reach Qualified on firm fit and buying enthusiasm alone
// while the actual work is thin.
export function workflowFloor(s: QualificationScores): number {
  return s.scoreB + s.scoreC;
}

export function verticalDepth(hasOverlay: boolean): "MISSING - universal criteria only" | "Overlay applied" {
  return hasOverlay ? "Overlay applied" : "MISSING - universal criteria only";
}

// The decision rule, in order: gates first, then the workflow floor, then
// the buying-readiness override, then the total. Reordering this changes
// which leads qualify — do not reorder.
export function qualificationOutcome(
  gates: QualificationGates,
  scores: QualificationScores,
  overrideApplied: boolean
): QualificationOutcome {
  const allGatesPassed = gates.gateB1 && gates.gateC1 && gates.gateD1 && gates.gateE1 && gates.gateF4;
  if (!allGatesPassed) return "NOT_QUALIFIED";
  if (workflowFloor(scores) < 8) return "NURTURE";
  if (overrideApplied) return "NURTURE";
  return qualificationTotal(scores) >= 19 ? "QUALIFIED" : "NURTURE";
}

export const QUALIFICATION_OUTCOME_LABELS: Record<QualificationOutcome, string> = {
  QUALIFIED: "Qualified",
  NURTURE: "Nurture",
  NOT_QUALIFIED: "Not qualified",
};

// ── Discovery Call ──────────────────────────────────────────────────────

export type DiscoveryCallOutcome = "PROCEED" | "NURTURE" | "DECLINE";

export function floorMet(namedWorkflows: number): boolean {
  return namedWorkflows >= 2;
}

export function discoveryCallOutcome(
  namedWorkflows: number,
  trigger: string | null,
  budgetSignal: "BUYS_OUTSIDE_SERVICES" | "SOFTWARE_SPEND_ONLY" | "NOT_OBTAINED" | null
): DiscoveryCallOutcome {
  if (!floorMet(namedWorkflows)) return "DECLINE";
  const noTrigger = !trigger || trigger.trim().length === 0;
  if (noTrigger && budgetSignal === "NOT_OBTAINED") return "NURTURE";
  return "PROCEED";
}

export const DISCOVERY_OUTCOME_LABELS: Record<DiscoveryCallOutcome, string> = {
  PROCEED: "Proceed",
  NURTURE: "Nurture",
  DECLINE: "Decline",
};

// Proposal due one day after the call.
export function proposalDue(callDate: Date): Date {
  const d = new Date(callDate);
  d.setDate(d.getDate() + 1);
  return d;
}
