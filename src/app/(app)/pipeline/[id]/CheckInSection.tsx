"use client";

import { useRef, useState, useTransition } from "react";
import { addCheckIn, deleteCheckIn } from "@/lib/pipelineActions";
import { DeleteButton } from "@/components/DeleteButton";
import { formatDate } from "@/lib/formatDate";

type CheckIn = {
  id: string;
  checkInType: string;
  date: Date;
  outcomeNote: string;
  sentimentScore: number | null;
};

const TYPE_LABELS: Record<string, string> = {
  POST_ASSESSMENT_30_DAY: "30-day post-Assessment",
  POST_SPRINT_30_DAY: "30-day post-Sprint",
  TOOL_ADVISORY_60_DAY: "60-day Tool Advisory",
  ANNUAL_POLICY_REVIEW: "Annual Policy review",
  QUARTERLY_REVIEW: "Quarterly Review",
};

export function CheckInSection({ clientId, checkIns }: { clientId: string; checkIns: CheckIn[] }) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-3">
      {checkIns.map((c) => (
        <div key={c.id} className="border border-neutral-200 rounded-xl p-4 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                {TYPE_LABELS[c.checkInType]}
              </span>
              <span className="text-xs text-neutral-400">{formatDate(c.date)}</span>
              {c.sentimentScore !== null && <span className="text-xs text-neutral-400">Sentiment {c.sentimentScore}/10</span>}
            </div>
            <p className="text-sm text-neutral-700 mt-1">{c.outcomeNote}</p>
          </div>
          <DeleteButton
            action={deleteCheckIn.bind(null, c.id, clientId)}
            confirmMessage="Delete this check-in? This can't be undone."
          />
        </div>
      ))}

      {adding ? (
        <form
          ref={formRef}
          action={(formData) => {
            startTransition(async () => {
              await addCheckIn(clientId, formData);
              formRef.current?.reset();
              setAdding(false);
            });
          }}
          className="border border-indigo-200 bg-indigo-50/30 rounded-xl p-4 space-y-3"
        >
          <div className="grid grid-cols-2 gap-2">
            <label>
              <span className="block text-xs font-medium text-neutral-600 mb-1">Type</span>
              <select name="checkInType" className="w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-xs">
                {Object.entries(TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="block text-xs font-medium text-neutral-600 mb-1">Sentiment (0–10)</span>
              <input type="number" name="sentimentScore" min={0} max={10} className="w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-xs" />
            </label>
          </div>
          <label className="block">
            <span className="block text-xs font-medium text-neutral-600 mb-1">Outcome note</span>
            <textarea name="outcomeNote" required rows={2} className="w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-xs" />
          </label>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-60"
            >
              {isPending ? "Saving…" : "Log check-in"}
            </button>
            <button type="button" onClick={() => setAdding(false)} className="text-xs font-medium text-neutral-500 hover:text-neutral-800">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setAdding(true)} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
          + Log check-in
        </button>
      )}
    </div>
  );
}
