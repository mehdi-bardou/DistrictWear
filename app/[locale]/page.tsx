import { ArrowDownRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type HomePageProps = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <>
      <section className="shell grid min-h-[calc(100dvh-var(--header-height))] items-end gap-10 pt-20 pb-12 lg:grid-cols-12 lg:pt-32 lg:pb-20">
        <div className="lg:col-span-8">
          <p className="text-forest-700 mb-6 text-xs font-bold tracking-[0.28em] uppercase">
            {t("eyebrow")}
          </p>
          <h1 className="display-xl text-forest-900">{t("title")}</h1>
        </div>

        <div className="lg:col-span-4 lg:pb-3">
          <p className="text-ink-700 max-w-md text-base leading-relaxed md:text-lg">{t("lede")}</p>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <Link
              href="/shop"
              className="bg-forest-900 text-cream-100 inline-flex items-center gap-3 px-6 py-4 text-xs font-bold tracking-[0.16em] uppercase transition-opacity hover:opacity-85"
            >
              {t("cta")}
              <ArrowDownRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href="/collections"
              className="text-ink-900 text-xs font-bold tracking-[0.16em] uppercase underline underline-offset-4"
            >
              {t("secondary")}
            </Link>
          </div>
        </div>
      </section>

      <div className="shell">
        <div className="rule" />
        <div className="text-ink-500 flex items-center justify-between py-5 text-[11px] font-semibold tracking-[0.2em] uppercase">
          <span>DW — 001</span>
          <span>Casablanca /MA</span>
        </div>
        <div className="rule" />
      </div>

      <section aria-hidden="true" className="shell mt-10">
        <div className="grid gap-3 md:grid-cols-12">
          <div className="bg-forest-900 h-64 md:col-span-7 md:h-[32rem]" />
          <div className="grid gap-3 md:col-span-5">
            <div className="bg-cream-200 h-40 md:h-[15.5rem]" />
            <div className="bg-ink-900 h-40 md:h-[15.5rem]" />
          </div>
        </div>
      </section>
    </>
  );
}
