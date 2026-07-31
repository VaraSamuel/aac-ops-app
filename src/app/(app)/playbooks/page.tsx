import { prisma } from "@/lib/prisma";
import { CAPABILITY_LABELS, type CapabilityTag } from "@/lib/capabilities";

export default async function PlaybooksPage() {
  const playbooks = await prisma.playbook.findMany({ orderBy: { estimatedHoursWithout: "desc" } });

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Delivery Playbooks</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Standard implementation guides per capability — Zach doesn&apos;t rebuild a Sprint from scratch each time.
        </p>
      </div>

      <div className="space-y-4">
        {playbooks.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <p className="text-sm font-semibold text-neutral-900">{p.title}</p>
                <p className="text-xs text-neutral-500">{CAPABILITY_LABELS[p.capabilityTag as CapabilityTag]}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium text-neutral-900">
                  {p.estimatedHoursWithout}h → {p.estimatedHoursWith}h
                </p>
                <p className="text-xs text-neutral-500">per engagement</p>
              </div>
            </div>
            <p className="text-xs text-neutral-500 mb-3">Common tools: {p.commonTools}</p>
            <ol className="list-decimal list-inside text-sm text-neutral-700 space-y-1">
              {p.steps.split("\n").map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
