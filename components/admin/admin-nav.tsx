"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavItemActive } from "../../lib/admin/navigation";
import { cn } from "../../lib/utils";

export interface AdminNavItem {
  href: string;
  label: string;
}

export function AdminNav({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation administration"
      className="mt-6 flex flex-wrap gap-2 md:grid md:gap-1"
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isNavItemActive(pathname, item.href) ? "page" : undefined}
          className={cn(
            "hover:bg-forest-800 focus-visible:outline-cream-100 rounded-md px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2",
            isNavItemActive(pathname, item.href) && "bg-forest-800 font-medium",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
