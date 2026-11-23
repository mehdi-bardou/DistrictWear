import { ArrowUpRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal } from "@/components/motion/reveal";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/storefront/types";

export const revalidate = 300;

type AboutPageProps = { params: Promise<{ locale: string }> };

function toLocale(value: string): Locale {
  return value === "ar" || value === "en" ? value : "fr";
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale: rawLocale } = await params;
  const locale = toLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "about" });

  const principles = [
    { title: t("principleOne"), copy: t("principleOneCopy") },
    { title: t("principleTwo"), copy: t("principleTwoCopy") },
    { title: t("principleThree"), copy: t("principleThreeCopy") },
  ];

  return (
    <section className="shell pt-16 pb-20 md:pt-24 xl:pb-28">
      <p className="text-forest-700 mb-6 text-xs font-bold tracking-[0.28em] uppercase">
        {t("eyebrow")}
      </p>
      <h1 className="display-xl text-forest-900">{t("title")}</h1>

      <div className="rule mt-10 md:mt-14" />

      <div className="mt-12 grid gap-12 md:mt-16 lg:grid-cols-12 lg:gap-16 xl:gap-20">
        <div className="lg:col-span-5">
          <p className="text-ink-700 text-base leading-relaxed md:text-lg">{t("lede")}</p>

          <div className="rule my-10 md:my-14" />

          <Reveal>
            <h2 className="display-lg text-forest-900">{t("cityTitle")}</h2>
            <p className="text-ink-700 mt-6 text-base leading-relaxed">{t("cityCopy")}</p>
          </Reveal>

          <Link
            href="/shop"
            className="bg-forest-900 text-cream-100 mt-10 inline-flex items-center gap-3 px-6 py-4 text-xs font-bold tracking-[0.16em] uppercase transition-opacity hover:opacity-85"
          >
            {t("cta")}
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>

        <div className="lg:col-span-7">
          <Reveal>
            <h2 className="display-lg text-forest-900">{t("manifestoTitle")}</h2>
            <p className="text-ink-700 mt-6 text-base leading-relaxed md:text-lg">
              {t("manifesto")}
            </p>
          </Reveal>

          <div className="rule my-10 md:my-14" />

          <Reveal>
            <h2 className="display-lg text-forest-900">{t("principlesTitle")}</h2>
            <ol className="mt-8">
              {principles.map((principle) => (
                <li
                  key={principle.title}
                  className="border-ink-900/20 grid gap-2 border-t py-6 sm:grid-cols-12 sm:gap-6"
                >
                  <h3 className="text-forest-900 text-sm font-bold tracking-[0.12em] uppercase sm:col-span-4">
                    {principle.title}
                  </h3>
                  <p className="text-ink-700 text-sm leading-relaxed sm:col-span-8">
                    {principle.copy}
                  </p>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
