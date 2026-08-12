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

export const HOW_TO_SCORE: { type: string; marked: string; behavior: string; effect: string }[] = [
  {
    type: "Hard gate",
    marked: "GATE",
    behavior:
      "Pass or fail. Answered yes or no from the inbound material. If the material genuinely does not say, the honest answer is that the gate is unresolved — hold the lead and ask one clarifying question by email rather than guessing a pass.",
    effect: "Any failure → Not qualified. No total can rescue a failed gate.",
  },
  {
    type: "Scored signal",
    marked: "SIGNAL",
    behavior: "0 = absent or contradicted. 1 = partial, inferred, or unconfirmed. 2 = clearly present in the material.",
    effect: "Accumulates. Fifteen scored signals, 30 points available.",
  },
  {
    type: "Overlay slot",
    marked: "SLOT",
    behavior:
      "A place where the vertical overlay supplies the industry-specific detail the partner needs in order to answer the item well. Five slots, one per section A–E.",
    effect: "Unfilled slots do not fail the lead. They score conservatively and raise the missing-depth flag.",
  },
];

export const SECTION_META: Record<
  "A" | "B" | "C" | "D" | "E",
  { title: string; description: string; overlaySlot: string; overlayNote: string }
> = {
  A: {
    title: "Firm fit",
    description:
      "Is this a business the partner can serve at all? Ownership, decision structure, rough size, and geography. Note that nothing in this section is a gate — firm fit shapes the score, it does not end the conversation.",
    overlaySlot: "Slot A — size band and geography nuance",
    overlayNote:
      "The overlay supplies the size band appropriate for this kind of business, replacing the 5–100 default, and any geography nuance. If no overlay exists, use the default band and score A2 at 1 rather than 2. Size is a signal, not a gate — there is no headcount floor anywhere in this checklist.",
  },
  B: {
    title: "Workflow fit — the real qualifier",
    description:
      "This is the section that decides. Does the business run manual, repetitive, high-volume processes? Is there visible time being lost to work a person does the same way every single day? This is what makes an engagement possible, and it is true independent of industry.",
    overlaySlot: "Slot B — typical workflows for this kind of business",
    overlayNote:
      "The overlay supplies the list of workflows this kind of business typically runs manually, so the partner knows what to probe for. Without it, B1 is answered purely from what the prospect volunteered — often enough to pass the gate, but thinner, and B2–B5 should be scored conservatively as a result.",
  },
  C: {
    title: "AI-addressability",
    description:
      "Is at least one of those workflows something a currently available tool could actually address? There is no engagement without a plausible automation target. The firm thesis is switching on automation the business already pays for, inside software it already owns — so C2 carries real weight.",
    overlaySlot: "Slot C — the vertical tool landscape",
    overlayNote:
      "The overlay supplies what this kind of firm actually runs, which platforms carry unused automation, and what is realistically addressable. This is the slot that matters most — without it, C2 is guesswork and must be scored at 1 or 0, never 2, and the missing-depth flag is raised.",
  },
  D: {
    title: "Buying readiness",
    description:
      "Can this actually close? A reachable decision-maker, a budget signal consistent with the settled ladder, and a reason to act now rather than next year.",
    overlaySlot: "Slot D — buying structure and deal size",
    overlayNote:
      "The overlay supplies how this kind of business typically buys — owner decides on the spot, partner committee, managing partner, franchise approval — and roughly what an engagement is worth in this industry. The settled ladder is fixed and does not vary by vertical: AI Readiness Assessment $2,500–$3,500, Workflow Automation Sprint $5,000–$8,000. The overlay informs expectation, not price. Pricing authority sits with Zach.",
  },
  E: {
    title: "Data and compliance context",
    description:
      "Does the business handle regulated or sensitive data that shapes which tools are permissible? This is surfaced at qualification so that it is known before discovery, rather than discovered halfway through a Sprint when a tool turns out to be unusable.",
    overlaySlot: "Slot E — regulatory context",
    overlayNote:
      "The overlay supplies the regime that applies to this kind of business and any tool exclusions the vertical research has already established. Without it, record what is visible, score E4 conservatively, and carry the unknown into discovery as an explicit open question rather than an assumption.",
  },
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

export const F4_GATE: ChecklistItem = {
  ref: "F4",
  question: "Is the request on the service ladder — not a custom build, not an internal AI hire, not general IT support?",
  type: "GATE",
  rubric: "PASS = it's an Assessment or a Sprint · FAIL = they want custom software built, an AI model trained, a full-time internal AI hire, or general IT support",
};

export const F_DISQUALIFIERS: { ref: string; name: string; meaning: string; gate: string; whatToDo: string }[] = [
  { ref: "F1", name: "No identifiable manual workflow", meaning: "You cannot name a single repetitive process. Nothing to assess or automate.", gate: "Gate B1", whatToDo: "Decline. Offer to reconnect if their operation changes." },
  { ref: "F2", name: "No reachable decision-maker", meaning: "The approver cannot be identified or reached through this route.", gate: "Gate D1", whatToDo: "Decline, or hold in Nurture if a route may open later. Do not chase procurement at this engagement size." },
  { ref: "F3", name: "A regulatory context no compliant tool can serve", meaning: "The data regime rules out every tool Robus could deploy at this engagement size.", gate: "Gate E1", whatToDo: "Decline and say why plainly. Refer out where a specialist exists." },
  { ref: "F4", name: "A request outside the service ladder entirely", meaning: "Custom software, a trained AI model, a full-time internal AI hire, or general IT support — none of these is the Assessment or the Sprint.", gate: "Gate F4", whatToDo: "Decline and refer out. This is the most common decline and the one where a good referral earns the most goodwill." },
  { ref: "F5", name: "No plausible automation target", meaning: "A repetitive workflow exists but no available tool can touch it. Distinct from F1 — the work is real, the technology isn't there yet.", gate: "Gate C1", whatToDo: "Decline, and log the workflow. A recurring F5 across several leads is a product signal worth carrying to the hub." },
  { ref: "F6", name: "Vertical-specific disqualifiers", meaning: "The overlay may add disqualifiers particular to this industry, on top of F1–F5.", gate: "Overlay", whatToDo: "Apply as written in the overlay. The universal set above always applies regardless." },
];

// ── Examples sub-page — the two worked examples, verbatim ─────────────────
export type WorkedExampleRow = { ref: string; finding: string; score: string };
export type WorkedExample = {
  title: string;
  description: string;
  rows: WorkedExampleRow[];
  totals: string;
  totalScore: string;
  outcomeTitle: string;
  outcomeBody: string;
};

export const WORKED_EXAMPLES: WorkedExample[] = [
  {
    title: "Worked example 1 — an independent hotel, with no vertical pack",
    description:
      "Illustrative and generic. A privately owned 40-room hotel in a Southeast coastal market, roughly 22 staff, enquiry arrived through a chamber introduction. Hotel is not one of the verticals with a pack, so all five overlay slots are empty and the missing-depth flag raises at step 3.",
    rows: [
      { ref: "B1 · GATE", finding: "Front desk retypes every reservation that arrives by phone or email into the property system, then sends a confirmation by hand. Named, specific, repetitive.", score: "PASS" },
      { ref: "C1 · GATE", finding: "Confirmation messaging and reservation entry are squarely inside what booking and messaging tools do today.", score: "PASS" },
      { ref: "D1 · GATE", finding: "Owner made the enquiry personally and is on the chamber roster. Approves spending himself.", score: "PASS" },
      { ref: "E1 · GATE", finding: "Guest personal data and payment card handling. Both are routine and well served by compliant tools. No blocker.", score: "PASS" },
      { ref: "F4", finding: "He is asking for help with front-desk admin. Squarely on the ladder.", score: "PASS" },
      { ref: "A1", finding: "Privately owned, single property, owner on site daily.", score: "2" },
      { ref: "A2", finding: "22 staff. Inside the 5–100 default — but there is no hotel overlay, so the partner cannot confirm the band is right for hospitality. Conservative-scoring rule applies.", score: "1" },
      { ref: "A3", finding: "Southeast coastal market inside partner territory.", score: "2" },
      { ref: "A4", finding: "Runs a property management system and lists on two booking channels.", score: "2" },
      { ref: "B2", finding: "Forty rooms with daily turnover; the process runs many times every day.", score: "2" },
      { ref: "B3", finding: "Retyping between an inbox and the property system, then a hand-typed confirmation. Plainly manual.", score: "2" },
      { ref: "B4", finding: "Owner mentions doing the night audit reconciliation himself at 1am and is resisting hiring a third front-desk person.", score: "2" },
      { ref: "B5", finding: "Stable process, but occupancy and staffing swing hard between seasons.", score: "1" },
      { ref: "C2", finding: "His property system almost certainly carries unused confirmation and messaging automation — but with no hotel tool research, that is an assumption. Capped at 1 by the conservative-scoring rule.", score: "1" },
      { ref: "C3", finding: "Reservations are already in the system. Nothing to digitise.", score: "2" },
      { ref: "C4", finding: "Measurable directly: confirmation send time, and night-audit hours.", score: "2" },
      { ref: "D2", finding: "Pays an outside bookkeeper. No other outside professional spend visible.", score: "1" },
      { ref: "D3", finding: "Peak season is 90 days out and he is trying to avoid a hire before it starts. Specific and dated.", score: "2" },
      { ref: "D4", finding: "He named the problem himself, unprompted, in the first message.", score: "2" },
      { ref: "E4", finding: "Guest and payment data already sit in a cloud property system. He has cleared the question himself.", score: "2" },
    ],
    totals: "A = 7 · B = 7 · C = 5 · D = 5 · E = 2. Workflow floor B+C = 12 of 14, cleared. No buying-readiness override.",
    totalScore: "26 / 30",
    outcomeTitle: "OUTCOME — QUALIFIED, WITH THE MISSING-DEPTH FLAG RAISED",
    outcomeBody:
      "All gates passed, workflow floor cleared at 12 of 14, total 26 of 30. Schedule discovery. Two of the four points lost were lost to the missing overlay, not to the prospect — A2 and C2 were both capped at 1 because no hotel pack exists. The flag travels with the page into discovery so the partner going into that call knows the tool landscape is unverified and does not make a tool claim it cannot support. Recommended action: the prospect is strong enough to justify building a lightweight hotel overlay before the discovery call.",
  },
  {
    title: "Worked example 2 — a nail salon, with its pack applied",
    description:
      "Illustrative and generic. An owner-operated three-chair nail salon in a Greater Philadelphia suburb, four staff including the owner, enquiry arrived by referral from a prior client. The nail salon pack exists, so all five overlay slots populate.",
    rows: [
      { ref: "B1 · GATE", finding: "Appointment reminders and rebooking prompts are typed and sent by hand, one at a time, from the owner's phone. Overlay slot B listed this as a typical workflow, which is how the partner recognised it immediately.", score: "PASS" },
      { ref: "C1 · GATE", finding: "Automated appointment reminders are a solved problem across every booking platform in this category.", score: "PASS" },
      { ref: "D1 · GATE", finding: "Owner made the enquiry, works a chair, and decides on the spot. Overlay slot D confirms owner-decides is the norm here.", score: "PASS" },
      { ref: "E1 · GATE", finding: "Overlay slot E: no sectoral regime beyond payment card handling and ordinary consumer personal data. No blocker.", score: "PASS" },
      { ref: "F4", finding: "Asking for help with no-shows and reminders. On the ladder.", score: "PASS" },
      { ref: "A1", finding: "Owner-operated, single location, owner on the floor.", score: "2" },
      { ref: "A2", finding: "Four staff — below the 5–100 universal default, and below the five-employee floor the superseded logic would have hard-stopped on. The overlay sets a vertical-appropriate band for this category with volume as the qualifier, and four sits comfortably inside it. Scores full marks. This single row is the reason this checklist was rebuilt.", score: "2" },
      { ref: "A3", finding: "Greater Philadelphia — the home market.", score: "2" },
      { ref: "A4", finding: "Runs a booking app; the link is on the salon's social profile.", score: "2" },
      { ref: "B2", finding: "Roughly 180 appointments a week. Very high volume for four people.", score: "2" },
      { ref: "B3", finding: "Each reminder typed and sent individually between clients. Identical every time.", score: "2" },
      { ref: "B4", finding: "Owner does the reminders herself between appointments and after closing.", score: "2" },
      { ref: "B5", finding: "Stable, though holiday season roughly doubles volume.", score: "1" },
      { ref: "C2", finding: "Overlay slot C confirms from the nail salon tool research that this booking platform includes automated reminders on a tier she already appears to hold. Confirmed, not assumed — so it scores 2. This is exactly the point that C2 was capped at 1 for the hotel.", score: "2" },
      { ref: "C3", finding: "All appointments already in the booking app.", score: "2" },
      { ref: "C4", finding: "No-show rate is directly measurable before and after.", score: "2" },
      { ref: "D2", finding: "Pays for the booking app and a monthly bookkeeper. Modest but real.", score: "1" },
      { ref: "D3", finding: "No-show rate has been climbing since spring and she can quantify what it costs her.", score: "2" },
      { ref: "D4", finding: "She named no-shows as the problem in the referral note.", score: "2" },
      { ref: "E4", finding: "Client records and card handling already sit with cloud providers.", score: "2" },
    ],
    totals: "A = 8 · B = 7 · C = 6 · D = 5 · E = 2. Workflow floor B+C = 13 of 14, cleared. No override.",
    totalScore: "28 / 30",
    outcomeTitle: "OUTCOME — QUALIFIED, NO FLAGS",
    outcomeBody:
      "All gates passed, workflow floor 13 of 14, total 28 of 30. Schedule discovery via Calendly and hand to SOP 1 step 2 with the overlay attached. The comparison between the two examples is the argument for the whole design. The hotel and the salon ran on the same instrument. The salon scored higher, and the four-person business scored higher than the twenty-two-person one — because the checklist measures workflow volume, not headcount. Under the superseded Spoke 7A logic the salon would have been hard-stopped at step 1 on the five-employee floor and never reached a human.",
  },
];
