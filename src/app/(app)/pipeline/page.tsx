import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createLead } from "@/lib/pipelineActions";
import { VERTICAL_LABELS } from "@/lib/verticals";

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

const STATUS_STYLES: Record<string, string> = {
  INBOUND: "bg-neutral-100 text-neutral-600",
  QUALIFIED: "bg-emerald-50 text-emerald-700",
  NURTURE: "bg-amber-50 text-amber-700",
  NOT_QUALIFIED: "bg-red-50 text-red-700",
  DISCOVERY_HELD: "bg-sky-50 text-sky-700",
  PROPOSAL_SENT: "bg-indigo-50 text-indigo-700",
  CONVERTED: "bg-emerald-100 text-emerald-800",
  DEFERRED: "bg-neutral-100 text-neutral-500",
  DECLINED: "bg-neutral-100 text-neutral-400",
};

const FUNNEL_ORDER = [
  "INBOUND",
  "QUALIFIED",
  "NURTURE",
  "DISCOVERY_HELD",
  "PROPOSAL_SENT",
  "CONVERTED",
  "NOT_QUALIFIED",
  "DEFERRED",
  "DECLINED",
] as const;

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params.status ?? "";

  const leads = await prisma.robusClient.findMany({
    where: statusFilter ? { pipelineStatus: statusFilter as never } : {},
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { qualifications: true, discoveryCalls: true } } },
  });

  const counts: Record<string, number> = {};
  for (const s of FUNNEL_ORDER) counts[s] = 0;
  const allLeads = await prisma.robusClient.groupBy({ by: ["pipelineStatus"], _count: true });
  for (const row of allLeads) counts[row.pipelineStatus] = row._count;

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Pipeline</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Every lead from inbound to converted — qualification, discovery calls, and vertical overlays.
          </p>
        </div>
        <Link
          href="/pipeline/overlays"
          className="shrink-0 text-sm font-medium px-4 py-2 rounded-lg border border-neutral-200 hover:bg-neutral-50"
        >
          Vertical overlays →
        </Link>
      </div>

      <details className="mb-6 bg-white rounded-2xl border border-neutral-100 shadow-sm open:pb-5">
        <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-neutral-900">+ New lead</summary>
        <form action={createLead} className="px-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input name="name" required placeholder="Business name" className="rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
          <select name="vertical" required defaultValue="" className="rounded-lg border border-neutral-200 px-3 py-2 text-sm">
            <option value="" disabled>
              Select vertical…
            </option>
            {Object.entries(VERTICAL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select name="source" required defaultValue="" className="rounded-lg border border-neutral-200 px-3 py-2 text-sm">
            <option value="" disabled>
              Source…
            </option>
            <option value="REFERRAL">Referral</option>
            <option value="CHAMBER_OR_ASSOCIATION">Chamber or association</option>
            <option value="LINKEDIN">LinkedIn</option>
            <option value="EMAIL_INBOUND">Email inbound</option>
            <option value="PRIOR_CLIENT">Prior client</option>
            <option value="WEBSITE">Website</option>
            <option value="OTHER">Other</option>
          </select>
          <input name="referredBy" placeholder="Referred by (if applicable)" className="rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
          <button
            type="submit"
            className="sm:col-span-2 rounded-lg bg-indigo-600 text-white text-sm font-medium py-2 hover:bg-indigo-700 transition"
          >
            Log lead
          </button>
        </form>
      </details>

      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href="/pipeline"
          className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
            !statusFilter ? "bg-neutral-900 text-white border-neutral-900" : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
          }`}
        >
          All ({Object.values(counts).reduce((a, b) => a + b, 0)})
        </Link>
        {FUNNEL_ORDER.map((s) => (
          <Link
            key={s}
            href={`/pipeline?status=${s}`}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
              statusFilter === s ? "bg-neutral-900 text-white border-neutral-900" : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            {STATUS_LABELS[s]} ({counts[s] ?? 0})
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm divide-y divide-neutral-100">
        {leads.length === 0 && <p className="px-5 py-6 text-sm text-neutral-400">No leads match this filter.</p>}
        {leads.map((l) => (
          <Link key={l.id} href={`/pipeline/${l.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-neutral-50 transition">
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-900">{l.name}</p>
              <p className="text-xs text-neutral-500">
                {VERTICAL_LABELS[l.vertical]}
                {l._count.qualifications > 0 && ` · ${l._count.qualifications} qualification${l._count.qualifications !== 1 ? "s" : ""}`}
                {l._count.discoveryCalls > 0 && ` · ${l._count.discoveryCalls} discovery call${l._count.discoveryCalls !== 1 ? "s" : ""}`}
              </p>
            </div>
            <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[l.pipelineStatus]}`}>
              {STATUS_LABELS[l.pipelineStatus]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
