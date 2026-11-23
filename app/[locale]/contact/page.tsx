import { ArrowUpRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { validContactEmail } from "@/lib/storefront/contact";
import { getStoreSettings } from "@/lib/storefront/settings";
import type { Locale } from "@/lib/storefront/types";

export const revalidate = 300;

const PHONE_PATTERN = /^\d{8,15}$/;

type ContactPageProps = { params: Promise<{ locale: string }> };

function toLocale(value: string): Locale {
  return value === "ar" || value === "en" ? value : "fr";
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale: rawLocale } = await params;
  const locale = toLocale(rawLocale);
  setRequestLocale(locale);

  const [t, settings] = await Promise.all([
    getTranslations({ locale, namespace: "contact" }),
    getStoreSettings(),
  ]);

  const digits = settings.whatsappNumber.replace(/\D/g, "");
  const whatsapp = PHONE_PATTERN.test(digits) ? digits : "";
  const email = validContactEmail(settings.contactEmail);
  const instagramUrl = (() => {
    const value = settings.instagramUrl;
    if (!value) return null;
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:" ? value : null;
    } catch {
      return null;
    }
  })();
  const hasChannels = Boolean(email || instagramUrl || whatsapp);

  return (
    <section className="shell pt-16 pb-20 md:pt-24 xl:pb-28">
      <p className="text-forest-700 mb-6 text-xs font-bold tracking-[0.28em] uppercase">
        CASABLANCA / MA
      </p>
      <h1 className="display-xl text-forest-900">{t("title")}</h1>
      <p className="text-ink-700 mt-6 max-w-2xl text-base leading-relaxed md:text-lg">
        {t("lede")}
      </p>

      <div className="rule mt-12 md:mt-16" />

      <div className="mt-12 grid gap-12 md:mt-16 lg:grid-cols-12 lg:gap-16 xl:gap-20">
        <div className="lg:col-span-7">
          {hasChannels ? (
            <dl className="flex flex-col">
              {email && (
                <div className="border-ink-900/20 flex flex-col gap-2 border-b py-6 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
                  <dt className="text-ink-500 text-xs font-bold tracking-[0.2em] uppercase">
                    {t("emailLabel")}
                  </dt>
                  <dd className="text-ink-900 text-base break-words">
                    <a
                      href={`mailto:${email}`}
                      className="inline-flex items-center gap-2 transition-opacity hover:opacity-70"
                    >
                      {email}
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </a>
                  </dd>
                </div>
              )}

              {instagramUrl && (
                <div className="border-ink-900/20 flex flex-col gap-2 border-b py-6 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
                  <dt className="text-ink-500 text-xs font-bold tracking-[0.2em] uppercase">
                    {t("instagramLabel")}
                  </dt>
                  <dd className="text-ink-900 text-base break-words">
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 transition-opacity hover:opacity-70"
                    >
                      {t("instagramLabel")}
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </a>
                  </dd>
                </div>
              )}

              {whatsapp && (
                <div className="border-ink-900/20 border-b py-6">
                  <dt className="text-ink-500 text-xs font-bold tracking-[0.2em] uppercase">
                    {t("whatsappLabel")}
                  </dt>
                  <dd className="mt-3">
                    <p className="text-ink-700 mb-5 text-sm leading-relaxed">{t("whatsappCopy")}</p>
                    <a
                      href={`https://wa.me/${whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-forest-900 text-cream-100 inline-flex items-center gap-3 px-6 py-4 text-xs font-bold tracking-[0.16em] uppercase transition-opacity hover:opacity-85"
                    >
                      {t("whatsappLabel")}
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-ink-700 text-base leading-relaxed">{t("empty")}</p>
          )}
        </div>

        <div className="lg:col-span-5">
          <h2 className="text-ink-500 text-xs font-bold tracking-[0.2em] uppercase">
            {t("hoursLabel")}
          </h2>
          <p className="text-ink-900 mt-3 text-base">{t("hoursValue")}</p>

          <div className="bg-cream-200 mt-10 p-6 md:p-8">
            <p className="text-ink-700 text-sm leading-relaxed md:text-base">{t("note")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
