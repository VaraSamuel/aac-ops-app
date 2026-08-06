"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logOut } from "@/lib/actions";

const NAV = [
  { href: "/pipeline", label: "Pipeline" },
  { href: "/clients", label: "Clients" },
  { href: "/signal", label: "Signal Engine" },
  { href: "/playbooks", label: "Playbooks" },
  { href: "/questions", label: "Discovery Questions" },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-indigo-50 text-indigo-700"
                : "text-neutral-600 hover:bg-indigo-50 hover:text-indigo-700"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({ userEmail }: { userEmail: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
            R
          </div>
          <span className="font-semibold text-neutral-900 text-sm">AAC Ops</span>
        </div>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle navigation menu"
          className="p-2 rounded-lg border border-neutral-200 text-neutral-600"
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-neutral-100 flex flex-col">
          <NavLinks onNavigate={() => setMobileOpen(false)} />
          <div className="px-5 py-4 border-t border-neutral-100">
            <p className="text-xs text-neutral-400 mb-2 truncate">{userEmail}</p>
            <form action={logOut}>
              <button type="submit" className="text-xs font-medium text-neutral-500 hover:text-indigo-600">
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 bg-white border-r border-neutral-100 flex-col">
        <div className="px-5 py-5 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              R
            </div>
            <span className="font-semibold text-neutral-900">AAC Ops</span>
          </div>
        </div>
        <NavLinks />
        <div className="px-5 py-4 border-t border-neutral-100">
          <p className="text-xs text-neutral-400 mb-2 truncate">{userEmail}</p>
          <form action={logOut}>
            <button type="submit" className="text-xs font-medium text-neutral-500 hover:text-indigo-600">
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
