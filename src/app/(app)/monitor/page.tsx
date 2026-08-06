import { prisma } from "@/lib/prisma";
import { getWorkspaceStats, getSiteStats } from "@/lib/crossDb";

const PIPELINE_ORDER = [
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

const PIPELINE_LABELS: Record<string, string> = {
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

export default async function MonitorPage() {
  const [pipelineByStatus, clientCount, workflowCount, playbookCount, workspaceStats, siteStats] = await Promise.all([
    prisma.robusClient.groupBy({ by: ["pipelineStatus"], _count: { _all: true } }),
    prisma.robusClient.count(),
    prisma.workflow.count(),
    prisma.playbook.count(),
    getWorkspaceStats(),
    getSiteStats(),
  ]);

  const pipelineCounts: Record<string, number> = {};
  for (const row of pipelineByStatus) pipelineCounts[row.pipelineStatus] = row._count._all;

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Monitor</h1>
        <p className="text-sm text-neutral-500 mt-1">
          A read-only overview of all three AI Analytics Console databases — ops, workspace, and site. Same login as
          everything else here; there is no separate access list.
        </p>
      </div>

      <Section title="AAC Ops — this database">
        <div className="grid grid-cols-3 gap-4 mb-5">
          <Stat label="Total leads / clients" value={clientCount} />
          <Stat label="Delivery workflows tracked" value={workflowCount} />
          <Stat label="Playbooks" value={playbookCount} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">Pipeline funnel</p>
        <div className="grid grid-cols-3 gap-2">
          {PIPELINE_ORDER.map((status) => (
            <div key={status} className="border border-neutral-200 rounded-lg px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-neutral-600">{PIPELINE_LABELS[status]}</span>
              <span className="text-sm font-semibold text-neutral-900">{pipelineCounts[status] ?? 0}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="AAC Workspace">
        {!workspaceStats.available ? (
          <NotConfigured envVar="WORKSPACE_DATABASE_URL" />
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <Stat label="Active engagements" value={workspaceStats.activeEngagements} />
            <Stat label="Archived engagements" value={workspaceStats.archivedEngagements} />
            <Stat label="Interviews logged" value={workspaceStats.interviews} />
            <Stat label="Workflows named (A10)" value={workspaceStats.workflowsNamed} />
            <Stat
              label="Interviews below 5-workflow standard"
              value={workspaceStats.workflowsBelowStandard}
              warn={workspaceStats.workflowsBelowStandard > 0}
            />
            <Stat label="Tracker steps open" value={workspaceStats.trackerStepsOpen} />
          </div>
        )}
      </Section>

      <Section title="AAC Site">
        {!siteStats.available ? (
          <NotConfigured envVar="SITE_DATABASE_URL" />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Approved client accounts" value={siteStats.approvedAccounts} />
            <Stat label="Pending signups" value={siteStats.pendingAccounts} warn={siteStats.pendingAccounts > 0} />
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-neutral-900 mb-3">{title}</h2>
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">{children}</div>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="border border-neutral-200 rounded-xl px-4 py-3">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${warn ? "text-amber-600" : "text-neutral-900"}`}>{value}</p>
    </div>
  );
}

function NotConfigured({ envVar }: { envVar: string }) {
  return (
    <p className="text-xs text-neutral-400">
      Not connected — set <code className="bg-neutral-100 px-1 py-0.5 rounded">{envVar}</code> on this service to show
      these numbers.
    </p>
  );
}
