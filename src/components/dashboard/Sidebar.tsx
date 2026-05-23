"use client";

import Link from "next/link";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: "D" },
  { name: "Jobs", href: "/dashboard/jobs", icon: "J" },
  
  { name: "Portfolio", href: "/dashboard/portfolio", icon: "P" },
  { name: "Analytics", href: "/dashboard/analytics", icon: "A" },
  { name: "Messages", href: "/dashboard/messages", icon: "M" },
  { name: "AI Assistant", href: "/assistant", icon: "AI" },
  { name: "Settings", href: "/settings", icon: "S" },
];

export default function Sidebar() {
  return (
    <aside className="border-b border-slate-200 bg-white/95 px-4 py-4 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-72 lg:flex-col lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
      <Link
        href="/dashboard"
        className="flex items-center gap-3 px-2"
        aria-label="Codeflow dashboard"
      >
        <span className="grid size-9 place-items-center rounded-lg bg-slate-950 text-sm font-semibold leading-none text-white">
          C
        </span>

        <div>
          <p className="text-sm font-semibold leading-5 text-slate-950">
            HyperHire
          </p>

          <p className="text-xs leading-5 text-slate-500">
            Workspace OS
          </p>
        </div>
      </Link>

      <nav className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:mt-8 lg:flex-col lg:overflow-visible lg:pb-0">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 lg:w-full"
          >
            <span className="grid size-7 place-items-center rounded-md bg-slate-100 text-xs font-semibold text-slate-600">
              {item.icon}
            </span>

            {item.name}
          </Link>
        ))}
      </nav>

      <div className="mt-auto hidden rounded-lg border border-slate-200 bg-slate-50 p-4 lg:block">
        <p className="text-sm font-semibold text-slate-950">
          Starter plan
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          Dashboard shell ready for product modules and future auth.
        </p>
      </div>
    </aside>
  );
}