import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const links = [
  { key: "shop", href: "/shop" },
  { key: "collections", href: "/collections" },
  { key: "about", href: "/about" },
  { key: "contact", href: "/contact" },
] as const;

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const navT = await getTranslations("nav");
  const whatsappNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");

  return (
    <footer className="border-ink-900/15 bg-forest-900 text-cream-100 mt-24 border-t">
      <div className="shell grid gap-12 py-16 md:grid-cols-12 md:py-24">
        <div className="md:col-span-6">
          <Link href="/" className="inline-flex" aria-label={navT("brand")}>
            <Image
              src="/logos/district-wear-logo-light.webp"
              alt=""
              width={1774}
              height={887}
              sizes="(min-width: 768px) 260px, 180px"
              className="h-14 w-auto md:h-20"
            />
          </Link>
          <p className="text-cream-200 mt-6 max-w-sm text-sm leading-relaxed">{t("tagline")}</p>
        </div>

        <div className="md:col-span-3">
          <h2 className="text-cream-300 text-xs font-bold tracking-[0.2em] uppercase">
            {t("explore")}
          </h2>
          <ul className="mt-6 space-y-3">
            {links.map((link) => (
              <li key={link.key}>
                <Link href={link.href} className="text-cream-100 text-sm hover:underline">
                  {navT(link.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-3">
          <h2 className="text-cream-300 text-xs font-bold tracking-[0.2em] uppercase">
            {t("contact")}
          </h2>
          {whatsappNumber && (
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cream-100 mt-6 inline-flex items-center gap-2 text-sm hover:underline"
            >
              {t("whatsapp")}
              <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          )}
        </div>
      </div>

      <div className="shell border-cream-100/20 text-cream-200 flex flex-wrap items-center justify-between gap-3 border-t py-6 text-xs">
        <span>
          © {new Date().getFullYear()} DISTRICT WEAR. {t("rights")}
        </span>
        <span>Casablanca — MA</span>
      </div>
    </footer>
  );
}
