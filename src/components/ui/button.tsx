import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "icon";
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-cyan-400 text-slate-950 shadow-[0_0_24px_rgba(0,212,255,0.22)] hover:bg-cyan-300",
        variant === "secondary" && "border border-white/10 bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]",
        variant === "ghost" && "text-slate-300 hover:bg-white/[0.07] hover:text-white",
        variant === "danger" && "bg-rose-500 text-white hover:bg-rose-400",
        size === "md" && "h-11 px-4 text-sm",
        size === "sm" && "h-9 px-3 text-xs",
        size === "icon" && "h-10 w-10 p-0",
        className,
      )}
      {...props}
    />
  );
}
