"use client";

import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

export function Tabs({
  tabs,
  defaultValue,
  className,
}: {
  tabs: Array<{ value: string; label: string; content: ReactNode }>;
  defaultValue?: string;
  className?: string;
}) {
  const [active, setActive] = useState(defaultValue ?? tabs[0]?.value);
  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2 rounded-lg border border-white/10 bg-black/18 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium text-slate-400 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300",
              active === tab.value && "bg-white/10 text-white shadow-sm",
            )}
            onClick={() => setActive(tab.value)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">{tabs.find((tab) => tab.value === active)?.content}</div>
    </div>
  );
}
