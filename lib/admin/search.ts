/** Build a safe PostgREST `.or()` filter from admin search input. */

export function searchFilter(query: string, ...columns: string[]): string | null {
  const term = query
    .trim()
    .toLowerCase()
    .replace(/[(),.%:\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  if (!term || columns.length === 0) return null;
  return columns.map((column) => `${column}.ilike.%${term}%`).join(",");
}
