"use client";

import { Toaster as SonnerToaster } from "sonner";

/** Admin notifications. Styling stays on design tokens. */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      theme="light"
      toastOptions={{
        classNames: {
          toast: "border-forest-200 bg-cream-50 text-ink-900",
          description: "text-ink-700",
          success: "text-forest-900",
          error: "text-ink-900",
        },
      }}
    />
  );
}
