import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getVariantAvailability: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("../../lib/storefront/catalog", () => ({
  getVariantAvailability: mocks.getVariantAvailability,
}));

import { revalidateCartLines } from "../../app/[locale]/cart/actions";
import type { FreshVariant } from "../../lib/cart/types";

const firstId = "11111111-1111-4111-8111-111111111111";
const secondId = "22222222-2222-4222-8222-222222222222";
const fresh: FreshVariant[] = [
  { variantId: firstId, price: 290, stock: 2, available: true },
  { variantId: secondId, price: 390, stock: 0, available: false },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("revalidateCartLines", () => {
  it("returns server-fetched availability for valid variant ids", async () => {
    mocks.getVariantAvailability.mockResolvedValue(fresh);

    await expect(revalidateCartLines([firstId, secondId])).resolves.toEqual(fresh);
    expect(mocks.getVariantAvailability).toHaveBeenCalledWith([firstId, secondId]);
  });

  it("propagates catalog failures instead of resolving with unverified data", async () => {
    mocks.getVariantAvailability.mockRejectedValue(new Error("db offline"));

    await expect(revalidateCartLines([firstId])).rejects.toThrow("db offline");
  });

  it("rejects more than twenty ids before querying the catalog", async () => {
    const ids = Array.from(
      { length: 21 },
      (_, index) => `00000000-0000-4000-8000-${`${index}`.padStart(12, "0")}`,
    );

    await expect(revalidateCartLines(ids)).rejects.toThrow();
    expect(mocks.getVariantAvailability).not.toHaveBeenCalled();
  });

  it("rejects malformed, empty and duplicated id lists before querying the catalog", async () => {
    await expect(revalidateCartLines(["not-a-uuid"])).rejects.toThrow();
    await expect(revalidateCartLines([])).rejects.toThrow();
    await expect(revalidateCartLines([firstId, firstId])).rejects.toThrow();
    await expect(revalidateCartLines(null as unknown as string[])).rejects.toThrow();
    expect(mocks.getVariantAvailability).not.toHaveBeenCalled();
  });
});
