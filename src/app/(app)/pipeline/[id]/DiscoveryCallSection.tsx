"use client";

import { useState, useTransition } from "react";
import { addDiscoveryCall, updateDiscoveryCall, deleteDiscoveryCall } from "@/lib/pipelineActions";
import { discoveryCallOutcome, floorMet, DISCOVERY_OUTCOME_LABELS, proposalDue } from "@/lib/pipeline";
import { DeleteButton } from "@/components/DeleteButton";
import { formatDate } from "@/lib/formatDate";

type Qualification = { id: string; prospectName: string; dateRun: Date };

type DiscoveryCall = {
  id: string;
  leadQualificationId: string;
  prospectName: string;
  scriptVariant: string;
  callDate: Date;
  runBy: string;
  recorded: string;
  consentCapturedOnRecording: boolean;
  namedWorkflows: number;
  workflowDetail: string | null;
  toolInventory: string | null;
  utilisationFinding: string | null;
  decisionPath: string | null;
  trigger: string | null;
  budgetSignal: string | null;
  budgetSignalDetail: string | null;
  regimeFlagNew: string | null;
  clientLanguage: string | null;
  declineReason: string | null;
  referredTo: string | null;
  followUpDate: Date | null;
  proposalSent: Date | null;
  openQuestions: string | null;
};

const OUTCOME_BADGE: Record<string, string> = {
  PROCEED: "bg-emerald-50 text-emerald-700",
  NURTURE: "bg-amber-50 text-amber-700",
  DECLINE: "bg-red-50 text-red-700",
};

const inputClass = "w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-xs";

export function DiscoveryCallSection({
  clientId,
  defaultProspectName,
  calls,
  qualifications,
}: {
  clientId: string;
  defaultProspectName: string;
  calls: DiscoveryCall[];
  qualifications: Qualification[];
}) {
  const [adding, setAdding] = useState(false);

  if (qualifications.length === 0) {
    return <p className="text-xs text-neutral-400">Run a qualification first — a discovery call needs one to attach to.</p>;
  }

  return (
    <div className="space-y-3">
      {calls.map((c) => (
        <DiscoveryCallRow key={c.id} clientId={clientId} c={c} qualifications={qualifications} />
      ))}

      {adding ? (
        <DiscoveryCallForm
          clientId={clientId}
          defaultProspectName={defaultProspectName}
          qualifications={qualifications}
          onDone={() => setAdding(false)}
        />
      ) : (
        <button onClick={() => setAdding(true)} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
          + Log discovery call
        </button>
      )}
    </div>
  );
}

