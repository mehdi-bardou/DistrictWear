import type * as React from "react";
import { cn } from "../../../lib/utils";

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "bg-cream-50 text-ink-900 placeholder:text-ink-500 focus-visible:border-forest-700 min-h-28 w-full rounded-md border px-3 py-2 text-sm outline-none disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
