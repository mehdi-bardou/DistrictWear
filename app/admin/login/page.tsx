import { redirect } from "next/navigation";
import { safeNextPath } from "../../../lib/admin/permissions";
import { getAdminIdentity } from "../../../lib/admin/guard";
import { createClient } from "../../../lib/supabase/server";
import { LoginForm } from "./login-form";

export const metadata = { title: "Connexion — District Wear" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next: requestedNext } = await searchParams;
  const next = safeNextPath(requestedNext);
  const identity = await getAdminIdentity(await createClient());
  if (identity) redirect(next);

  return (
    <main className="grid min-h-dvh place-items-center px-5 py-12">
      <div className="bg-cream-50 w-full max-w-md rounded-xl border p-8 shadow-sm">
        <p className="font-display text-forest-700 text-sm tracking-widest uppercase">
          District Wear
        </p>
        <h1 className="display-lg text-forest-950 mt-3">Administration</h1>
        <p className="text-ink-700 mt-2 text-sm">
          Réservé à l&apos;équipe boutique. Aucune inscription publique.
        </p>
        <div className="mt-8">
          <LoginForm next={next} />
        </div>
      </div>
    </main>
  );
}
