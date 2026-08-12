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
  sectionScore,
  SIGNAL_REFS,
  QUALIFICATION_OUTCOME_LABELS,
  type GateStatus,
  type ItemScores,
} from "@/lib/pipeline";
import { DeleteButton } from "@/components/DeleteButton";
import { formatDate } from "@/lib/formatDate";
import { SECTION_A, SECTION_B, SECTION_C, SECTION_D, SECTION_E, F4_GATE, F_DISQUALIFIERS, type ChecklistItem } from "@/lib/qualificationChecklist";

type Overlay = { id: string; vertical: string; status: string };

type Qualification = {
  id: string;
  prospectName: string;
  source: string;
  dateRun: Date;
  runBy: string;
  gateB1: GateStatus;
  gateC1: GateStatus;
  gateD1: GateStatus;
  gateE1: GateStatus;
  gateF4: GateStatus;
  itemScores: ItemScores;
  itemNotes: Partial<Record<string, string>>;
  regimeFlag: string | null;
  vendorRequirement: string | null;
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
  const total = qualificationTotal(q.itemScores);
  const floor = workflowFloor(q.itemScores);
  const outcome = qualificationOutcome(gates, q.itemScores, q.overrideApplied);
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
          <a
            href={`/pipeline/${clientId}/qualification/${q.id}/download`}
            className="text-xs font-medium text-neutral-500 hover:text-neutral-800"
          >
            ⬇ Report (PDF)
          </a>
          <button onClick={() => setEditing(true)} className="text-xs font-medium text-neutral-500 hover:text-neutral-800">
            Edit
          </button>
          <DeleteButton
            action={deleteQualification.bind(null, q.id, clientId)}
            confirmMessage="Delete this qualification record? This can't be undone."
          />
        </div>
      </div>
      {(q.regimeFlag || q.vendorRequirement) && (
        <p className="text-xs text-neutral-600 mt-2">
          {q.regimeFlag && <>E2 regime: {q.regimeFlag}</>}
          {q.regimeFlag && q.vendorRequirement && " · "}
          {q.vendorRequirement && <>E3 vendor requirement: {q.vendorRequirement}</>}
        </p>
      )}
      {outcome === "NURTURE" && q.followUpDate && (
        <p className="text-xs text-neutral-500 mt-1">Follow up: {formatDate(q.followUpDate)}</p>
      )}
      {outcome === "NOT_QUALIFIED" && q.declineReason && (
        <p className="text-xs text-neutral-500 mt-1">
          Decline reason: {q.declineReason}
          {q.referredTo && ` · Referred to ${q.referredTo}`}
        </p>
      )}

      <CondensedReport q={q} outcome={outcome} total={total} floor={floor} />
    </div>
  );
}

const OUTCOME_TONE: Record<string, { bg: string; text: string }> = {
  QUALIFIED: { bg: "bg-emerald-50 border-emerald-100", text: "text-emerald-900" },
  NURTURE: { bg: "bg-amber-50 border-amber-100", text: "text-amber-900" },
  NOT_QUALIFIED: { bg: "bg-red-50 border-red-100", text: "text-red-900" },
};

