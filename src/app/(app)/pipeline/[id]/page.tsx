import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { VERTICAL_LABELS } from "@/lib/verticals";
import { PipelineStatusSelect } from "./PipelineStatusSelect";
import { LeadIdentityForm } from "./LeadIdentityForm";
import { QualificationSection } from "./QualificationSection";
import { DiscoveryCallSection } from "./DiscoveryCallSection";
import { CheckInSection } from "./CheckInSection";
import { ConvertForm } from "./ConvertForm";
import { DeleteButton } from "@/components/DeleteButton";
import { deleteLead } from "@/lib/pipelineActions";
import { formatDate, formatNumber } from "@/lib/formatDate";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await prisma.robusClient.findUnique({
    where: { id },
    include: {
      qualifications: { orderBy: { dateRun: "desc" } },
      discoveryCalls: { orderBy: { callDate: "desc" } },
      checkIns: { orderBy: { date: "desc" } },
    },
  });
  if (!client) notFound();

  const overlays = await prisma.verticalOverlay.findMany({ orderBy: { vertical: "asc" } });

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/pipeline" className="text-xs text-neutral-400 hover:text-neutral-600">
        ← All pipeline
      </Link>
      <div className="mt-2 mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">{client.name}</h1>
          <p className="text-sm text-neutral-500 mt-1">{VERTICAL_LABELS[client.vertical]}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <PipelineStatusSelect clientId={client.id} status={client.pipelineStatus} />
          <DeleteButton
            action={deleteLead.bind(null, client.id)}
            confirmMessage={`Delete "${client.name}" and everything on it — qualifications, discovery calls, check-ins, workflows, and assessment notes? This can't be undone.`}
            redirectTo="/pipeline"
            className="px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100"
          />
        </div>
      </div>

      <Section title="Identity">
        <LeadIdentityForm
          clientId={client.id}
          client={{
            contactName: client.contactName,
            contactEmail: client.contactEmail,
            contactPhone: client.contactPhone,
            source: client.source,
            referredBy: client.referredBy,
            relationshipLead: client.relationshipLead,
            buildLead: client.buildLead,
            serviceLine: client.serviceLine,
          }}
        />
      </Section>

      <Section title="Lead Qualification">
        <QualificationSection
          clientId={client.id}
          defaultProspectName={client.name}
          qualifications={client.qualifications.map((q) => ({
            ...q,
            itemScores: (q.itemScores ?? {}) as Record<string, number>,
            itemNotes: (q.itemNotes ?? {}) as Record<string, string>,
          }))}
          overlays={overlays.map((o) => ({ id: o.id, vertical: o.vertical, status: o.status }))}
        />
      </Section>

      <Section title="Discovery Calls">
        <DiscoveryCallSection
          clientId={client.id}
          defaultProspectName={client.name}
          calls={client.discoveryCalls}
          qualifications={client.qualifications.map((q) => ({ id: q.id, prospectName: q.prospectName, dateRun: q.dateRun }))}
        />
      </Section>

      <Section title="Check-ins">
        <CheckInSection clientId={client.id} checkIns={client.checkIns} />
      </Section>

      <Section title="Conversion">
        <ConvertForm clientId={client.id} alreadyConverted={client.pipelineStatus === "CONVERTED"} />
        {client.pipelineStatus === "CONVERTED" && (
          <div className="mt-3 text-sm text-neutral-600 space-y-1">
            {client.engagementValue != null && <p>Engagement value: ${formatNumber(client.engagementValue)}</p>}
            {client.retainerValue != null && <p>Retainer value: ${formatNumber(client.retainerValue)}/mo</p>}
            {client.engagementStartDate && <p>Start date: {formatDate(client.engagementStartDate)}</p>}
            {client.clientWorkspaceUrl && (
              <p>
                Workspace:{" "}
                <a href={client.clientWorkspaceUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                  {client.clientWorkspaceUrl}
                </a>
              </p>
            )}
            <Link href={`/clients/${client.id}`} className="inline-block text-indigo-600 hover:underline">
              Open in Clients →
            </Link>
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
