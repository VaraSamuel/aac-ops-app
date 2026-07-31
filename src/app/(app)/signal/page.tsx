import { prisma } from "@/lib/prisma";
import { CAPABILITY_LABELS, type CapabilityTag } from "@/lib/capabilities";
import { VERTICAL_LABELS } from "@/lib/verticals";

const GATE_THRESHOLD = 0.8; // AI Analytics Console's real default rule: ~80% of in-vertical clients
const MIN_SAMPLE = 3; // real policy uses a minimum sample of 10; lowered here for demo-scale seed data

function severity(w: { frequencyScore: number; timeBurdenScore: number; errorRiskScore: number; automationReadinessScore: number }) {
  return (w.frequencyScore + w.timeBurdenScore + w.errorRiskScore + w.automationReadinessScore) / 4;
}

export default async function SignalPage() {
  const clients = await prisma.robusClient.findMany({ include: { workflows: true } });

  const clientsByVertical = new Map<string, typeof clients>();
  for (const c of clients) {
    const list = clientsByVertical.get(c.vertical) ?? [];
    list.push(c);
    clientsByVertical.set(c.vertical, list);
  }

  type Row = {
    vertical: string;
    capabilityTag: CapabilityTag;
    flaggedClients: number;
    totalClients: number;
    pct: number;
    gateCleared: boolean;
  };

  const rows: Row[] = [];

  for (const [vertical, verticalClients] of clientsByVertical.entries()) {
    // Only count clients who've actually been assessed (≥1 workflow on record) —
    // otherwise a brand-new, not-yet-assessed client silently drags down every
    // percentage in their vertical the moment they're created.
    const assessedClients = verticalClients.filter((c) => c.workflows.length > 0);
    const totalClients = assessedClients.length;
    const flaggedByTag = new Map<string, Set<string>>();

    for (const c of assessedClients) {
      for (const w of c.workflows) {
        if (severity(w) >= 3) {
          const set = flaggedByTag.get(w.capabilityTag) ?? new Set<string>();
          set.add(c.id);
          flaggedByTag.set(w.capabilityTag, set);
        }
      }
    }

    for (const [tag, clientSet] of flaggedByTag.entries()) {
      const pct = clientSet.size / totalClients;
      rows.push({
        vertical,
        capabilityTag: tag as CapabilityTag,
        flaggedClients: clientSet.size,
        totalClients,
        pct,
        gateCleared: pct >= GATE_THRESHOLD && totalClients >= MIN_SAMPLE,
      });
    }
  }

  rows.sort((a, b) => b.pct - a.pct);

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Signal Engine</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Tracks demand signal across every client, by vertical — the first of AI Analytics Console&apos;s six product-readiness gates.
        </p>
      </div>

      <div className="mb-6 bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 text-sm text-indigo-900">
        <strong>Gate 1 of 6 (demand signal):</strong> a capability is flagged as product-ready when ≥{Math.round(GATE_THRESHOLD * 100)}% of
        <em> assessed</em> clients in a vertical (minimum sample of {MIN_SAMPLE} shown here — the real policy uses 10) report it at
        severity ≥ 3. Clients with no workflows on record yet aren&apos;t counted in the denominator, so adding a new,
        not-yet-assessed client won&apos;t artificially move these percentages. Clearing this gate does not mean build —
        five more gates (market size, willingness-to-pay, build-cost payback, defensibility, delivery fit) still apply
        per AI Analytics Console&apos;s Phase 2 framework.
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm divide-y divide-neutral-100">
        {rows.length === 0 && (
          <p className="px-5 py-6 text-sm text-neutral-400">
            No signal yet — add clients and run the Assessment Copilot to start building the picture.
          </p>
        )}
        {rows.map((r) => (
          <div key={`${r.vertical}-${r.capabilityTag}`} className="px-5 py-4">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div>
                <p className="text-sm font-medium text-neutral-900">{CAPABILITY_LABELS[r.capabilityTag]}</p>
                <p className="text-xs text-neutral-500">{VERTICAL_LABELS[r.vertical] ?? r.vertical}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-neutral-900">
                  {r.flaggedClients} / {r.totalClients} clients
                </p>
                <p className="text-xs text-neutral-500">{Math.round(r.pct * 100)}%</p>
              </div>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full ${r.gateCleared ? "bg-emerald-500" : "bg-indigo-400"}`}
                style={{ width: `${Math.min(100, Math.round(r.pct * 100))}%` }}
              />
            </div>
            {r.gateCleared && (
              <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                Gate 1 cleared — ready for gates 2–6 review
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
