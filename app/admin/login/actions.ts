"use server";

import { redirect } from "next/navigation";
import { safeNextPath } from "../../../lib/admin/permissions";
import { loginSchema } from "../../../lib/admin/schemas";
import { createClient } from "../../../lib/supabase/server";

export interface LoginResult {
  error: string;
}

/** Signs in a Supabase Auth user and rejects accounts without the admin role. */
export async function signIn(formData: FormData): Promise<LoginResult | void> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Saisissez une adresse e-mail valide et un mot de passe." };
  }

  const next = safeNextPath(formData.get("next")?.toString());
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Identifiants incorrects." };

  const { data: isAdmin, error: roleError } = await supabase.rpc("is_admin");
  if (roleError || isAdmin !== true) {
    await supabase.auth.signOut();
    return { error: "Ce compte n'a pas accès à l'administration." };
  }

  redirect(next);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
