import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { CartButton } from "@/components/cart/cart-button";
import { Link } from "@/i18n/navigation";
import { getStoreSettings } from "@/lib/storefront/settings";
import { LanguageSwitcher } from "./language-switcher";
import { MobileNav } from "./mobile-nav";

const links = [
  { key: "shop", href: "/shop" },
  { key: "collections", href: "/collections" },
  { key: "about", href: "/about" },
  { key: "contact", href: "/contact" },
] as const;

export async function SiteHeader() {
  const [t, settings] = await Promise.all([getTranslations("nav"), getStoreSettings()]);

  return (
    <header className="border-ink-900/12 bg-cream-100/92 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="shell flex h-[var(--header-height)] items-center justify-between gap-6">
        <MobileNav />

        <Link href="/" className="flex items-center" aria-label={t("brand")}>
          <Image
            src="/logos/district-wear-logo.webp"
            alt=""
            width={1774}
            height={887}
            sizes="(min-width: 768px) 180px, 128px"
            priority
            className="h-8 w-auto md:h-9"
          />
        </Link>

        <nav aria-label={t("menu")} className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className="text-ink-700 text-xs font-semibold tracking-[0.18em] uppercase transition-opacity hover:opacity-60"
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 md:gap-5">
          <LanguageSwitcher />
          <span className="bg-ink-900/20 hidden h-5 w-px sm:block" aria-hidden="true" />
          <CartButton whatsappNumber={settings.whatsappNumber} />
        </div>
      </div>
    </header>
  );
}
