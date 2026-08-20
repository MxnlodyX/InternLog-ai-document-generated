"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navigation = [
  { name: "Weekly Logger", shortName: "WL", href: "/home" },
  { name: "Co-Document Log", shortName: "CD", href: "/home/interndoc" },
];

type SidebarContentProps = {
  pathname: string;
  onNavigate?: () => void;
  onClose?: () => void;
};

function SidebarContent({ pathname, onNavigate, onClose }: SidebarContentProps) {
  const isActive = (href: string) =>
    href === "/home" ? pathname === href : pathname.startsWith(href);

  return (
    <>
      <div className="flex h-20 items-center justify-between px-6">
        <Link href="/home" className="flex items-center gap-3" onClick={onNavigate}>
          <span className="grid size-9 place-items-center rounded-xl bg-slate-950 text-sm font-semibold text-white shadow-sm">IL</span>
          <span>
            <span className="block text-sm font-semibold tracking-tight text-slate-950">InternLog</span>
            <span className="block text-xs text-slate-400">Student workspace</span>
          </span>
        </Link>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-xl text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close sidebar"
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
      </div>

      <div className="px-4 pt-5">
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
        <nav className="space-y-1.5" aria-label="Main navigation">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-slate-950 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"}`}
              >
                <span className={`grid size-7 place-items-center rounded-lg text-[10px] font-bold ${active ? "bg-white/12 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {item.shortName}
                </span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-900">Internship progress</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-[68%] rounded-full bg-emerald-500" />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-slate-500">
            <span>Week 11 of 16</span>
            <span>68%</span>
          </div>
        </div>

        <button className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-slate-50">
          <span className="grid size-9 place-items-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700">MX</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-slate-900">Mxnlody</span>
            <span className="block truncate text-xs text-slate-400">Intern student</span>
          </span>
          <span className="text-slate-400" aria-hidden="true">•••</span>
        </button>
      </div>
    </>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed left-4 top-5 z-30 grid size-10 place-items-center rounded-xl border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50 md:hidden"
        aria-label="Open sidebar"
        aria-expanded={isOpen}
        aria-controls="mobile-sidebar"
      >
        <span className="flex w-4 flex-col gap-1" aria-hidden="true">
          <span className="h-0.5 w-4 rounded-full bg-slate-700" />
          <span className="h-0.5 w-4 rounded-full bg-slate-700" />
          <span className="h-0.5 w-4 rounded-full bg-slate-700" />
        </span>
      </button>

      <aside className="hidden h-screen w-64 shrink-0 border-r border-slate-200/80 bg-white md:sticky md:top-0 md:flex md:flex-col">
        <SidebarContent pathname={pathname} />
      </aside>

      <div
        className={`fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[2px] transition-opacity duration-300 md:hidden ${isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <aside
        id="mobile-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(20rem,86vw)] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out md:hidden ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
        aria-label="Mobile sidebar"
        aria-hidden={!isOpen}
      >
        <SidebarContent pathname={pathname} onNavigate={() => setIsOpen(false)} onClose={() => setIsOpen(false)} />
      </aside>
    </>
  );
}
