"use client";

import { useState, useTransition } from "react";
import { updateWorkflowCompliantTool, updateWorkflowScoringDetails } from "@/lib/actions";
import type { CompliantToolStatus } from "@/lib/scoring";

type Workflow = {
  id: string;
  confirmedCompliantTool: CompliantToolStatus;
  creativeAdjacent: boolean;
  creativeAdjacentNote: string | null;
  timeCostHoursPerMonth: number | null;
  revenueOpportunity: number | null;
  revenueBasis: string | null;
  rationale: string | null;
};

const inputClass =
  "w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-300";

export function CompliantToolSelect({ workflow }: { workflow: Workflow }) {
  const [isPending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-neutral-600">Confirmed compliant tool?</span>
      <select
        defaultValue={workflow.confirmedCompliantTool}
        disabled={isPending}
        onChange={(e) => {
          const value = e.target.value as CompliantToolStatus;
          startTransition(async () => await updateWorkflowCompliantTool(workflow.id, value));
        }}
        className="text-xs rounded-md border border-neutral-300 px-2 py-1"
      >
        <option value="UNANSWERED">Unanswered</option>
        <option value="YES">Yes</option>
        <option value="NO">No</option>
      </select>
    </div>
  );
}

export function ScoringDetailsForm({ workflow }: { workflow: Workflow }) {
  const [isPending, startTransition] = useTransition();
  const [creativeAdjacent, setCreativeAdjacent] = useState(workflow.creativeAdjacent);
  const [saved, setSaved] = useState(false);

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await updateWorkflowScoringDetails(workflow.id, formData);
          setSaved(true);
          setTimeout(() => setSaved(false), 1500);
        });
      }}
      className="space-y-2 bg-neutral-50 rounded-lg p-3"
    >
      <label className="block">
        <span className="block text-xs font-medium text-neutral-600 mb-1">
          Rationale <span className="text-neutral-400">(required to read Complete)</span>
        </span>
        <textarea name="rationale" defaultValue={workflow.rationale ?? ""} rows={2} className={inputClass} />
      </label>

      <div className="grid grid-cols-3 gap-2">
        <label>
          <span className="block text-xs font-medium text-neutral-600 mb-1">Time cost (hrs/mo)</span>
          <input
            name="timeCostHoursPerMonth"
            type="number"
            step="0.5"
            min="0"
            defaultValue={workflow.timeCostHoursPerMonth ?? ""}
            className={inputClass}
          />
        </label>
        <label>
          <span className="block text-xs font-medium text-neutral-600 mb-1">Revenue ($/yr)</span>
          <input
            name="revenueOpportunity"
            type="number"
            step="100"
            min="0"
            defaultValue={workflow.revenueOpportunity ?? ""}
            className={inputClass}
          />
        </label>
        <label>
          <span className="block text-xs font-medium text-neutral-600 mb-1">Revenue basis</span>
          <select name="revenueBasis" defaultValue={workflow.revenueBasis ?? ""} className={inputClass}>
            <option value="">—</option>
            <option value="MEASURED">Measured</option>
            <option value="ESTIMATED">Estimated</option>
            <option value="UNMEASURED">Unmeasured</option>
          </select>
        </label>
      </div>

      <div>
        <label className="flex items-center gap-2 text-xs text-neutral-700">
          <input
            type="checkbox"
            name="creativeAdjacent"
            checked={creativeAdjacent}
            onChange={(e) => setCreativeAdjacent(e.target.checked)}
          />
          Creative-adjacent — part of this stays manual
        </label>
        {creativeAdjacent && (
          <textarea
            name="creativeAdjacentNote"
            required
            defaultValue={workflow.creativeAdjacentNote ?? ""}
            rows={2}
            placeholder="What stays manual, and why"
            className={`${inputClass} mt-1.5`}
          />
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save details"}
        </button>
        {saved && <span className="text-xs text-emerald-600">✓ Saved</span>}
      </div>
    </form>
  );
}
