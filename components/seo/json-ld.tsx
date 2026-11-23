import { safeJsonLd } from "@/lib/seo/structured-data";

type JsonLdProps = { data: Record<string, unknown> };

/** Inline structured data. safeJsonLd prevents a </script> breakout. */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }} />
  );
}
