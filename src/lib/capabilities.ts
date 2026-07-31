// The capability taxonomy behind the Assessment Copilot and Signal Engine.
// Deliberately a transparent, deterministic keyword/heuristic matcher rather
// than a live LLM call — same "dummy for now" approach as the rest of this
// project, but genuinely functional pattern matching, not random output.

export type CapabilityTag =
  | "INTAKE_AUTOMATION"
  | "RESERVATION_NOSHOW_HANDLING"
  | "SALES_RECONCILIATION"
  | "MISSED_CALL_HANDLING"
  | "REBOOKING_FOLLOWUP"
  | "DOCUMENT_AUTOMATION"
  | "CASE_MATTER_TRACKING"
  | "CLIENT_REPORTING"
  | "LEASING_AGENT_AUTOMATION"
  | "BOOKKEEPING_CATEGORIZATION"
  | "PROPOSAL_BID_ASSEMBLY"
  | "SHUTTLE_TRANSPORT_COORDINATION"
  | "GROUP_EVENT_SALES_INQUIRY"
  | "REVIEW_REPUTATION_MANAGEMENT";

export const CAPABILITY_LABELS: Record<CapabilityTag, string> = {
  INTAKE_AUTOMATION: "Intake & Lead Automation",
  RESERVATION_NOSHOW_HANDLING: "Reservation / No-Show & Deposit Handling",
  SALES_RECONCILIATION: "Sales Reconciliation & Reporting",
  MISSED_CALL_HANDLING: "Missed-Call Text-Back",
  REBOOKING_FOLLOWUP: "Rebooking & Win-Back Follow-Up",
  DOCUMENT_AUTOMATION: "Document Drafting & Assembly",
  CASE_MATTER_TRACKING: "Matter / Case & Deadline Tracking",
  CLIENT_REPORTING: "Client / Owner Reporting",
  LEASING_AGENT_AUTOMATION: "AI Leasing Agent",
  BOOKKEEPING_CATEGORIZATION: "Bookkeeping Categorization",
  PROPOSAL_BID_ASSEMBLY: "Proposal / Bid Assembly",
  SHUTTLE_TRANSPORT_COORDINATION: "Shuttle & Transport Coordination",
  GROUP_EVENT_SALES_INQUIRY: "Group / Event Sales Inquiry Handling",
  REVIEW_REPUTATION_MANAGEMENT: "Review & Reputation Management",
};

const KEYWORDS: Record<CapabilityTag, string[]> = {
  INTAKE_AUTOMATION: ["intake", "inquiry", "inquiries", "lead form", "contact form", "new client form"],
  RESERVATION_NOSHOW_HANDLING: ["no-show", "no show", "reservation", "waitlist", "deposit", "cancellation"],
  SALES_RECONCILIATION: ["reconciliation", "recon", "sales report", "end-of-day", "end of day", "pos totals", "deposit match"],
  MISSED_CALL_HANDLING: ["missed call", "unanswered call", "voicemail", "phone keeps ringing", "phone rings"],
  REBOOKING_FOLLOWUP: ["rebook", "re-book", "follow-up", "follow up", "win-back", "winback", "lapsed client"],
  DOCUMENT_AUTOMATION: ["document drafting", "drafting", "boilerplate", "document assembly", "templates"],
  CASE_MATTER_TRACKING: ["matter", "case tracking", "probate", "deadline tracking", "docketing"],
  CLIENT_REPORTING: ["owner statement", "monthly report", "client report", "reporting"],
  LEASING_AGENT_AUTOMATION: ["leasing", "lease renewal", "tenant", "listing agent", "showing requests"],
  BOOKKEEPING_CATEGORIZATION: ["categorization", "categorize", "bookkeeping", "re-keying", "rekeying", "manual entry", "quickbooks"],
  PROPOSAL_BID_ASSEMBLY: ["proposal", "rfp", "sf330", "cut-sheet", "cut sheet", "bid package", "content library"],
  SHUTTLE_TRANSPORT_COORDINATION: ["shuttle", "run-sheet", "run sheet", "pickup", "dispatch", "transport coordination"],
  GROUP_EVENT_SALES_INQUIRY: ["group inquiry", "event inquiry", "wedding block", "room block", "banquet", "beo", "site visit"],
  REVIEW_REPUTATION_MANAGEMENT: ["online review", "tripadvisor", "google review", "review response", "reputation"],
};

const FREQUENCY_SIGNALS = ["daily", "every day", "constantly", "each week", "weekly", "every time"];
const TIME_BURDEN_SIGNALS = ["hours", "all day", "half my day", "half the day", "takes forever"];
const ERROR_RISK_SIGNALS = ["mistake", "error", "wrong", "miss", "missed", "double-book", "double book"];
const AUTOMATION_READY_SIGNALS = ["already", "existing", "subscribe", "pay for", "already have", "already pay"];

