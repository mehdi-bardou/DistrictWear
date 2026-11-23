import type * as React from "react";
import { cn } from "../../../lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "bg-cream-50 text-ink-900 placeholder:text-ink-500 focus-visible:border-forest-700 h-10 w-full rounded-md border px-3 text-sm outline-none disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
