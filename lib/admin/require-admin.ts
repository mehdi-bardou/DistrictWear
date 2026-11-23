import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";
import { getAdminIdentity, type AdminIdentity } from "./guard";

/** Guard for every admin page and server action. Redirects non-admins to login. */
export async function requireAdmin(): Promise<AdminIdentity> {
  const identity = await getAdminIdentity(await createClient());
  if (!identity) redirect("/admin/login");
  return identity;
}
