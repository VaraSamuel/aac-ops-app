// Lead Qualification Checklist v1.0 — the actual guided instrument content
// (questions + scoring rubric), transcribed from
// Robus_LeadQualificationChecklist_v1_0_DELIVERABLE.docx §3. The gates/scores
// themselves are just numbers in the DB; this is what makes the form usable
// live on a call instead of requiring the source doc open in another window.

export type ChecklistItem = {
  ref: string;
  question: string;
  type: "GATE" | "SIGNAL" | "FLAG";
  rubric: string;
};

export const SECTION_A: ChecklistItem[] = [
  { ref: "A1", question: "Is this an independently owned business, or a local unit with real local decision authority?", type: "SIGNAL", rubric: "2 = owner-operated or clear local authority · 1 = local unit, authority unclear · 0 = franchise/branch decided at a corporate office out of reach" },
  { ref: "A2", question: "Roughly how many people work here, against the size band for this kind of business?", type: "SIGNAL", rubric: "2 = inside the band · 1 = at the edge, or band unknown (no overlay) · 0 = far outside it. Default band 5–100 employees, overridable by the overlay. Never a gate." },
  { ref: "A3", question: "Where is the business, relative to the Florida/Southeast partner territory and the Philadelphia base?", type: "SIGNAL", rubric: "2 = a market a partner covers · 1 = outside covered markets but plainly remote-deliverable · 0 = no partner and clearly expects someone on site" },
  { ref: "A4", question: "Does the business visibly already run on software — online booking, a portal, a scheduling link, a practice or property system?", type: "SIGNAL", rubric: "2 = clear evidence of paid software in use · 1 = some digital presence, unclear what's paid for · 0 = no evidence of any system beyond a phone and a paper diary" },
];

export const SECTION_B: ChecklistItem[] = [
  { ref: "B1", question: "Can you name at least one specific process this business runs repeatedly, the same way each time? Not a category — a named process.", type: "GATE", rubric: "PASS = you can write the process down in one sentence · FAIL = you cannot name one, only a vague sense they're busy. The primary gate of the whole checklist." },
  { ref: "B2", question: "Roughly how often does that process run — per day, per week, per month?", type: "SIGNAL", rubric: "2 = many times a day or most days · 1 = weekly, or frequency implied but not stated · 0 = occasional, episodic, or one-off" },
  { ref: "B3", question: "Is it performed by a person, by hand, in the same steps each time — retyping, copying between systems, sending the same message, chasing the same follow-up?", type: "SIGNAL", rubric: "2 = plainly manual and repetitive · 1 = partly automated with manual steps around it · 0 = already automated, or genuinely judgement-heavy work that differs every time" },
  { ref: "B4", question: "Is there visible evidence of time being lost — backlogs, slow response, after-hours admin, the owner personally doing clerical work, or a hire being contemplated to absorb it?", type: "SIGNAL", rubric: "2 = stated outright or plainly visible · 1 = implied by the material · 0 = no sign of pressure anywhere" },
  { ref: "B5", question: "Is the process stable — broadly the same six months from now as it is today?", type: "SIGNAL", rubric: "2 = settled and routine · 1 = seasonal or in mild flux · 0 = the business is mid-reorganisation and the process is about to change anyway" },
];

export const SECTION_C: ChecklistItem[] = [
  { ref: "C1", question: "Is at least one named workflow something a tool available today could plausibly address?", type: "GATE", rubric: "PASS = you can name a category of tool that would touch it · FAIL = the work is inherently physical, bespoke, or requires judgement no available tool can carry" },
  { ref: "C2", question: "Does the business already pay for software that probably has the needed capability sitting switched off or unconfigured?", type: "SIGNAL", rubric: "2 = the overlay confirms this platform has the capability on a tier they likely hold · 1 = they run something relevant but you cannot confirm the capability · 0 = no relevant system, so any fix means new software" },
  { ref: "C3", question: "Is the data this workflow runs on already digital, or would it have to be got out of paper first?", type: "SIGNAL", rubric: "2 = already in a system · 1 = mixed · 0 = paper-first, which turns a Sprint into a digitisation project" },
  { ref: "C4", question: "Does the workflow have a clear, checkable output — something you could measure before and after?", type: "SIGNAL", rubric: "2 = an obvious metric exists (hours, response time, no-show rate, error count) · 1 = measurable with some construction · 0 = no observable output to measure" },
];

