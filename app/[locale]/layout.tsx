import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Barlow_Condensed, IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import { routing } from "@/i18n/routing";
import { SiteFooter } from "@/components/layout/footer";
import { SiteHeader } from "@/components/layout/navbar";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import "../globals.css";

const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: { default: t("title"), template: "%s — DISTRICT WEAR" },
    description: t("description"),
    applicationName: "DISTRICT WEAR",
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${display.variable} ${sans.variable} ${arabic.variable}`}
    >
      <body className="bg-cream-100 text-ink-900 min-h-dvh antialiased">
        <NextIntlClientProvider messages={messages}>
          <a
            href="#main-content"
            className="focus:bg-forest-900 focus:text-cream-100 sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-100 focus:px-4 focus:py-2 focus:text-sm"
          >
            {t("skipToContent")}
          </a>
          <SmoothScroll />
          <SiteHeader />
          <main id="main-content" className="min-h-[60dvh]">
            {children}
          </main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
