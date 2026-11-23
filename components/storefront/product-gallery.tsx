"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { StorefrontImage } from "@/lib/storefront/types";
import { cn } from "@/lib/utils";

type ProductGalleryProps = {
  images: StorefrontImage[];
  productName: string;
};

const MAIN_SIZES = "(min-width: 1024px) 50vw, 100vw";
const THUMB_SIZES = "4rem";

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const t = useTranslations("product");
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex] ?? images[0];

  return (
    <div>
      <div className="bg-cream-200 relative aspect-[4/5] w-full overflow-hidden">
        {active ? (
          <Image
            key={active.id}
            src={active.url}
            alt={active.alt || productName}
            fill
            sizes={MAIN_SIZES}
            className="object-cover"
          />
        ) : (
          <Image
            src="/images/product-placeholder.svg"
            alt={`${productName} — ${t("galleryLabel")}`}
            fill
            sizes={MAIN_SIZES}
            unoptimized
            className="object-contain"
          />
        )}
      </div>

      {images.length > 0 && (
        <div role="group" aria-label={t("galleryLabel")} className="mt-4">
          <ul className="flex flex-wrap gap-3">
            {images.map((image, index) => {
              const isActive = index === activeIndex;
              return (
                <li key={image.id}>
                  <button
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    aria-pressed={isActive}
                    aria-label={`${t("thumbnail")} ${index + 1} / ${images.length}: ${image.alt || productName}`}
                    className={cn(
                      "bg-cream-200 relative size-16 shrink-0 overflow-hidden border transition-opacity hover:opacity-85",
                      isActive ? "border-forest-900 opacity-100" : "border-ink-900/20 opacity-70",
                    )}
                  >
                    <Image
                      src={image.url}
                      alt=""
                      fill
                      sizes={THUMB_SIZES}
                      className="object-cover"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
