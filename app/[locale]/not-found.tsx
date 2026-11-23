import { hasLocale } from "next-intl";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export default async function LocaleNotFound() {
  const currentLocale = await getLocale();
  const locale = hasLocale(routing.locales, currentLocale) ? currentLocale : "fr";
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "notFound" });

  return (
    <section className="shell flex min-h-[60dvh] flex-col justify-center pt-16 pb-20">
      <p className="text-forest-700 mb-6 text-xs font-bold tracking-[0.28em] uppercase">
        {t("label")}
      </p>
      <p className="display-xl text-forest-900" aria-hidden="true">
        404
      </p>
      <h1 className="display-lg text-forest-900 mt-8">{t("title")}</h1>
      <p className="text-ink-700 mt-6 max-w-xl text-base leading-relaxed">{t("copy")}</p>

      <div className="rule my-10" />

      <div className="flex flex-wrap items-center gap-6">
        <Link
          href="/"
          className="bg-forest-900 text-cream-100 inline-flex items-center px-6 py-4 text-xs font-bold tracking-[0.16em] uppercase transition-opacity hover:opacity-85"
        >
          {t("home")}
        </Link>
        <Link
          href="/shop"
          className="text-ink-900 text-xs font-bold tracking-[0.16em] uppercase underline underline-offset-4 transition-opacity hover:opacity-85"
        >
          {t("shop")}
        </Link>
      </div>
    </section>
  );
}
