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
  QUALIFICATION_OUTCOME_LABELS,
} from "@/lib/pipeline";
import { DeleteButton } from "@/components/DeleteButton";

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
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Total {total}/30 · Workflow floor {floor}/14 · Run by {q.runBy} · {new Date(q.dateRun).toLocaleDateString()}
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
        <p className="text-xs text-neutral-500 mt-1">Follow up: {new Date(q.followUpDate).toLocaleDateString()}</p>
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
          <span className="block text-xs font-medium text-neutral-600 mb-1">Run by</span>
          <input name="runBy" defaultValue={existing?.runBy ?? "Relationship Lead"} required className={inputClass} />
        </label>
      </div>

      <div>
        <p className="text-xs font-medium text-neutral-600 mb-1">Hard gates</p>
        <div className="flex flex-wrap gap-3">
          {(["gateB1", "gateC1", "gateD1", "gateE1", "gateF4"] as const).map((g) => (
            <label key={g} className="flex items-center gap-1.5 text-xs text-neutral-700">
              <input type="checkbox" name={g} defaultChecked={existing?.[g] ?? false} />
              {g.toUpperCase()}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        <label>
          <span className="block text-xs font-medium text-neutral-600 mb-1">A (0–8)</span>
          <input type="number" name="scoreA" min={0} max={8} defaultValue={existing?.scoreA ?? 0} className={inputClass} />
        </label>
        <label>
          <span className="block text-xs font-medium text-neutral-600 mb-1">B (0–8)</span>
          <input type="number" name="scoreB" min={0} max={8} defaultValue={existing?.scoreB ?? 0} className={inputClass} />
        </label>
        <label>
          <span className="block text-xs font-medium text-neutral-600 mb-1">C (0–6)</span>
          <input type="number" name="scoreC" min={0} max={6} defaultValue={existing?.scoreC ?? 0} className={inputClass} />
        </label>
        <label>
          <span className="block text-xs font-medium text-neutral-600 mb-1">D (0–6)</span>
          <input type="number" name="scoreD" min={0} max={6} defaultValue={existing?.scoreD ?? 0} className={inputClass} />
        </label>
        <label>
          <span className="block text-xs font-medium text-neutral-600 mb-1">E (0–2)</span>
          <input type="number" name="scoreE" min={0} max={2} defaultValue={existing?.scoreE ?? 0} className={inputClass} />
        </label>
      </div>

      <label className="block">
        <span className="block text-xs font-medium text-neutral-600 mb-1">Compliance flags (E2 regime + E3 vendor requirement)</span>
        <input name="complianceFlags" defaultValue={existing?.complianceFlags ?? ""} className={inputClass} />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label>
          <span className="block text-xs font-medium text-neutral-600 mb-1">Vertical overlay</span>
          <select name="verticalOverlayId" defaultValue={existing?.verticalOverlayId ?? ""} className={inputClass}>
            <option value="">— none (missing-depth flag) —</option>
            {overlays.map((o) => (
              <option key={o.id} value={o.id}>
                {o.vertical} ({o.status})
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-neutral-700 pt-5">
          <input type="checkbox" name="overrideApplied" defaultChecked={existing?.overrideApplied ?? false} />
          Buying-readiness override (force Nurture)
        </label>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <label>
          <span className="block text-xs font-medium text-neutral-600 mb-1">Follow-up date</span>
          <input
            type="date"
            name="followUpDate"
            defaultValue={existing?.followUpDate ? new Date(existing.followUpDate).toISOString().slice(0, 10) : ""}
            className={inputClass}
          />
        </label>
        <label>
          <span className="block text-xs font-medium text-neutral-600 mb-1">Decline reason</span>
          <input name="declineReason" defaultValue={existing?.declineReason ?? ""} className={inputClass} />
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
