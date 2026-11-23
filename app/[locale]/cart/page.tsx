import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CartPanel } from "@/components/cart/cart-panel";
import { pageMetadata } from "@/lib/seo/metadata";
import { getStoreSettings } from "@/lib/storefront/settings";
import type { Locale } from "@/lib/storefront/types";
import type { WhatsAppCopy } from "@/lib/whatsapp/message";

export const revalidate = 300;

type CartPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: CartPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "ar" || rawLocale === "en" ? rawLocale : "fr";
  const seo = await getTranslations({ locale, namespace: "seo" });
  return pageMetadata({
    locale,
    pathname: "/cart",
    title: seo("cart.title"),
    description: seo("cart.description"),
  });
}

export default async function CartPage({ params }: CartPageProps) {
  const { locale: rawLocale } = await params;
  setRequestLocale(rawLocale);
  const locale: Locale = rawLocale === "ar" || rawLocale === "en" ? rawLocale : "fr";

  const [cartT, commonT, whatsappT, settings] = await Promise.all([
    getTranslations({ locale, namespace: "cart" }),
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "whatsapp" }),
    getStoreSettings(),
  ]);

  const whatsappCopy: WhatsAppCopy = {
    greeting: whatsappT("greeting"),
    closing: whatsappT("closing"),
    reference: whatsappT("reference"),
    total: whatsappT("total"),
    currency: commonT("currency"),
  };

  return (
    <section className="shell pt-12 pb-20 md:pt-16 xl:pb-28">
      <h1 className="display-lg text-forest-900">{cartT("title")}</h1>
      <div className="rule mt-10" />
      <div className="mt-10">
        <CartPanel
          locale={locale}
          currency={commonT("currency")}
          whatsappNumber={settings.whatsappNumber}
          whatsappCopy={whatsappCopy}
          inquiryLoggingEnabled={settings.inquiryLoggingEnabled}
          mode="page"
        />
      </div>
    </section>
  );
}
