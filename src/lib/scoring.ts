// AI Opportunity Scoring Matrix v1.0 — Spoke 7A Section 3B.
// Gate decisions of record:
//   G2 — Priority 1 at 17+, full four-tier ladder (17-20 / 12-16 / 8-11 / below 8)
//   G3 — four dimensions; AI Tool Availability carries compliance
//   G4 — equal weights, simple sum, for v1.0
// Composite and tier are always computed from raw inputs, never stored.
// Mirrors aac-workspace-app/src/lib/scoring.ts — keep the two in sync.

export type ScoringDimensions = {
  frequencyScore: number;
  timeBurdenScore: number;
  errorRiskScore: number;
  automationReadinessScore: number;
};

export type CompliantToolStatus = "YES" | "NO" | "UNANSWERED";

export type IndicatedTier = "P1" | "P2" | "P3" | "NOT_RECOMMENDED";

export type FinalTierResult =
  | { tier: "P1"; gateResult: "PASS" }
  | { tier: "P2"; gateResult: "DEMOTED" }
  | { tier: null; gateResult: "PENDING" }
  | { tier: Exclude<IndicatedTier, "P1">; gateResult: "NA" };

export const TIER_LABELS: Record<IndicatedTier, string> = {
  P1: "Priority 1 — Act Now",
  P2: "Priority 2 — Plan Next",
  P3: "Priority 3 — Monitor",
  NOT_RECOMMENDED: "Not Recommended",
};

// Equal weight, simple sum (Gate G4) — out of 20.
export function compositeScore(w: ScoringDimensions): number {
  return w.frequencyScore + w.timeBurdenScore + w.errorRiskScore + w.automationReadinessScore;
}

// The pre-gate ladder (Gate G2): 17-20 / 12-16 / 8-11 / below 8.
export function indicatedTier(composite: number): IndicatedTier {
  if (composite >= 17) return "P1";
  if (composite >= 12) return "P2";
  if (composite >= 8) return "P3";
  return "NOT_RECOMMENDED";
}

// THE QUALITY GATE: a would-be Priority 1 without a confirmed compliant tool
// is demoted to Priority 2. Unanswered means the file cannot assign a tier
// yet — that's a distinct state from either passing or failing the gate.
export function finalTier(w: ScoringDimensions & { confirmedCompliantTool: CompliantToolStatus }): FinalTierResult {
  const composite = compositeScore(w);
  const indicated = indicatedTier(composite);

  if (indicated !== "P1") {
    return { tier: indicated, gateResult: "NA" };
  }
  if (w.confirmedCompliantTool === "YES") return { tier: "P1", gateResult: "PASS" };
  if (w.confirmedCompliantTool === "NO") return { tier: "P2", gateResult: "DEMOTED" };
  return { tier: null, gateResult: "PENDING" };
}

export type RowCompletenessInput = {
  rationale: string | null;
  confirmedCompliantTool: CompliantToolStatus;
  creativeAdjacent: boolean;
  creativeAdjacentNote: string | null;
  revenueOpportunity: number | null;
  revenueBasis: string | null;
} & ScoringDimensions;

// A row reads "Complete" only once every field the gate or the report needs
// is actually present — matches the Row status column on the Scoring tab.
export function rowStatus(row: RowCompletenessInput): "Complete" | "Incomplete" {
  if (!row.rationale || row.rationale.trim().length === 0) return "Incomplete";
  const gate = finalTier(row);
  if (gate.gateResult === "PENDING") return "Incomplete";
  if (row.creativeAdjacent && (!row.creativeAdjacentNote || row.creativeAdjacentNote.trim().length === 0)) {
    return "Incomplete";
  }
  if (row.revenueOpportunity !== null && row.revenueOpportunity > 0 && !row.revenueBasis) {
    return "Incomplete";
  }
  return "Complete";
}
