"use client";

import { useTransition } from "react";
import { updateClientStage } from "@/lib/actions";

type Stage = "ASSESSMENT" | "SPRINT" | "RETAINER" | "COMPLETE";

export function StageSelector({ clientId, stage }: { clientId: string; stage: Stage }) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      name="stage"
      defaultValue={stage}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.value as Stage;
        startTransition(async () => {
          await updateClientStage(clientId, next);
        });
      }}
      className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm bg-white disabled:opacity-60"
    >
      <option value="ASSESSMENT">Assessment</option>
      <option value="SPRINT">Sprint</option>
      <option value="RETAINER">Retainer</option>
      <option value="COMPLETE">Complete</option>
    </select>
  );
}
