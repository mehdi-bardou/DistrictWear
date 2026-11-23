import type { ProductQuery, ShopSort } from "./types";

const SORTS: readonly ShopSort[] = ["featured", "newest", "name", "price-asc", "price-desc"];
const MAX_SEARCH_LENGTH = 100;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function integerValue(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
}

/** Turn raw URL params into a bounded, typed catalogue query. */
export function parseShopParams(
  params: Record<string, string | string[] | undefined>,
): ProductQuery {
  const query: ProductQuery = {
    sort: SORTS.find((sort) => sort === firstValue(params.sort)) ?? "featured",
    page: Math.max(1, integerValue(firstValue(params.page), 1)),
    pageSize: Math.min(48, Math.max(1, integerValue(firstValue(params.pageSize), 12))),
  };

  const category = firstValue(params.category)?.trim();
  if (category) query.category = category;

  const collection = firstValue(params.collection)?.trim();
  if (collection) query.collection = collection;

  const search = firstValue(params.search)?.trim().slice(0, MAX_SEARCH_LENGTH);
  if (search) query.search = search;

  return query;
}

/** Strip characters that would change the meaning of a PostgREST `.or()` filter. */
export function sanitizeSearch(value: string): string {
  return value
    .replace(/[(),.%:\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_SEARCH_LENGTH);
}
