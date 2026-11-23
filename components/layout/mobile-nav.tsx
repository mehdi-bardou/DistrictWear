"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const links = [
  { key: "home", href: "/" },
  { key: "shop", href: "/shop" },
  { key: "collections", href: "/collections" },
  { key: "about", href: "/about" },
  { key: "contact", href: "/contact" },
  { key: "cart", href: "/cart" },
] as const;

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("nav");

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        aria-label={open ? t("closeMenu") : t("menu")}
        className="text-ink-900 flex size-9 items-center justify-center"
      >
        {open ? <X size={22} strokeWidth={1.6} /> : <Menu size={22} strokeWidth={1.6} />}
      </button>

      <div
        id="mobile-navigation"
        hidden={!open}
        className="border-ink-900/12 bg-cream-100 fixed inset-x-0 top-[var(--header-height)] z-40 border-b px-5 pt-4 pb-8 shadow-lg"
      >
        <nav aria-label={t("menu")} className="flex flex-col">
          {links.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              onClick={() => setOpen(false)}
              className="border-ink-900/10 font-display text-forest-900 border-b py-4 text-3xl font-bold uppercase"
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
