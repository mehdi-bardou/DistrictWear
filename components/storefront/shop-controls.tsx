import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale, ProductQuery, ShopSort, StorefrontCategory } from "@/lib/storefront/types";

type SortKey = "sortFeatured" | "sortNewest" | "sortName" | "sortPriceAsc" | "sortPriceDesc";

const SORTS: readonly { value: ShopSort; label: SortKey }[] = [
  { value: "featured", label: "sortFeatured" },
  { value: "newest", label: "sortNewest" },
  { value: "name", label: "sortName" },
  { value: "price-asc", label: "sortPriceAsc" },
  { value: "price-desc", label: "sortPriceDesc" },
];

type LinkQuery = Pick<ProductQuery, "category" | "collection" | "search" | "sort" | "page">;

function shopHref(query: LinkQuery): string {
  const params = new URLSearchParams();
  if (query.category) params.set("category", query.category);
  if (query.collection) params.set("collection", query.collection);
  if (query.search) params.set("search", query.search);
  if (query.sort && query.sort !== "featured") params.set("sort", query.sort);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  const search = params.toString();
  return search ? `/shop?${search}` : "/shop";
}

/** Build a pagination link that carries every active filter, search term and sort. */
export function pageHref(query: ProductQuery, page: number): string {
  return shopHref({ ...query, page });
}

function filterClass(active: boolean): string {
  const base =
    "inline-flex items-center border px-4 py-2 text-xs font-bold tracking-[0.12em] uppercase";
  return active
    ? `bg-forest-900 text-cream-100 border-forest-900 ${base}`
    : `border-ink-900/20 text-ink-900 hover:border-forest-900 ${base} transition-opacity hover:opacity-85`;
}

type ShopControlsProps = {
  locale: Locale;
  query: ProductQuery;
  categories: StorefrontCategory[];
};

export async function ShopControls({ locale, query, categories }: ShopControlsProps) {
  const t = await getTranslations({ locale, namespace: "shop" });

  return (
    <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
      <nav aria-label={t("categoryLabel")}>
        <p className="text-ink-500 mb-3 text-[11px] font-bold tracking-[0.18em] uppercase">
          {t("categoryLabel")}
        </p>
        <ul className="flex flex-wrap gap-2 md:gap-3">
          <li>
            <Link
              href={shopHref({ ...query, category: undefined, page: undefined })}
              aria-current={query.category ? undefined : "page"}
              className={filterClass(!query.category)}
            >
              {t("all")}
            </Link>
          </li>
          {categories.map((category) => {
            const active = query.category === category.slug;
            return (
              <li key={category.id}>
                <Link
                  href={shopHref({ ...query, category: category.slug, page: undefined })}
                  aria-current={active ? "page" : undefined}
                  className={filterClass(active)}
                >
                  {category.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <nav aria-label={t("sortLabel")}>
        <p className="text-ink-500 mb-3 text-[11px] font-bold tracking-[0.18em] uppercase">
          {t("sortLabel")}
        </p>
        <ul className="flex flex-wrap gap-2 md:gap-3">
          {SORTS.map(({ value, label }) => {
            const active = query.sort === value;
            return (
              <li key={value}>
                <Link
                  href={shopHref({ ...query, sort: value, page: undefined })}
                  aria-current={active ? "page" : undefined}
                  className={filterClass(active)}
                >
                  {t(label)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <form
        method="get"
        action={`/${locale}/shop`}
        className="flex w-full flex-col gap-3 lg:max-w-sm"
      >
        <label
          htmlFor="shop-search"
          className="text-ink-500 text-[11px] font-bold tracking-[0.18em] uppercase"
        >
          {t("searchLabel")}
        </label>
        <div className="flex gap-2">
          <input
            id="shop-search"
            type="search"
            name="search"
            defaultValue={query.search}
            placeholder={t("searchPlaceholder")}
            className="border-ink-900/20 bg-cream-50 text-ink-900 min-w-0 flex-1 border px-4 py-3 text-sm"
          />
          <button
            type="submit"
            className="bg-forest-900 text-cream-100 shrink-0 px-5 py-3 text-xs font-bold tracking-[0.12em] uppercase transition-opacity hover:opacity-85"
          >
            {t("searchSubmit")}
          </button>
        </div>
        {query.category && <input type="hidden" name="category" value={query.category} />}
        {query.collection && <input type="hidden" name="collection" value={query.collection} />}
        {query.sort && <input type="hidden" name="sort" value={query.sort} />}
      </form>
    </div>
  );
}

type ShopPaginationProps = {
  locale: Locale;
  query: ProductQuery;
  page: number;
  pageCount: number;
};

export async function ShopPagination({ locale, query, page, pageCount }: ShopPaginationProps) {
  if (pageCount <= 1) return null;
  const t = await getTranslations({ locale, namespace: "shop" });
  const hasPrevious = page > 1;
  const hasNext = page < pageCount;

  return (
    <nav
      aria-label={t("title")}
      className="text-ink-700 mt-12 flex items-center justify-between gap-4 text-xs font-bold tracking-[0.16em] uppercase"
    >
      {hasPrevious ? (
        <Link
          href={pageHref(query, page - 1)}
          className="transition-opacity hover:opacity-85"
          rel="prev"
        >
          {t("previous")}
        </Link>
      ) : (
        <span aria-disabled="true" className="text-ink-300">
          {t("previous")}
        </span>
      )}
      <span aria-live="polite">
        {page} / {pageCount}
      </span>
      {hasNext ? (
        <Link
          href={pageHref(query, page + 1)}
          className="transition-opacity hover:opacity-85"
          rel="next"
        >
          {t("next")}
        </Link>
      ) : (
        <span aria-disabled="true" className="text-ink-300">
          {t("next")}
        </span>
      )}
    </nav>
  );
}
