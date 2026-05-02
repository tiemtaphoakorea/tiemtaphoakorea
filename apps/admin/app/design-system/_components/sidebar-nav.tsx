"use client";

import { Zap } from "lucide-react";
import { navGroups } from "../_data/nav-sections";

export function SidebarNav() {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-56 flex-col bg-slate-950 text-slate-300">
      <div className="flex items-center gap-2.5 border-b border-slate-800 px-5 py-4">
        <div className="flex size-7 items-center justify-center rounded-lg bg-white">
          <Zap className="size-4 text-slate-900" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">K-SMART</p>
          <p className="font-mono text-[10px] text-slate-500">Design System</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {Object.entries(navGroups).map(([group, items]) => (
          <div key={group} className="mb-4">
            <p className="px-5 pb-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-600">
              {group}
            </p>
            {items.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="flex items-center gap-2 px-5 py-1.5 text-sm text-slate-400 transition-colors hover:bg-slate-900 hover:text-white target:bg-slate-800 target:text-white [&:target]:bg-slate-800 [&:target]:text-white"
              >
                {item.label}
              </a>
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-800 px-5 py-3">
        <p className="font-mono text-[10px] text-slate-600">v1.0 · Tailwind CSS 4</p>
      </div>
    </aside>
  );
}
