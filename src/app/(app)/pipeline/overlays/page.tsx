import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { addVerticalOverlay } from "@/lib/pipelineActions";
import { OverlayRow } from "./OverlayRow";
import { OverlayFields } from "./OverlayFields";

export default async function OverlaysPage() {
  const overlays = await prisma.verticalOverlay.findMany({ orderBy: { vertical: "asc" } });

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/pipeline" className="text-xs text-neutral-400 hover:text-neutral-600">
        ← Pipeline
      </Link>
      <div className="mt-2 mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Vertical Overlays</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Industry-specific reference cards pulled in at qualification and discovery time — no client data, never
          client-facing. No permitted-industry list: any vertical can be qualified; these are just the ones with
          depth today.
        </p>
      </div>

      <details className="mb-6 bg-white rounded-2xl border border-neutral-100 shadow-sm open:pb-5">
        <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-neutral-900">+ New overlay</summary>
        <form action={addVerticalOverlay} className="px-5">
          <OverlayFields />
          <button
            type="submit"
            className="mt-3 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 transition"
          >
            Create overlay
          </button>
        </form>
      </details>

      <div className="space-y-3">
        {overlays.length === 0 && (
          <p className="text-sm text-neutral-400 bg-white rounded-2xl border border-neutral-100 shadow-sm px-5 py-6">
            No overlays yet.
          </p>
        )}
        {overlays.map((o) => (
          <OverlayRow
            key={o.id}
            overlay={o}
            reviewStale={!!o.lastReviewed && o.lastReviewed < new Date(Date.now() - 1000 * 60 * 60 * 24 * 182)}
          />
        ))}
      </div>
    </div>
  );
}