function scoreFromSignals(context: string, signals: string[], base: number): number {
  const hits = signals.filter((s) => context.includes(s)).length;
  return Math.min(5, base + hits);
}

export type ExtractedWorkflow = {
  capabilityTag: CapabilityTag;
  name: string;
  frequencyScore: number;
  timeBurdenScore: number;
  errorRiskScore: number;
  automationReadinessScore: number;
  sourceNotes: string;
};

function excerptAround(text: string, index: number, len: number, radius = 120): string {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + len + radius);
  return (start > 0 ? "…" : "") + text.slice(start, end).trim() + (end < text.length ? "…" : "");
}

export function analyzeNotes(rawText: string): ExtractedWorkflow[] {
  const lower = rawText.toLowerCase();
  const results: ExtractedWorkflow[] = [];

  (Object.keys(KEYWORDS) as CapabilityTag[]).forEach((tag) => {
    for (const keyword of KEYWORDS[tag]) {
      const idx = lower.indexOf(keyword);
      if (idx !== -1) {
        const context = excerptAround(lower, idx, keyword.length, 150);
        results.push({
          capabilityTag: tag,
          name: CAPABILITY_LABELS[tag],
          frequencyScore: scoreFromSignals(context, FREQUENCY_SIGNALS, 3),
          timeBurdenScore: scoreFromSignals(context, TIME_BURDEN_SIGNALS, 3),
          errorRiskScore: scoreFromSignals(context, ERROR_RISK_SIGNALS, 2),
          automationReadinessScore: scoreFromSignals(context, AUTOMATION_READY_SIGNALS, 3),
          sourceNotes: excerptAround(rawText, idx, keyword.length, 120),
        });
        break; // one match per capability per note is enough
      }
    }
  });

  return results;
}

// A capability-specific opening question — this is what makes the question
// set feel tailored to what THIS client's notes actually surfaced, rather
// than a generic script every client gets word-for-word.
const TAILORED_OPENER: Record<CapabilityTag, string> = {
  INTAKE_AUTOMATION:
    "Walk me through what happens the moment a new inquiry comes in — where does it land, and who has to manually re-enter it somewhere else?",
  RESERVATION_NOSHOW_HANDLING:
    "How often do no-shows or last-minute cancellations happen, and what do you currently do — if anything — to prevent them?",
  SALES_RECONCILIATION:
    "How do today's sales totals get from your point-of-sale into your books, and how much manual matching is involved?",
  MISSED_CALL_HANDLING:
    "What actually happens when a call goes unanswered — does anyone follow up, and how quickly?",
  REBOOKING_FOLLOWUP:
    "How do you currently identify and reach out to clients who haven't come back in a while?",
  DOCUMENT_AUTOMATION:
    "Which documents do you draft most often, and how much of each one is copied from a previous file versus written fresh?",
  CASE_MATTER_TRACKING:
    "How are matter/case deadlines tracked today — and what happens if the person who tracks them is out sick?",
  CLIENT_REPORTING:
    "Walk me through how a client or owner report gets built today, start to finish — where does the data come from?",
  LEASING_AGENT_AUTOMATION:
    "What happens when a prospective tenant asks about a showing — who responds, and how fast?",
  BOOKKEEPING_CATEGORIZATION:
    "How are transactions categorized today, and how much of that is re-typed by hand instead of pulled automatically?",
  PROPOSAL_BID_ASSEMBLY:
    "How many proposals or RFP responses do you put together in a typical month, and how much of each one is reused content versus written from scratch?",
  SHUTTLE_TRANSPORT_COORDINATION:
    "How are pickups or transport requests tracked today, and has a scheduling conflict ever slipped through?",
  GROUP_EVENT_SALES_INQUIRY:
    "When a group or event inquiry comes in, how long does it typically sit before someone responds?",
  REVIEW_REPUTATION_MANAGEMENT:
    "How do you currently find out about a new online review, and how long does it usually take to respond?",
};

export function tailoredDeepDiveQuestions(w: { capabilityTag: CapabilityTag; name: string }): string[] {
  const label = CAPABILITY_LABELS[w.capabilityTag];
  return [
    TAILORED_OPENER[w.capabilityTag],
    `Walk me through ${label.toLowerCase()} step by step, from trigger to completion. What starts it? What ends it?`,
    `Where do mistakes happen with ${label.toLowerCase()}? What does a mistake cost you — in time and in consequence?`,
    `Have you ever tried to improve ${label.toLowerCase()}? What happened?`,
    `Is there a tool that's supposed to handle ${label.toLowerCase()} but doesn't quite work?`,
    `To confirm — you spend approximately [X] hours per week on ${label.toLowerCase()}. Is that number right, or should we adjust it?`,
  ];
}
