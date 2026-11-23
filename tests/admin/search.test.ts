import { describe, expect, it } from "vitest";
import { searchFilter } from "../../lib/admin/search";

describe("searchFilter", () => {
  it("escapes PostgREST filter control characters", () => {
    expect(searchFilter("hoodie, (noir)", "name_fr")).toBe("name_fr.ilike.%hoodie noir%");
  });

  it("combines columns with OR", () => {
    expect(searchFilter("cap", "name_fr", "name_en")).toBe(
      "name_fr.ilike.%cap%,name_en.ilike.%cap%",
    );
  });

  it("returns null for blank input so the query is not filtered", () => {
    expect(searchFilter("   ")).toBeNull();
  });
});
