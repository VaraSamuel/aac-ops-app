"use client";

import { useState, useTransition } from "react";
import { convertLead } from "@/lib/pipelineActions";

const inputClass = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm";

export function ConvertForm({ clientId, alreadyConverted }: { clientId: string; alreadyConverted: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  if (alreadyConverted) {
    return <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800">Converted</span>;
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-medium px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
      >
        Convert to client →
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await convertLead(clientId, formData);
          setOpen(false);
        });
      }}
      className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-4 space-y-3 max-w-md"
    >
      <p className="text-sm font-medium text-emerald-900">Convert this lead to a client</p>
      <div className="grid grid-cols-2 gap-2">
        <label>
          <span className="block text-xs font-medium text-neutral-600 mb-1">Engagement value ($, one-time)</span>
          <input type="number" step="0.01" name="engagementValue" className={inputClass} />
        </label>
        <label>
          <span className="block text-xs font-medium text-neutral-600 mb-1">Retainer value ($/mo)</span>
          <input type="number" step="0.01" name="retainerValue" className={inputClass} />
        </label>
        <label>
          <span className="block text-xs font-medium text-neutral-600 mb-1">SOW signed date</span>
          <input type="date" name="sowSignedDate" className={inputClass} />
        </label>
        <label>
          <span className="block text-xs font-medium text-neutral-600 mb-1">Engagement start date</span>
          <input type="date" name="engagementStartDate" className={inputClass} />
        </label>
      </div>
      <label className="block">
        <span className="block text-xs font-medium text-neutral-600 mb-1">SOW link</span>
        <input name="sowLink" placeholder="https://…" className={inputClass} />
      </label>
      <label className="block">
        <span className="block text-xs font-medium text-neutral-600 mb-1">Client workspace URL</span>
        <input name="clientWorkspaceUrl" placeholder="https://…" className={inputClass} />
      </label>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {isPending ? "Converting…" : "Confirm conversion"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs font-medium text-neutral-500 hover:text-neutral-800">
          Cancel
        </button>
      </div>
    </form>
  );
}
