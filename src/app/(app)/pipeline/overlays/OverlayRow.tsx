"use client";

import { useState, useTransition } from "react";
import { updateVerticalOverlay, deleteVerticalOverlay } from "@/lib/pipelineActions";
import { DeleteButton } from "@/components/DeleteButton";
import { OverlayFields } from "./OverlayFields";
import { formatDate } from "@/lib/formatDate";

type Overlay = {
  id: string;
  vertical: string;
  status: string;
  slotASizeBand: string | null;
  slotBTypicalWorkflows: string | null;
  slotCToolLandscape: string | null;
  slotDBuyingStructure: string | null;
  slotERegulatoryContext: string | null;
  extraDisqualifiers: string | null;
  sourcePack: string | null;
  lastReviewed: Date | null;
};

const STATUS_STYLES: Record<string, string> = {
  FULL_PACK: "bg-emerald-50 text-emerald-700",
  LIGHTWEIGHT: "bg-sky-50 text-sky-700",
  DRAFT: "bg-neutral-100 text-neutral-500",
};

export function OverlayRow({ overlay, reviewStale }: { overlay: Overlay; reviewStale: boolean }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <form
        action={(formData) => {
          startTransition(async () => {
            await updateVerticalOverlay(overlay.id, formData);
            setEditing(false);
          });
        }}
        className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-5"
      >
        <OverlayFields defaults={overlay} />
        <div className="mt-3 flex items-center gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Save changes"}
          </button>
          <button type="button" onClick={() => setEditing(false)} className="text-xs font-medium text-neutral-500 hover:text-neutral-800">
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <details className="bg-white rounded-2xl border border-neutral-100 shadow-sm px-5 py-4">
      <summary className="cursor-pointer flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-900">{overlay.vertical}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[overlay.status]}`}>
            {overlay.status.replace("_", " ")}
          </span>
          {reviewStale && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Review due</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setEditing(true);
            }}
            className="text-xs font-medium text-neutral-500 hover:text-neutral-800"
          >
            Edit
          </button>
          <DeleteButton
            action={deleteVerticalOverlay.bind(null, overlay.id)}
            confirmMessage={`Delete the "${overlay.vertical}" overlay? This can't be undone.`}
          />
        </div>
      </summary>
      <div className="mt-3 space-y-2 text-sm text-neutral-700">
        {overlay.slotASizeBand && <p><span className="font-medium">Slot A — size band:</span> {overlay.slotASizeBand}</p>}
        {overlay.slotBTypicalWorkflows && <p><span className="font-medium">Slot B — typical workflows:</span> {overlay.slotBTypicalWorkflows}</p>}
        {overlay.slotCToolLandscape && <p><span className="font-medium">Slot C — tool landscape:</span> {overlay.slotCToolLandscape}</p>}
        {overlay.slotDBuyingStructure && <p><span className="font-medium">Slot D — buying structure:</span> {overlay.slotDBuyingStructure}</p>}
        {overlay.slotERegulatoryContext && <p><span className="font-medium">Slot E — regulatory context:</span> {overlay.slotERegulatoryContext}</p>}
        {overlay.extraDisqualifiers && <p><span className="font-medium">Extra disqualifiers:</span> {overlay.extraDisqualifiers}</p>}
        {overlay.sourcePack && <p className="text-xs text-neutral-400">Source: {overlay.sourcePack}</p>}
        {overlay.lastReviewed && (
          <p className="text-xs text-neutral-400">Last reviewed: {formatDate(overlay.lastReviewed)}</p>
        )}
      </div>
    </details>
  );
}