// The same shape as the Examples page — Ref / What was found / Score, per
// section — but populated from this qualification's real data instead of
// the illustrative examples.
function CondensedReport({
  q,
  outcome,
  total,
  floor,
}: {
  q: Qualification;
  outcome: "QUALIFIED" | "NURTURE" | "NOT_QUALIFIED";
  total: number;
  floor: number;
}) {
  const sections: { letter: keyof typeof SIGNAL_REFS; items: ChecklistItem[]; max: number }[] = [
    { letter: "A", items: SECTION_A, max: 8 },
    { letter: "B", items: SECTION_B, max: 8 },
    { letter: "C", items: SECTION_C, max: 6 },
    { letter: "D", items: SECTION_D, max: 6 },
    { letter: "E", items: SECTION_E, max: 2 },
  ];
  const gates: Record<string, GateStatus> = { gateB1: q.gateB1, gateC1: q.gateC1, gateD1: q.gateD1, gateE1: q.gateE1, gateF4: q.gateF4 };
  const tone = OUTCOME_TONE[outcome];

  return (
    <details className="mt-3 border-t border-neutral-100 pt-3" open>
      <summary className="cursor-pointer text-xs font-medium text-neutral-500 hover:text-neutral-800">Full report</summary>
      <div className="mt-2 space-y-3">
        {sections.map(({ letter, items, max }) => (
          <div key={letter}>
            <p className="text-xs font-semibold text-neutral-700 mb-1">
              {letter} · {sectionScore(q.itemScores, letter)}/{max}
            </p>
            <div className="border border-neutral-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-neutral-50 text-neutral-400 uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-2 py-1 font-medium w-10">Ref</th>
                    <th className="text-left px-2 py-1 font-medium">What was found</th>
                    <th className="text-right px-2 py-1 font-medium w-14">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {items
                    .filter((item) => item.type !== "FLAG")
                    .map((item) => {
                      const gateKey = `gate${letter}1`;
                      const scoreDisplay =
                        item.type === "GATE"
                          ? gates[gateKey] === "PASS"
                            ? "PASS"
                            : gates[gateKey] === "FAIL"
                              ? "FAIL"
                              : "—"
                          : (q.itemScores[item.ref] ?? "—");
                      return (
                        <tr key={item.ref}>
                          <td className="px-2 py-1.5 align-top font-medium text-neutral-800 whitespace-nowrap">{item.ref}</td>
                          <td className="px-2 py-1.5 align-top text-neutral-600">{q.itemNotes[item.ref] || "No notes recorded."}</td>
                          <td className="px-2 py-1.5 align-top text-right font-medium text-neutral-900">{scoreDisplay}</td>
                        </tr>
                      );
                    })}
                  {letter === "E" && (
                    <>
                      <tr>
                        <td className="px-2 py-1.5 align-top font-medium text-neutral-800">E2</td>
                        <td colSpan={2} className="px-2 py-1.5 align-top text-neutral-600">
                          Regime: {q.regimeFlag || "not recorded"}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-2 py-1.5 align-top font-medium text-neutral-800">E3</td>
                        <td colSpan={2} className="px-2 py-1.5 align-top text-neutral-600">
                          Vendor requirement: {q.vendorRequirement || "not recorded"}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        <div>
          <p className="text-xs font-semibold text-neutral-700 mb-1">F4</p>
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <tbody>
                <tr>
                  <td className="px-2 py-1.5 align-top font-medium text-neutral-800 w-10">F4</td>
                  <td className="px-2 py-1.5 align-top text-neutral-600">{q.itemNotes.F4 || "No notes recorded."}</td>
                  <td className="px-2 py-1.5 align-top text-right font-medium text-neutral-900 w-14">
                    {gates.gateF4 === "PASS" ? "PASS" : gates.gateF4 === "FAIL" ? "FAIL" : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className={`rounded-lg border px-3 py-2 ${tone.bg}`}>
          <p className={`text-xs font-semibold ${tone.text}`}>OUTCOME — {QUALIFICATION_OUTCOME_LABELS[outcome]}</p>
          <p className={`text-xs mt-1 ${tone.text}`}>
            Total {total} of 30. Workflow floor {floor} of 14 — {floor >= 8 ? "cleared" : "not cleared"}.
            {q.overrideApplied && " Buying-readiness override applied."}
          </p>
        </div>
      </div>
    </details>
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
  const [error, setError] = useState<string | null>(null);

  const [gates, setGates] = useState<Record<string, GateStatus>>({
    gateB1: existing?.gateB1 ?? null,
    gateC1: existing?.gateC1 ?? null,
    gateD1: existing?.gateD1 ?? null,
    gateE1: existing?.gateE1 ?? null,
    gateF4: existing?.gateF4 ?? null,
  });
  const [itemScores, setItemScores] = useState<Record<string, number | undefined>>(existing?.itemScores ?? {});
  const [itemNotes, setItemNotes] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(existing?.itemNotes ?? {}).map(([k, v]) => [k, v ?? ""]))
  );
  const [overrideApplied, setOverrideApplied] = useState(existing?.overrideApplied ?? false);
  const [verticalOverlayId, setVerticalOverlayId] = useState(existing?.verticalOverlayId ?? "");
  const [flagValues, setFlagValues] = useState<Record<string, string>>({
    E2: existing?.regimeFlag ?? "",
    E3: existing?.vendorRequirement ?? "",
  });

  const total = qualificationTotal(itemScores);
  const floor = workflowFloor(itemScores);
  const liveOutcome = qualificationOutcome(
    { gateB1: gates.gateB1, gateC1: gates.gateC1, gateD1: gates.gateD1, gateE1: gates.gateE1, gateF4: gates.gateF4 },
    itemScores,
    overrideApplied
  );
  const depth = verticalDepth(!!verticalOverlayId);

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          try {
            if (existing) await updateQualification(existing.id, clientId, formData);
            else await addQualification(clientId, formData);
            onDone();
          } catch {
            setError("Could not save — check the required fields above.");
          }
        });
      }}
      className="border border-indigo-200 bg-indigo-50/30 rounded-xl p-4 space-y-3"
    >
      {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}

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
        max={8}
        itemScores={itemScores}
        itemNotes={itemNotes}
        gates={gates}
        onScoreChange={(ref, v) => setItemScores((s) => ({ ...s, [ref]: v }))}
        onNoteChange={(ref, v) => setItemNotes((n) => ({ ...n, [ref]: v }))}
        onGateChange={(ref, v) => setGates((g) => ({ ...g, [ref]: v }))}
      />
      <ChecklistSection
        letter="B"
        title="Workflow fit — the real qualifier. B1 is the primary gate of the whole checklist."
        items={SECTION_B}
        max={8}
        itemScores={itemScores}
        itemNotes={itemNotes}
        gates={gates}
        onScoreChange={(ref, v) => setItemScores((s) => ({ ...s, [ref]: v }))}
        onNoteChange={(ref, v) => setItemNotes((n) => ({ ...n, [ref]: v }))}
        onGateChange={(ref, v) => setGates((g) => ({ ...g, [ref]: v }))}
      />
      <ChecklistSection
        letter="C"
        title="AI-addressability — is at least one workflow something a tool available today could plausibly address?"
        items={SECTION_C}
        max={6}
        itemScores={itemScores}
        itemNotes={itemNotes}
        gates={gates}
        onScoreChange={(ref, v) => setItemScores((s) => ({ ...s, [ref]: v }))}
        onNoteChange={(ref, v) => setItemNotes((n) => ({ ...n, [ref]: v }))}
        onGateChange={(ref, v) => setGates((g) => ({ ...g, [ref]: v }))}
      />
      <ChecklistSection
        letter="D"
        title="Buying readiness — can this actually close?"
        items={SECTION_D}
        max={6}
        itemScores={itemScores}
        itemNotes={itemNotes}
        gates={gates}
        onScoreChange={(ref, v) => setItemScores((s) => ({ ...s, [ref]: v }))}
        onNoteChange={(ref, v) => setItemNotes((n) => ({ ...n, [ref]: v }))}
        onGateChange={(ref, v) => setGates((g) => ({ ...g, [ref]: v }))}
      />
      <ChecklistSection
        letter="E"
        title="Data and compliance context — surfaced now so it isn't discovered halfway through a Sprint."
        items={SECTION_E}
        max={2}
        itemScores={itemScores}
        itemNotes={itemNotes}
        gates={gates}
        flagValues={flagValues}
        onScoreChange={(ref, v) => setItemScores((s) => ({ ...s, [ref]: v }))}
        onNoteChange={(ref, v) => setItemNotes((n) => ({ ...n, [ref]: v }))}
        onGateChange={(ref, v) => setGates((g) => ({ ...g, [ref]: v }))}
        onFlagChange={(ref, v) => setFlagValues((f) => ({ ...f, [ref]: v }))}
      />

      <details className="border border-neutral-200 rounded-lg px-3 py-2" open>
        <summary className="cursor-pointer text-xs font-medium text-neutral-800">
          F4 · A request outside the service ladder entirely
        </summary>
        <div className="mt-2 space-y-2">
          <GateRow gateKey="gateF4" item={F4_GATE} value={gates.gateF4} note={itemNotes.F4 ?? ""} onGateChange={(v) => setGates((g) => ({ ...g, gateF4: v }))} onNoteChange={(v) => setItemNotes((n) => ({ ...n, F4: v }))} />
        </div>
      </details>

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

function GateRow({
  gateKey,
  item,
  value,
  note,
  onGateChange,
  onNoteChange,
}: {
  gateKey: string;
  item: ChecklistItem;
  value: GateStatus;
  note: string;
  onGateChange: (v: GateStatus) => void;
  onNoteChange: (v: string) => void;
}) {
  return (
    <div className="bg-red-50/50 border border-red-100 rounded-md px-2 py-1.5 space-y-1.5">
      <div className="flex items-start gap-2">
        <select
          name={gateKey}
          value={value ?? ""}
          onChange={(e) => onGateChange(e.target.value === "" ? null : (e.target.value as GateStatus))}
          className="text-xs rounded-md border border-neutral-300 px-1.5 py-1 shrink-0"
        >
          <option value="">— unresolved —</option>
          <option value="PASS">Pass</option>
          <option value="FAIL">Fail</option>
        </select>
        <span className="text-xs text-neutral-700">
          <span className="font-medium">{item.ref} · GATE</span> — {item.question}
          <br />
          <span className="text-neutral-500">{item.rubric}</span>
        </span>
      </div>
      <input
        name={`note_${item.ref}`}
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        placeholder="Notes…"
        className="w-full rounded-md border border-neutral-300 px-2 py-1 text-xs"
      />
    </div>
  );
}

const FLAG_FIELD_NAME: Record<string, string> = { E2: "regimeFlag", E3: "vendorRequirement" };
const FLAG_PLACEHOLDER: Record<string, string> = { E2: 'e.g. "none identified"', E3: 'e.g. "none stated"' };

function ChecklistSection({
  letter,
  title,
  items,
  max,
  itemScores,
  itemNotes,
  gates,
  flagValues,
  onScoreChange,
  onNoteChange,
  onGateChange,
  onFlagChange,
}: {
  letter: string;
  title: string;
  items: ChecklistItem[];
  max: number;
  itemScores: Record<string, number | undefined>;
  itemNotes: Record<string, string>;
  gates: Record<string, GateStatus>;
  flagValues?: Record<string, string>;
  onScoreChange: (ref: string, v: number) => void;
  onNoteChange: (ref: string, v: string) => void;
  onGateChange: (gateKey: string, v: GateStatus) => void;
  onFlagChange?: (ref: string, v: string) => void;
}) {
  const gateKey = `gate${letter}1`;
  const score = sectionScore(itemScores, letter as keyof typeof SIGNAL_REFS);

  return (
    <details className="border border-neutral-200 rounded-lg px-3 py-2" open>
      <summary className="cursor-pointer text-xs font-medium text-neutral-800">
        {letter} · {title} — Section subtotal {score}/{max}
      </summary>
      <div className="mt-2 space-y-2">
        {items.map((item) => {
          if (item.type === "GATE") {
            return (
              <GateRow
                key={item.ref}
                gateKey={gateKey}
                item={item}
                value={gates[gateKey] ?? null}
                note={itemNotes[item.ref] ?? ""}
                onGateChange={(v) => onGateChange(gateKey, v)}
                onNoteChange={(v) => onNoteChange(item.ref, v)}
              />
            );
          }
          if (item.type === "FLAG") {
            return (
              <div key={item.ref} className="space-y-1 bg-sky-50/50 border border-sky-100 rounded-md px-2 py-1.5">
                <span className="text-xs text-neutral-700">
                  <span className="font-medium">{item.ref} · FLAG</span> — {item.question}
                  <br />
                  <span className="text-neutral-500">{item.rubric}</span>
                </span>
                <input
                  name={FLAG_FIELD_NAME[item.ref]}
                  value={flagValues?.[item.ref] ?? ""}
                  onChange={(e) => onFlagChange?.(item.ref, e.target.value)}
                  placeholder={FLAG_PLACEHOLDER[item.ref] ?? ""}
                  className="w-full rounded-md border border-neutral-300 px-2 py-1 text-xs"
                />
              </div>
            );
          }
          // SIGNAL
          return (
            <div key={item.ref} className="space-y-1">
              <div className="flex items-start gap-2">
                <select
                  name={`score_${item.ref}`}
                  value={itemScores[item.ref] ?? ""}
                  onChange={(e) => onScoreChange(item.ref, Number(e.target.value))}
                  className="text-xs rounded-md border border-neutral-300 px-1.5 py-1 shrink-0 w-14"
                >
                  <option value="">—</option>
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                </select>
                <span className="text-xs text-neutral-700">
                  <span className="font-medium">{item.ref} · SIGNAL</span> — {item.question}
                  <br />
                  <span className="text-neutral-500">{item.rubric}</span>
                </span>
              </div>
              <input
                name={`note_${item.ref}`}
                value={itemNotes[item.ref] ?? ""}
                onChange={(e) => onNoteChange(item.ref, e.target.value)}
                placeholder="Notes…"
                className="w-full rounded-md border border-neutral-300 px-2 py-1 text-xs"
              />
            </div>
          );
        })}
      </div>
    </details>
  );
}
