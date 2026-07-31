import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/actions";
import { redirect } from "next/navigation";
import { VERTICAL_LABELS } from "@/lib/verticals";

const STAGE_STYLES: Record<string, string> = {
  ASSESSMENT: "bg-sky-50 text-sky-700",
  SPRINT: "bg-amber-50 text-amber-700",
  RETAINER: "bg-emerald-50 text-emerald-700",
  COMPLETE: "bg-neutral-100 text-neutral-500",
};

const PAGE_SIZE = 15;

async function createClientAndRedirect(formData: FormData) {
  "use server";
  const id = await createClient(formData);
  redirect(`/clients/${id}`);
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; vertical?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const verticalFilter = params.vertical ?? "";
  const page = Math.max(1, Number(params.page) || 1);

  const where = {
    ...(q ? { name: { contains: q } } : {}),
    ...(verticalFilter ? { vertical: verticalFilter as never } : {}),
  };

  const [clients, totalCount] = await Promise.all([
    prisma.robusClient.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { workflows: true } } },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.robusClient.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const buildQuery = (overrides: Record<string, string>) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (verticalFilter) next.set("vertical", verticalFilter);
    if (page > 1) next.set("page", String(page));
    for (const [k, v] of Object.entries(overrides)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    const s = next.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Clients</h1>
        <p className="text-sm text-neutral-500 mt-1">AI Analytics Console's real consulting engagements — Assessment through Retainer</p>
      </div>

      <details className="mb-8 bg-white rounded-2xl border border-neutral-100 shadow-sm open:pb-5">
        <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-neutral-900">
          + New client engagement
        </summary>
        <form action={createClientAndRedirect} className="px-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input name="name" required placeholder="Client / business name" className="rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
          <select name="vertical" required defaultValue="" className="rounded-lg border border-neutral-200 px-3 py-2 text-sm">
            <option value="" disabled>
              Select vertical…
            </option>
            {Object.entries(VERTICAL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button
            type="submit"
            className="sm:col-span-2 rounded-lg bg-indigo-600 text-white text-sm font-medium py-2 hover:bg-indigo-700 transition"
          >
            Start engagement
          </button>
        </form>
      </details>

      <form method="GET" className="mb-4 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name…"
          className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm bg-white"
        />
        <select
          name="vertical"
          defaultValue={verticalFilter}
          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm bg-white"
        >
          <option value="">All verticals</option>
          {Object.entries(VERTICAL_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button type="submit" className="rounded-lg bg-neutral-900 text-white text-sm font-medium px-4 py-2 hover:bg-neutral-800">
          Filter
        </button>
        {(q || verticalFilter) && (
          <Link href="/clients" className="text-sm text-neutral-500 self-center hover:text-neutral-700">
            Clear
          </Link>
        )}
      </form>

      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm divide-y divide-neutral-100">
        {clients.length === 0 && (
          <p className="px-5 py-6 text-sm text-neutral-400">
            {q || verticalFilter ? "No clients match this filter." : "No clients yet."}
          </p>
        )}
        {clients.map((c) => (
          <Link
            key={c.id}
            href={`/clients/${c.id}`}
            className="flex items-center justify-between px-5 py-4 hover:bg-neutral-50 transition"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-900">{c.name}</p>
              <p className="text-xs text-neutral-500">{VERTICAL_LABELS[c.vertical]}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-neutral-400">{c._count.workflows} workflows identified</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STAGE_STYLES[c.stage]}`}>
                {c.stage}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-neutral-500">
            Page {page} of {totalPages} · {totalCount} total
          </span>
          <div className="flex gap-2">
            <Link
              href={`/clients${buildQuery({ page: String(Math.max(1, page - 1)) })}`}
              aria-disabled={page <= 1}
              className={`px-3 py-1.5 rounded-lg border border-neutral-200 ${page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-neutral-50"}`}
            >
              Previous
            </Link>
            <Link
              href={`/clients${buildQuery({ page: String(Math.min(totalPages, page + 1)) })}`}
              aria-disabled={page >= totalPages}
              className={`px-3 py-1.5 rounded-lg border border-neutral-200 ${page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-neutral-50"}`}
            >
              Next
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
