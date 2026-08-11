"use client";

import { useState, useTransition } from "react";
import {
  addQualification,
  updateQualification,
  updateChecklistComplete,
  deleteQualification,
} from "@/lib/pipelineActions";
import {
  qualificationTotal,
  workflowFloor,
  verticalDepth,
  qualificationOutcome,
  qualificationNextStep,
  QUALIFICATION_OUTCOME_LABELS,
} from "@/lib/pipeline";
import { DeleteButton } from "@/components/DeleteButton";
import { formatDate } from "@/lib/formatDate";
import { SECTION_A, SECTION_B, SECTION_C, SECTION_D, SECTION_E, F_DISQUALIFIERS, type ChecklistItem } from "@/lib/qualificationChecklist";

type Overlay = { id: string; vertical: string; status: string };

type Qualification = {
  id: string;
  prospectName: string;
  source: string;
  dateRun: Date;
  runBy: string;
  gateB1: boolean;
  gateC1: boolean;
  gateD1: boolean;
  gateE1: boolean;
  gateF4: boolean;
  scoreA: number;
  scoreB: number;
  scoreC: number;
  scoreD: number;
  scoreE: number;
  complianceFlags: string | null;
  verticalOverlayId: string | null;
  overrideApplied: boolean;
  followUpDate: Date | null;
  declineReason: string | null;
  referredTo: string | null;
  checklistComplete: boolean;
};

const OUTCOME_BADGE: Record<string, string> = {
  QUALIFIED: "bg-emerald-50 text-emerald-700",
  NURTURE: "bg-amber-50 text-amber-700",
  NOT_QUALIFIED: "bg-red-50 text-red-700",
};

const inputClass = "w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-xs";

export function QualificationSection({
  clientId,
  defaultProspectName,
  qualifications,
  overlays,
}: {
  clientId: string;
  defaultProspectName: string;
  qualifications: Qualification[];
  overlays: Overlay[];
}) {
  const [adding, setAdding] = useState(qualifications.length === 0);

  return (
    <div className="space-y-3">
      {qualifications.map((q) => (
        <QualificationRow key={q.id} clientId={clientId} q={q} overlays={overlays} />
      ))}

      {adding ? (
        <QualificationForm
          clientId={clientId}
          defaultProspectName={defaultProspectName}
          overlays={overlays}
          onDone={() => setAdding(false)}
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          + Run another qualification
        </button>
      )}
    </div>
  );
}