export const SECTION_D: ChecklistItem[] = [
  { ref: "D1", question: "Is the person who can approve a $2,500–$3,500 engagement identifiable and reachable — by name or by role, through this inbound route?", type: "GATE", rubric: "PASS = you can name or route to them · FAIL = the approver is unidentifiable, or sits behind a procurement wall this engagement size cannot justify crossing" },
  { ref: "D2", question: "Is there a budget signal — evidence they already spend on outside professional services or paid software?", type: "SIGNAL", rubric: "2 = clear evidence (e.g. an outside bookkeeper, a marketing agency, paid platforms) · 1 = some paid software but nothing beyond it · 0 = no sign they buy outside help at all" },
  { ref: "D3", question: "Is there a trigger — a reason to act now? Growth, a hire they're trying to avoid, a recent failure, a deadline, a season, a new regulation, a departing staff member.", type: "SIGNAL", rubric: "2 = a specific trigger is stated or plainly visible · 1 = general dissatisfaction without a date attached · 0 = no trigger; they're browsing" },
  { ref: "D4", question: "Does their own language show they already believe this is a problem worth paying to fix?", type: "SIGNAL", rubric: "2 = they named the pain themselves · 1 = they responded to the partner naming it · 0 = the pain is the partner's inference alone" },
];

export const SECTION_E: ChecklistItem[] = [
  { ref: "E1", question: "Does the workflow touch regulated or sensitive data for which no compliant tool exists at this engagement size?", type: "GATE", rubric: "PASS = no regime applies, or a compliant path plainly exists · FAIL = the regulatory context is one no tool Robus can deploy at this price point can serve. Fail only on a real blocker, not the mere presence of a regime." },
  { ref: "E2", question: "Which regime, if any, applies — privilege, health information, financial/tax data, payment card data, personal data of consumers?", type: "FLAG", rubric: "Not scored. Record as a flag so discovery and the Assessment inherit it. Write \"none identified\" if none." },
  { ref: "E3", question: "Is there a known vendor requirement — a business associate agreement, data residency, a confidentiality undertaking, or a client-imposed restriction?", type: "FLAG", rubric: "Not scored. Record it. A requirement is a constraint on tool selection, not a disqualifier." },
  { ref: "E4", question: "Do they already put this data in a cloud system?", type: "SIGNAL", rubric: "2 = yes, they've already cleared the question themselves · 1 = partly, or unclear · 0 = strictly on-premises or paper by policy, which narrows the tool set sharply" },
];

export const F_DISQUALIFIERS: { ref: string; name: string; meaning: string; gate: string }[] = [
  { ref: "F1", name: "No identifiable manual workflow", meaning: "You cannot name a single repetitive process. Nothing to assess or automate.", gate: "Gate B1" },
  { ref: "F2", name: "No reachable decision-maker", meaning: "The approver cannot be identified or reached through this route.", gate: "Gate D1" },
  { ref: "F3", name: "A regulatory context no compliant tool can serve", meaning: "The data regime rules out every tool Robus could deploy at this engagement size.", gate: "Gate E1" },
  { ref: "F4", name: "A request outside the service ladder entirely", meaning: "Custom software, a trained AI model, a full-time internal AI hire, or general IT support — none of these is the Assessment or the Sprint.", gate: "Gate F4" },
  { ref: "F5", name: "No plausible automation target", meaning: "A repetitive workflow exists but no available tool can touch it. Distinct from F1 — the work is real, the technology isn't there yet.", gate: "Gate C1" },
  { ref: "F6", name: "Vertical-specific disqualifiers", meaning: "The overlay may add disqualifiers particular to this industry, on top of F1–F5.", gate: "Overlay" },
];
