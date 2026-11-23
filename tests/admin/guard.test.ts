import { describe, expect, it, vi } from "vitest";
import { getAdminIdentity, type AdminIdentityClient } from "../../lib/admin/guard";

function fakeClient({
  user = { id: "11111111-1111-1111-1111-111111111111", email: "owner@example.com" },
  userError = null,
  isAdmin = true,
  roleError = null,
}: {
  user?: { id: string; email?: string } | null;
  userError?: { message: string } | null;
  isAdmin?: boolean | null;
  roleError?: { message: string } | null;
} = {}): AdminIdentityClient {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: userError }),
    },
    rpc: vi.fn().mockResolvedValue({ data: isAdmin, error: roleError }),
  };
}

describe("getAdminIdentity", () => {
  it("returns the signed-in admin identity", async () => {
    await expect(getAdminIdentity(fakeClient())).resolves.toEqual({
      id: "11111111-1111-1111-1111-111111111111",
      email: "owner@example.com",
    });
  });

  it("returns null when there is no authenticated user", async () => {
    await expect(getAdminIdentity(fakeClient({ user: null }))).resolves.toBeNull();
  });

  it("returns null when the session lookup fails", async () => {
    await expect(
      getAdminIdentity(fakeClient({ userError: { message: "expired" } })),
    ).resolves.toBeNull();
  });

  it("returns null for a signed-in non-admin user", async () => {
    await expect(getAdminIdentity(fakeClient({ isAdmin: false }))).resolves.toBeNull();
  });

  it("returns null when the database role check fails", async () => {
    await expect(
      getAdminIdentity(fakeClient({ roleError: { message: "rpc failed" } })),
    ).resolves.toBeNull();
  });
});