function QualificationRow({ clientId, q, overlays }: { clientId: string; q: Qualification; overlays: Overlay[] }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const gates = { gateB1: q.gateB1, gateC1: q.gateC1, gateD1: q.gateD1, gateE1: q.gateE1, gateF4: q.gateF4 };
  const scores = { scoreA: q.scoreA, scoreB: q.scoreB, scoreC: q.scoreC, scoreD: q.scoreD, scoreE: q.scoreE };
  const total = qualificationTotal(scores);
  const floor = workflowFloor(scores);
  const outcome = qualificationOutcome(gates, scores, q.overrideApplied);
  const depth = verticalDepth(!!q.verticalOverlayId);
  const nextStep = qualificationNextStep(outcome);

  if (editing) {
    return (
      <QualificationForm
        clientId={clientId}
        defaultProspectName={q.prospectName}
        overlays={overlays}
        existing={q}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="border border-neutral-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${OUTCOME_BADGE[outcome]}`}>
              {QUALIFICATION_OUTCOME_LABELS[outcome]}
            </span>
            <span className="text-xs text-neutral-400">{depth}</span>
            {q.overrideApplied && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                Buying-readiness override
              </span>
            )}
            {nextStep && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                Next: {nextStep}
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Total {total}/30 · Workflow floor {floor}/14 · Run by {q.runBy} · {formatDate(q.dateRun)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-1.5 text-xs text-neutral-600">
            <input
              type="checkbox"
              checked={q.checklistComplete}
              disabled={isPending}
              onChange={(e) => {
                const checked = e.target.checked;
                startTransition(async () => await updateChecklistComplete(q.id, clientId, checked));
              }}
            />
            Complete
          </label>
          <button onClick={() => setEditing(true)} className="text-xs font-medium text-neutral-500 hover:text-neutral-800">
            Edit
          </button>
          <DeleteButton
            action={deleteQualification.bind(null, q.id, clientId)}
            confirmMessage="Delete this qualification record? This can't be undone."
          />
        </div>
      </div>
      {q.complianceFlags && <p className="text-xs text-neutral-600 mt-2">Compliance: {q.complianceFlags}</p>}
      {outcome === "NURTURE" && q.followUpDate && (
        <p className="text-xs text-neutral-500 mt-1">Follow up: {formatDate(q.followUpDate)}</p>
      )}
      {outcome === "NOT_QUALIFIED" && q.declineReason && (
        <p className="text-xs text-neutral-500 mt-1">
          Decline reason: {q.declineReason}
          {q.referredTo && ` · Referred to ${q.referredTo}`}
        </p>
      )}
    </div>
  );
}

function QualificationForm({
  clientId,
  defaultProspectName,
  overlays,
  existing,
  onDone,
}: {
  clientId: string;
  defaultProspectName: string;
  overlays: Overlay[];
  existing?: Qualification;
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  // Controlled only for the fields the decision rule reads, so the outcome
  // preview (and the conditional-required hints below) stay live as the
  // partner works the checklist — the same computation the DB will run,
  // just visible before saving instead of only after.
  const [gates, setGates] = useState({
    gateB1: existing?.gateB1 ?? false,
    gateC1: existing?.gateC1 ?? false,
    gateD1: existing?.gateD1 ?? false,
    gateE1: existing?.gateE1 ?? false,
    gateF4: existing?.gateF4 ?? false,
  });
  const [scores, setScores] = useState({
    scoreA: existing?.scoreA ?? 0,
    scoreB: existing?.scoreB ?? 0,
    scoreC: existing?.scoreC ?? 0,
    scoreD: existing?.scoreD ?? 0,
    scoreE: existing?.scoreE ?? 0,
  });
  const [overrideApplied, setOverrideApplied] = useState(existing?.overrideApplied ?? false);
  const [verticalOverlayId, setVerticalOverlayId] = useState(existing?.verticalOverlayId ?? "");

  const total = qualificationTotal(scores);
  const floor = workflowFloor(scores);
  const liveOutcome = qualificationOutcome(gates, scores, overrideApplied);
  const depth = verticalDepth(!!verticalOverlayId);

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          if (existing) await updateQualification(existing.id, clientId, formData);
          else await addQualification(clientId, formData);
          onDone();
        });
      }}
      className="border border-indigo-200 bg-indigo-50/30 rounded-xl p-4 space-y-3"
    >
      <div className="flex items-center justify-between gap-3 bg-white rounded-lg border border-neutral-200 px-3 py-2">
        <div className="flex items-center gap-3 text-xs">
          <span className={`font-medium px-2 py-0.5 rounded-full ${OUTCOME_BADGE[liveOutcome]}`}>{QUALIFICATION_OUTCOME_LABELS[liveOutcome]}</span>
          <span className="text-neutral-500">Total {total}/30</span>
          <span className="text-neutral-500">Workflow floor {floor}/14 (needs 8)</span>
          <span className="text-neutral-400">{depth}</span>
        </div>
        {!verticalOverlayId && (
          <span className="text-xs text-amber-700">No overlay — score A2 and C2 conservatively (max 1), never above 1 on C2.</span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <label>
          <span className="block text-xs font-medium text-neutral-600 mb-1">Prospect</span>
          <input name="prospectName" defaultValue={existing?.prospectName ?? defaultProspectName} required className={inputClass} />
        </label>
        <label>
          <span className="block text-xs font-medium text-neutral-600 mb-1">Source</span>
          <select name="source" defaultValue={existing?.source ?? "REFERRAL"} className={inputClass}>
            <option value="REFERRAL">Referral</option>
            <option value="CHAMBER_OR_ASSOCIATION">Chamber or association</option>
            <option value="LINKEDIN">LinkedIn</option>
            <option value="EMAIL_INBOUND">Email inbound</option>
            <option value="PRIOR_CLIENT">Prior client</option>
            <option value="WEBSITE">Website</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <label>
          <span className="block text-xs font-medium text-neutral-600 mb-1">Run by (Relationship Lead)</span>
          <input name="runBy" defaultValue={existing?.runBy ?? "Relationship Lead"} required className={inputClass} />
        </label>
      </div>

      <ChecklistSection
        letter="A"
        title="Firm fit — is this a business the partner can serve at all? Nothing here is a gate."
        items={SECTION_A}
        score={scores.scoreA}
        max={8}
        onScoreChange={(v) => setScores((s) => ({ ...s, scoreA: v }))}
      />
      <ChecklistSection
        letter="B"
        title="Workflow fit — the real qualifier. B1 is the primary gate of the whole checklist."
        items={SECTION_B}
        score={scores.scoreB}
        max={8}
        gateValue={gates.gateB1}
        onGateChange={(v) => setGates((g) => ({ ...g, gateB1: v }))}
        onScoreChange={(v) => setScores((s) => ({ ...s, scoreB: v }))}
      />
      <ChecklistSection
        letter="C"
        title="AI-addressability — is at least one workflow something a tool available today could plausibly address?"
        items={SECTION_C}
        score={scores.scoreC}
        max={6}
        gateValue={gates.gateC1}
        onGateChange={(v) => setGates((g) => ({ ...g, gateC1: v }))}
        onScoreChange={(v) => setScores((s) => ({ ...s, scoreC: v }))}
      />
      <ChecklistSection
        letter="D"
        title="Buying readiness — can this actually close?"
        items={SECTION_D}
        score={scores.scoreD}
        max={6}
        gateValue={gates.gateD1}
        onGateChange={(v) => setGates((g) => ({ ...g, gateD1: v }))}
        onScoreChange={(v) => setScores((s) => ({ ...s, scoreD: v }))}
      />
      <ChecklistSection
        letter="E"
        title="Data and compliance context — surfaced now so it isn't discovered halfway through a Sprint."
        items={SECTION_E}
        score={scores.scoreE}
        max={2}
        gateValue={gates.gateE1}
        onGateChange={(v) => setGates((g) => ({ ...g, gateE1: v }))}
        onScoreChange={(v) => setScores((s) => ({ ...s, scoreE: v }))}
      />

      <label className="flex items-center gap-1.5 text-xs text-neutral-700">
        <input
          type="checkbox"
          name="gateF4"
          checked={gates.gateF4}
          onChange={(e) => setGates((g) => ({ ...g, gateF4: e.target.checked }))}
        />
        F4 — on the service ladder (not a custom build, not an internal AI hire, not general IT support)
      </label>

      <details className="border border-neutral-200 rounded-lg px-3 py-2">
        <summary className="cursor-pointer text-xs font-medium text-neutral-700">F1–F6 — hard disqualifiers, thirty-second scan</summary>
        <div className="mt-2 space-y-1.5">
          {F_DISQUALIFIERS.map((f) => (
            <p key={f.ref} className="text-xs text-neutral-600">
              <span className="font-medium text-neutral-800">{f.ref} — {f.name}</span> ({f.gate}). {f.meaning}
            </p>
          ))}
        </div>
      </details>

      <label className="block">
        <span className="block text-xs font-medium text-neutral-600 mb-1">Compliance flags (E2 regime + E3 vendor requirement — write &quot;none identified&quot; if none)</span>
        <input name="complianceFlags" defaultValue={existing?.complianceFlags ?? ""} className={inputClass} />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label>
          <span className="block text-xs font-medium text-neutral-600 mb-1">Vertical overlay</span>
          <select
            name="verticalOverlayId"
            value={verticalOverlayId}
            onChange={(e) => setVerticalOverlayId(e.target.value)}
            className={inputClass}
          >
            <option value="">— none (missing-depth flag) —</option>
            {overlays.map((o) => (
              <option key={o.id} value={o.id}>
                {o.vertical} ({o.status})
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-neutral-700 pt-5">
          <input
            type="checkbox"
            name="overrideApplied"
            checked={overrideApplied}
            onChange={(e) => setOverrideApplied(e.target.checked)}
          />
          Buying-readiness override — D2 and D3 both zero forces Nurture regardless of total
        </label>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <label>
          <span className="block text-xs font-medium text-neutral-600 mb-1">
            Follow-up date {liveOutcome === "NURTURE" && <span className="text-red-600">(required — 60–90 days on a near miss, 6 months on a low score)</span>}
          </span>
          <input
            type="date"
            name="followUpDate"
            required={liveOutcome === "NURTURE"}
            defaultValue={existing?.followUpDate ? new Date(existing.followUpDate).toISOString().slice(0, 10) : ""}
            className={inputClass}
          />
        </label>
        <label>
          <span className="block text-xs font-medium text-neutral-600 mb-1">
            Decline reason {liveOutcome === "NOT_QUALIFIED" && <span className="text-red-600">(required — name the gate that failed)</span>}
          </span>
          <input
            name="declineReason"
            required={liveOutcome === "NOT_QUALIFIED"}
            defaultValue={existing?.declineReason ?? ""}
            className={inputClass}
          />
        </label>
        <label>
          <span className="block text-xs font-medium text-neutral-600 mb-1">Referred to</span>
          <input name="referredTo" defaultValue={existing?.referredTo ?? ""} className={inputClass} />
        </label>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {isPending ? "Saving…" : existing ? "Save changes" : "Run qualification"}
        </button>
        <button type="button" onClick={onDone} className="text-xs font-medium text-neutral-500 hover:text-neutral-800">
          Cancel
        </button>
      </div>
    </form>
  );
}

function ChecklistSection({
  letter,
  title,
  items,
  score,
  max,
  gateValue,
  onGateChange,
  onScoreChange,
}: {
  letter: string;
  title: string;
  items: ChecklistItem[];
  score: number;
  max: number;
  gateValue?: boolean;
  onGateChange?: (v: boolean) => void;
  onScoreChange: (v: number) => void;
}) {
  const gateItem = items.find((i) => i.type === "GATE");
  const signalItems = items.filter((i) => i.type !== "GATE");

  return (
    <details className="border border-neutral-200 rounded-lg px-3 py-2" open>
      <summary className="cursor-pointer text-xs font-medium text-neutral-800">
        {letter} · {title}
      </summary>
      <div className="mt-2 space-y-2">
        {gateItem && onGateChange && (
          <label className="flex items-start gap-2 bg-red-50/50 border border-red-100 rounded-md px-2 py-1.5">
            <input
              type="checkbox"
              name={`gate${letter}1`}
              className="mt-0.5"
              checked={gateValue}
              onChange={(e) => onGateChange(e.target.checked)}
            />
            <span className="text-xs text-neutral-700">
              <span className="font-medium">{gateItem.ref} · GATE</span> — {gateItem.question}
              <br />
              <span className="text-neutral-500">{gateItem.rubric}</span>
            </span>
          </label>
        )}
        {signalItems.map((item) => (
          <div key={item.ref} className="text-xs text-neutral-700">
            <span className="font-medium">{item.ref} · {item.type}</span> — {item.question}
            <br />
            <span className="text-neutral-500">{item.rubric}</span>
          </div>
        ))}
        <label className="flex items-center gap-2 pt-1">
          <span className="text-xs font-medium text-neutral-600">Section {letter} subtotal (0–{max})</span>
          <input
            type="number"
            min={0}
            max={max}
            name={`score${letter}`}
            value={score}
            onChange={(e) => onScoreChange(Number(e.target.value))}
            className="w-20 rounded-md border border-neutral-300 px-2 py-1 text-xs"
          />
        </label>
      </div>
    </details>
  );
}
