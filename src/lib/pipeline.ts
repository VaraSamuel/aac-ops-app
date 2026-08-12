// Lead Qualification and Discovery Call decision logic — Notion CRM Cluster
// C1 (Databases 1 and 3), ported from spec into real code. Every derived
// value here is computed from raw stored inputs, never itself stored —
// same rule as the AI Opportunity Scoring Matrix (src/lib/scoring.ts).

export type GateStatus = "PASS" | "FAIL" | null;

export type QualificationGates = {
  gateB1: GateStatus;
  gateC1: GateStatus;
  gateD1: GateStatus;
  gateE1: GateStatus;
  gateF4: GateStatus;
};

// One 0/1/2 entry per SIGNAL ref (A1-A4, B2-B5, C2-C4, D2-D4, E4 — fifteen
// in all). Section subtotals and the total are always summed from this,
// never themselves stored.
export type ItemScores = Partial<Record<string, number>>;

export const SIGNAL_REFS = {
  A: ["A1", "A2", "A3", "A4"],
  B: ["B2", "B3", "B4", "B5"],
  C: ["C2", "C3", "C4"],
  D: ["D2", "D3", "D4"],
  E: ["E4"],
} as const;

// Every ref row a partner can attach a note to — the fifteen signals plus
// the five gates. E2/E3 aren't here: they're FLAG rows with their own
// dedicated text field (regimeFlag/vendorRequirement), not a note-on-a-score.
export const NOTE_REFS = [
  "A1", "A2", "A3", "A4",
  "B1", "B2", "B3", "B4", "B5",
  "C1", "C2", "C3", "C4",
  "D1", "D2", "D3", "D4",
  "E1", "E4",
  "F4",
] as const;

function sumRefs(scores: ItemScores, refs: readonly string[]): number {
  return refs.reduce((sum, ref) => sum + (scores[ref] ?? 0), 0);
}

export function sectionScore(scores: ItemScores, section: keyof typeof SIGNAL_REFS): number {
  return sumRefs(scores, SIGNAL_REFS[section]);
}

export type QualificationOutcome = "QUALIFIED" | "NURTURE" | "NOT_QUALIFIED";

// Total out of 30 — displayed, not itself a decision.
export function qualificationTotal(scores: ItemScores): number {
  return (
    sectionScore(scores, "A") +
    sectionScore(scores, "B") +
    sectionScore(scores, "C") +
    sectionScore(scores, "D") +
    sectionScore(scores, "E")
  );
}

// Workflow floor out of 14 (Section B + Section C) — the real qualifier. A
// prospect cannot reach Qualified on firm fit and buying enthusiasm alone
// while the actual work is thin.
export function workflowFloor(scores: ItemScores): number {
  return sectionScore(scores, "B") + sectionScore(scores, "C");
}

export function verticalDepth(hasOverlay: boolean): "MISSING - universal criteria only" | "Overlay applied" {
  return hasOverlay ? "Overlay applied" : "MISSING - universal criteria only";
}

// The decision rule, in order: gates first, then the workflow floor, then
// the buying-readiness override, then the total. Reordering this changes
// which leads qualify — do not reorder. A gate left unresolved (null) is
// not a pass, so it falls through the same as a fail — the honest reading
// of "hold the lead rather than guessing a pass".
export function qualificationOutcome(
  gates: QualificationGates,
  scores: ItemScores,
  overrideApplied: boolean
): QualificationOutcome {
  const allGatesPassed =
    gates.gateB1 === "PASS" && gates.gateC1 === "PASS" && gates.gateD1 === "PASS" && gates.gateE1 === "PASS" && gates.gateF4 === "PASS";
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

// Written by Automation 3 when Outcome becomes Qualified — the only next
// step value the spec defines, so there's nothing to store per-row.
export function qualificationNextStep(outcome: QualificationOutcome): string | null {
  return outcome === "QUALIFIED" ? "Schedule discovery" : null;
}

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
