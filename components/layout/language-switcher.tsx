"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("language");
  const pathname = usePathname();
  const router = useRouter();

  function select(nextLocale: (typeof routing.locales)[number]) {
    if (nextLocale === locale) return;
    const search = typeof window === "undefined" ? "" : window.location.search;
    router.replace(`${pathname}${search}`, { locale: nextLocale, scroll: false });
  }

  return (
    <div
      role="group"
      aria-label={t("label")}
      className="flex items-center gap-0.5 text-[11px] font-bold tracking-wider"
    >
      {routing.locales.map((code, index) => (
        <span key={code} className="flex items-center">
          {index > 0 && (
            <span aria-hidden="true" className="text-ink-300">
              /
            </span>
          )}
          <button
            type="button"
            onClick={() => select(code)}
            aria-pressed={locale === code}
            lang={code}
            className={cn(
              "px-1 py-1 transition-opacity hover:opacity-60",
              locale === code ? "text-forest-900 underline underline-offset-4" : "text-ink-500",
            )}
          >
            {t(code)}
          </button>
        </span>
      ))}
    </div>
  );
}
