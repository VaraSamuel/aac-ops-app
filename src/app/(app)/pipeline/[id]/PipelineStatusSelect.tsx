"use client";

import { useTransition } from "react";
import { updatePipelineStatus } from "@/lib/pipelineActions";

const STATUSES = [
  "INBOUND",
  "QUALIFIED",
  "NURTURE",
  "NOT_QUALIFIED",
  "DISCOVERY_HELD",
  "PROPOSAL_SENT",
  "CONVERTED",
  "DEFERRED",
  "DECLINED",
] as const;

const STATUS_LABELS: Record<string, string> = {
  INBOUND: "Inbound",
  QUALIFIED: "Qualified",
  NURTURE: "Nurture",
  NOT_QUALIFIED: "Not qualified",
  DISCOVERY_HELD: "Discovery held",
  PROPOSAL_SENT: "Proposal sent",
  CONVERTED: "Converted",
  DEFERRED: "Deferred",
  DECLINED: "Declined",
};

export function PipelineStatusSelect({ clientId, status }: { clientId: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <select
      defaultValue={status}
      disabled={isPending}
      onChange={(e) => {
        const value = e.target.value as (typeof STATUSES)[number];
        startTransition(async () => await updatePipelineStatus(clientId, value));
      }}
      className="text-sm font-medium rounded-lg border border-neutral-300 px-3 py-2"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