function DiscoveryCallRow({
  clientId,
  c,
  qualifications,
}: {
  clientId: string;
  c: DiscoveryCall;
  qualifications: Qualification[];
}) {
  const [editing, setEditing] = useState(false);
  const outcome = discoveryCallOutcome(c.namedWorkflows, c.trigger, c.budgetSignal as never);
  const met = floorMet(c.namedWorkflows);

  if (editing) {
    return (
      <DiscoveryCallForm
        clientId={clientId}
        defaultProspectName={c.prospectName}
        qualifications={qualifications}
        existing={c}
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
              {DISCOVERY_OUTCOME_LABELS[outcome]}
            </span>
            <span className="text-xs text-neutral-400">{met ? "Floor met" : "Below 2-workflow floor"}</span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            {c.scriptVariant} · {c.namedWorkflows} workflow{c.namedWorkflows !== 1 ? "s" : ""} named · Run by {c.runBy} ·{" "}
            {formatDate(c.callDate)}
          </p>
          {outcome === "PROCEED" && (
            <p className="text-xs text-neutral-500 mt-1">
              Proposal due {formatDate(proposalDue(c.callDate))}
              {c.proposalSent && ` · sent ${formatDate(c.proposalSent)}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setEditing(true)} className="text-xs font-medium text-neutral-500 hover:text-neutral-800">
            Edit
          </button>
          <DeleteButton
            action={deleteDiscoveryCall.bind(null, c.id, clientId)}
            confirmMessage="Delete this discovery call record? This can't be undone."
          />
        </div>
      </div>
      {c.clientLanguage && <p className="text-xs text-neutral-600 mt-2 italic">&ldquo;{c.clientLanguage}&rdquo;</p>}
    </div>
  );
}

function DiscoveryCallForm({
  clientId,
  defaultProspectName,
  qualifications,
  existing,
  onDone,
}: {
  clientId: string;
  defaultProspectName: string;
  qualifications: Qualification[];
  existing?: DiscoveryCall;
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          if (existing) await updateDiscoveryCall(existing.id, clientId, formData);
          else await addDiscoveryCall(clientId, formData);
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
          <span className="block text-xs font-medium text-neutral-600 mb-1">Qualification record</span>
          <select name="leadQualificationId" defaultValue={existing?.leadQualificationId ?? qualifications[0]?.id} required className={inputClass}>
            {qualifications.map((q) => (
              <option key={q.id} value={q.id}>
                {q.prospectName} — {formatDate(q.dateRun)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="block text-xs font-medium text-neutral-600 mb-1">Script variant</span>
          <select name="scriptVariant" defaultValue={existing?.scriptVariant ?? "ASSESSMENT"} className={inputClass}>
            <option value="ASSESSMENT">Assessment</option>
            <option value="TOOL_ADVISORY">Tool Advisory</option>
            <option value="POLICY">Policy</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <label>
          <span className="block text-xs font-medium text-neutral-600 mb-1">Call date</span>
          <input
            type="date"
            name="callDate"
            defaultValue={existing ? new Date(existing.callDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)}
            className={inputClass}
          />
        </label>
        <label>
          <span className="block text-xs font-medium text-neutral-600 mb-1">Run by</span>
          <input name="runBy" defaultValue={existing?.runBy ?? "Relationship Lead"} required className={inputClass} />
        </label>
        <label>
          <span className="block text-xs font-medium text-neutral-600 mb-1">Named workflows (floor: 2)</span>
          <input type="number" name="namedWorkflows" min={0} defaultValue={existing?.namedWorkflows ?? 0} className={inputClass} />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <label>
          <span className="block text-xs font-medium text-neutral-600 mb-1">Recorded</span>
          <select name="recorded" defaultValue={existing?.recorded ?? "NO_DECLINED"} className={inputClass}>
            <option value="YES_CONSENT_LOGGED">Yes — consent logged</option>
            <option value="NO_DECLINED">No — declined</option>
            <option value="NO_REGIME_FLAG">No — regime flag</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-neutral-700 pt-5">
          <input type="checkbox" name="consentCapturedOnRecording" defaultChecked={existing?.consentCapturedOnRecording ?? false} />
          Consent captured on recording
        </label>
        <label>
          <span className="block text-xs font-medium text-neutral-600 mb-1">Budget signal</span>
          <select name="budgetSignal" defaultValue={existing?.budgetSignal ?? ""} className={inputClass}>
            <option value="">—</option>
            <option value="BUYS_OUTSIDE_SERVICES">Buys outside services</option>
            <option value="SOFTWARE_SPEND_ONLY">Software spend only</option>
            <option value="NOT_OBTAINED">Not obtained</option>
          </select>
        </label>
      </div>

      <label className="block">
        <span className="block text-xs font-medium text-neutral-600 mb-1">Trigger (why now — leave blank if none identified)</span>
        <input name="trigger" defaultValue={existing?.trigger ?? ""} className={inputClass} />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label>
          <span className="block text-xs font-medium text-neutral-600 mb-1">Workflow detail</span>
          <textarea name="workflowDetail" defaultValue={existing?.workflowDetail ?? ""} rows={2} className={inputClass} />
        </label>
        <label>
          <span className="block text-xs font-medium text-neutral-600 mb-1">Tool inventory</span>
          <textarea name="toolInventory" defaultValue={existing?.toolInventory ?? ""} rows={2} className={inputClass} />
        </label>
        <label>
          <span className="block text-xs font-medium text-neutral-600 mb-1">Utilisation finding</span>
          <textarea name="utilisationFinding" defaultValue={existing?.utilisationFinding ?? ""} rows={2} className={inputClass} />
        </label>
        <label>
          <span className="block text-xs font-medium text-neutral-600 mb-1">Decision path</span>
          <textarea name="decisionPath" defaultValue={existing?.decisionPath ?? ""} rows={2} className={inputClass} />
        </label>
      </div>

      <label className="block">
        <span className="block text-xs font-medium text-neutral-600 mb-1">Client language (3–5 verbatim quotes)</span>
        <textarea name="clientLanguage" defaultValue={existing?.clientLanguage ?? ""} rows={2} className={inputClass} />
      </label>

      <div className="grid grid-cols-3 gap-2">
        <label>
          <span className="block text-xs font-medium text-neutral-600 mb-1">Decline reason</span>
          <input name="declineReason" defaultValue={existing?.declineReason ?? ""} className={inputClass} />
        </label>
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
          <span className="block text-xs font-medium text-neutral-600 mb-1">Proposal sent</span>
          <input
            type="date"
            name="proposalSent"
            defaultValue={existing?.proposalSent ? new Date(existing.proposalSent).toISOString().slice(0, 10) : ""}
            className={inputClass}
          />
        </label>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {isPending ? "Saving…" : existing ? "Save changes" : "Log call"}
        </button>
        <button type="button" onClick={onDone} className="text-xs font-medium text-neutral-500 hover:text-neutral-800">
          Cancel
        </button>
      </div>
    </form>
  );
}
