import Link from "next/link";
import { WORKED_EXAMPLES } from "@/lib/qualificationChecklist";

export default function QualificationExamplesPage() {
  return (
    <div className="p-8 max-w-4xl">
      <Link href="/qualification-checklist" className="text-xs text-neutral-400 hover:text-neutral-600">
        ← Lead Qualification Checklist
      </Link>
      <div className="mt-2 mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Examples</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Two worked examples run on the same instrument — the comparison is the argument for the whole design.
        </p>
      </div>

      {WORKED_EXAMPLES.map((ex) => (
        <div key={ex.title} className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 mb-6">
          <h2 className="text-sm font-semibold text-neutral-900">{ex.title}</h2>
          <p className="text-xs text-neutral-500 mt-1 mb-4">{ex.description}</p>

          <div className="border border-neutral-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-neutral-50 text-neutral-500 uppercase tracking-wide">
                <tr>
                  <th className="text-left px-3 py-2 font-medium w-24">Ref</th>
                  <th className="text-left px-3 py-2 font-medium">What the material shows and how it scores</th>
                  <th className="text-right px-3 py-2 font-medium w-16">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {ex.rows.map((r) => (
                  <tr key={r.ref}>
                    <td className="px-3 py-2 align-top font-medium text-neutral-800 whitespace-nowrap">{r.ref}</td>
                    <td className="px-3 py-2 align-top text-neutral-600">{r.finding}</td>
                    <td className="px-3 py-2 align-top text-right font-medium text-neutral-900">{r.score}</td>
                  </tr>
                ))}
                <tr className="bg-neutral-50">
                  <td colSpan={2} className="px-3 py-2 font-medium text-neutral-800">
                    TOTALS — {ex.totals}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-neutral-900">{ex.totalScore}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2.5">
            <p className="text-xs font-semibold text-emerald-900">{ex.outcomeTitle}</p>
            <p className="text-xs text-emerald-800 mt-1">{ex.outcomeBody}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
