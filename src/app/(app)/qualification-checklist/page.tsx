import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  HOW_TO_SCORE,
  SECTION_META,
  SECTION_A,
  SECTION_B,
  SECTION_C,
  SECTION_D,
  SECTION_E,
  F4_GATE,
  F_DISQUALIFIERS,
  type ChecklistItem,
} from "@/lib/qualificationChecklist";
import {
  qualificationTotal,
  workflowFloor,
  qualificationOutcome,
  QUALIFICATION_OUTCOME_LABELS,
  type ItemScores,
} from "@/lib/pipeline";

const OUTCOME_BADGE: Record<string, string> = {
  QUALIFIED: "bg-emerald-50 text-emerald-700",
  NURTURE: "bg-amber-50 text-amber-700",
  NOT_QUALIFIED: "bg-red-50 text-red-700",
};

export default async function QualificationChecklistPage() {
  const qualifications = await prisma.leadQualification.findMany({
    orderBy: { dateRun: "desc" },
    include: { client: { select: { id: true, name: true } } },
  });

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Lead Qualification Checklist</h1>
          <p className="text-sm text-neutral-500 mt-1">
            SOP 1, step 1 — the gate that runs on every inbound lead before a discovery call is scheduled. Ten to
            fifteen minutes, run by the Relationship Lead, on what&apos;s visible before speaking to anyone.
          </p>
        </div>
        <Link
          href="/qualification-checklist/examples"
          className="shrink-0 text-xs font-medium px-3 py-2 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
        >
          Examples →
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 mb-6">
        <h2 className="text-sm font-semibold text-neutral-900 mb-2">Layer 1 — the universal checklist</h2>
        <p className="text-sm text-neutral-700">
          Six sections, A through F. Every item is either a hard gate or a scored signal. Hard gates are pass/fail
          and a single failure ends qualification. Scored signals are graded 0, 1 or 2 and accumulate into a total
          that separates Qualified from Nurture.
        </p>
        <p className="text-sm text-neutral-700 mt-2">
          This checklist is vertical-agnostic. It tests universal criteria that apply to any business, and it is
          tailored to a specific industry at the moment of use through a vertical overlay drawn from the relevant
          vertical pack. It does not contain a list of permitted industries, and it must never acquire one.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 mb-6">
        <h2 className="text-sm font-semibold text-neutral-900 mb-3">How to score</h2>
        <div className="space-y-3">
          {HOW_TO_SCORE.map((h) => (
            <div key={h.type} className="text-sm">
              <p className="font-medium text-neutral-900">
                {h.type} <span className="text-xs font-normal text-neutral-400">({h.marked})</span>
              </p>
              <p className="text-neutral-600 text-xs mt-0.5">{h.behavior}</p>
              <p className="text-neutral-500 text-xs mt-0.5 italic">{h.effect}</p>
            </div>
          ))}
        </div>
      </div>

      {(
        [
          ["A", SECTION_A],
          ["B", SECTION_B],
          ["C", SECTION_C],
          ["D", SECTION_D],
          ["E", SECTION_E],
        ] as [keyof typeof SECTION_META, ChecklistItem[]][]
      ).map(([letter, items]) => {
        const meta = SECTION_META[letter];
        return (
          <div key={letter} className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 mb-6">
            <h2 className="text-sm font-semibold text-neutral-900">
              {letter} · {meta.title}
            </h2>
            <p className="text-xs text-neutral-500 mt-1 mb-4">{meta.description}</p>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.ref} className="border-t border-neutral-100 pt-3 first:border-t-0 first:pt-0">
                  <p className="text-sm text-neutral-800">
                    <span className="font-medium">{item.ref} · {item.type}</span> — {item.question}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">{item.rubric}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2.5">
              <p className="text-xs font-semibold text-sky-900">{meta.overlaySlot}</p>
              <p className="text-xs text-sky-800 mt-1">{meta.overlayNote}</p>
            </div>
          </div>
        );
      })}

      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 mb-6">
        <h2 className="text-sm font-semibold text-neutral-900">F4 · {F4_GATE.question}</h2>
        <p className="text-xs text-neutral-500 mt-1">{F4_GATE.rubric}</p>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 mb-6">
        <h2 className="text-sm font-semibold text-neutral-900 mb-1">F · Hard disqualifiers</h2>
        <p className="text-xs text-neutral-500 mb-3">
          The consolidated list of conditions that end qualification regardless of anything above — the gates from
          Sections B through E gathered in one place, so a partner can scan them in thirty seconds before scoring
          anything.
        </p>
        <div className="space-y-2">
          {F_DISQUALIFIERS.map((f) => (
            <p key={f.ref} className="text-sm text-neutral-700">
              <span className="font-medium text-neutral-900">{f.ref} — {f.name}</span> ({f.gate}). {f.meaning}{" "}
              <span className="text-neutral-500">{f.whatToDo}</span>
            </p>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-neutral-900 mb-3">Every qualification run so far</h2>
        {qualifications.length === 0 && <p className="text-sm text-neutral-400">None yet.</p>}
        <div className="divide-y divide-neutral-100">
          {qualifications.map((q) => {
            const itemScores = (q.itemScores ?? {}) as ItemScores;
            const gates = { gateB1: q.gateB1, gateC1: q.gateC1, gateD1: q.gateD1, gateE1: q.gateE1, gateF4: q.gateF4 };
            const outcome = qualificationOutcome(gates, itemScores, q.overrideApplied);
            const total = qualificationTotal(itemScores);
            const floor = workflowFloor(itemScores);
            return (
              <div key={q.id} className="flex items-center justify-between gap-3 py-3 -mx-2 px-2 rounded-lg hover:bg-neutral-50">
                <Link href={`/pipeline/${q.client.id}`} className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900">{q.prospectName}</p>
                  <p className="text-xs text-neutral-500">
                    Total {total}/30 · Workflow floor {floor}/14 · Run by {q.runBy}
                  </p>
                </Link>
                <a
                  href={`/pipeline/${q.client.id}/qualification/${q.id}/download`}
                  className="shrink-0 text-xs font-medium text-neutral-500 hover:text-neutral-800"
                >
                  ⬇ PDF
                </a>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${OUTCOME_BADGE[outcome]}`}>
                  {QUALIFICATION_OUTCOME_LABELS[outcome]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
