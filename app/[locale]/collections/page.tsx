import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal } from "@/components/motion/reveal";
import { Link } from "@/i18n/navigation";
import { getPublishedCollections } from "@/lib/storefront/collections";
import type { Locale } from "@/lib/storefront/types";

export const revalidate = 300;

type CollectionsPageProps = { params: Promise<{ locale: string }> };

function toLocale(value: string): Locale {
  return value === "ar" || value === "en" ? value : "fr";
}

export default async function CollectionsPage({ params }: CollectionsPageProps) {
  const { locale: rawLocale } = await params;
  const locale = toLocale(rawLocale);
  setRequestLocale(locale);

  const [t, nav, collections] = await Promise.all([
    getTranslations({ locale, namespace: "collections" }),
    getTranslations({ locale, namespace: "nav" }),
    getPublishedCollections(locale),
  ]);

  return (
    <section className="shell pt-12 pb-20 md:pt-16 xl:pb-28">
      <Reveal>
        <p className="text-forest-700 mb-6 text-xs font-bold tracking-[0.28em] uppercase">
          DISTRICT WEAR
        </p>
        <h1 className="display-xl text-forest-900">{t("title")}</h1>
        <p className="text-ink-700 mt-6 max-w-2xl text-base leading-relaxed md:text-lg">
          {t("intro")}
        </p>
      </Reveal>

      {collections.length > 0 ? (
        <ul className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 md:mt-20 lg:grid-cols-3 lg:gap-8">
          {collections.map((collection) => (
            <li key={collection.id}>
              <Link href={`/collections/${collection.slug}`} className="group block">
                <article className="flex h-full flex-col">
                  <div className="bg-cream-200 relative aspect-[4/3] w-full overflow-hidden">
                    {collection.image ? (
                      <Image
                        src={collection.image}
                        alt={collection.name}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="text-forest-800/40 font-display absolute inset-0 flex items-center justify-center text-7xl font-bold"
                      >
                        DW
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 pt-5">
                    <h2 className="font-display text-ink-900 text-2xl leading-tight font-semibold">
                      {collection.name}
                    </h2>
                    {collection.description && (
                      <p className="text-ink-700 text-sm leading-relaxed">
                        {collection.description}
                      </p>
                    )}
                    <span className="text-ink-900 mt-auto inline-flex items-center gap-2 pt-4 text-xs font-bold tracking-[0.16em] uppercase transition-opacity group-hover:opacity-70">
                      {t("viewCollection")}
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </span>
                  </div>
                </article>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="border-ink-900/20 mt-14 flex flex-col items-start gap-6 border-y py-12 md:mt-20">
          <h2 className="display-lg text-forest-900">{t("empty")}</h2>
          <p className="text-ink-700 max-w-xl text-base leading-relaxed">{t("emptyCopy")}</p>
          <Link
            href="/shop"
            className="bg-forest-900 text-cream-100 inline-flex items-center gap-3 px-6 py-4 text-xs font-bold tracking-[0.16em] uppercase transition-opacity hover:opacity-85"
          >
            {nav("shop")}
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
      )}
    </section>
  );
}
