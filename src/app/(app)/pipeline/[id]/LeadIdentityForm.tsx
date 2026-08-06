"use client";

import { useState, useTransition } from "react";
import { updateLeadIdentity } from "@/lib/pipelineActions";

type Client = {
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  source: string | null;
  referredBy: string | null;
  relationshipLead: string | null;
  buildLead: string | null;
  serviceLine: string | null;
};

const inputClass = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm";

export function LeadIdentityForm({ clientId, client }: { clientId: string; client: Client }) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await updateLeadIdentity(clientId, formData);
          setSaved(true);
          setTimeout(() => setSaved(false), 1500);
        });
      }}
      className="grid grid-cols-2 gap-3"
    >
      <label>
        <span className="block text-xs font-medium text-neutral-600 mb-1">Contact name</span>
        <input name="contactName" defaultValue={client.contactName ?? ""} className={inputClass} />
      </label>
      <label>
        <span className="block text-xs font-medium text-neutral-600 mb-1">Contact email</span>
        <input type="email" name="contactEmail" defaultValue={client.contactEmail ?? ""} className={inputClass} />
      </label>
      <label>
        <span className="block text-xs font-medium text-neutral-600 mb-1">Contact phone</span>
        <input name="contactPhone" defaultValue={client.contactPhone ?? ""} className={inputClass} />
      </label>
      <label>
        <span className="block text-xs font-medium text-neutral-600 mb-1">Source</span>
        <select name="source" defaultValue={client.source ?? ""} className={inputClass}>
          <option value="">—</option>
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
        <span className="block text-xs font-medium text-neutral-600 mb-1">Referred by</span>
        <input name="referredBy" defaultValue={client.referredBy ?? ""} className={inputClass} />
      </label>
      <label>
        <span className="block text-xs font-medium text-neutral-600 mb-1">Service line</span>
        <select name="serviceLine" defaultValue={client.serviceLine ?? ""} className={inputClass}>
          <option value="">—</option>
          <option value="AI_READINESS_ASSESSMENT">AI Readiness Assessment</option>
          <option value="AUTOMATION_SPRINT">Automation Sprint</option>
          <option value="TOOL_SELECTION_ADVISORY">Tool Selection & Advisory</option>
          <option value="AI_POLICY_GOVERNANCE_KIT">AI Policy & Governance Kit</option>
          <option value="QUARTERLY_REVIEW">Quarterly Review</option>
        </select>
      </label>
      <label>
        <span className="block text-xs font-medium text-neutral-600 mb-1">Relationship Lead</span>
        <input name="relationshipLead" defaultValue={client.relationshipLead ?? ""} className={inputClass} />
      </label>
      <label>
        <span className="block text-xs font-medium text-neutral-600 mb-1">Build Lead (internal)</span>
        <input name="buildLead" defaultValue={client.buildLead ?? ""} className={inputClass} />
      </label>
      <div className="col-span-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="text-sm font-medium px-4 py-2 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
        {saved && <span className="text-xs text-emerald-600">✓ Saved</span>}
      </div>
    </form>
  );
}
