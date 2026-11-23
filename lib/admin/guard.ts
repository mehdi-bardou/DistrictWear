/** Pure admin identity check. The external Supabase boundary is supplied by the caller. */

export interface AdminIdentityClient {
  auth: {
    getUser(): Promise<{
      data: { user: { id: string; email?: string } | null };
      error: { message: string } | null;
    }>;
  };
  // Supabase's builder is thenable, not a native Promise.
  rpc(functionName: "is_admin"): PromiseLike<{
    data: boolean | null;
    error: { message: string } | null;
  }>;
}

export interface AdminIdentity {
  id: string;
  email: string;
}

/**
 * A valid session is not enough: the database role check is authoritative and
 * is enforced again by RLS on every catalogue write.
 */
export async function getAdminIdentity(client: AdminIdentityClient): Promise<AdminIdentity | null> {
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();
  if (userError || !user) return null;

  const { data: isAdmin, error: roleError } = await client.rpc("is_admin");
  if (roleError || isAdmin !== true) return null;

  return { id: user.id, email: user.email ?? "" };
}
