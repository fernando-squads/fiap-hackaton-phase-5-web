import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "cyan" | "green" | "yellow" | "orange" | "red" | "slate" | "purple";
};

export function Badge({ className, tone = "slate", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        tone === "cyan" && "border-cyan-300/30 bg-cyan-300/10 text-cyan-200",
        tone === "green" && "border-emerald-300/30 bg-emerald-300/10 text-emerald-200",
        tone === "yellow" && "border-amber-300/30 bg-amber-300/10 text-amber-200",
        tone === "orange" && "border-orange-300/30 bg-orange-300/10 text-orange-200",
        tone === "red" && "border-rose-300/30 bg-rose-300/10 text-rose-200",
        tone === "purple" && "border-violet-300/30 bg-violet-300/10 text-violet-200",
        tone === "slate" && "border-slate-300/20 bg-slate-300/10 text-slate-200",
        className,
      )}
      {...props}
    />
  );
}
