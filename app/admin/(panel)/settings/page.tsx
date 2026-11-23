import { PageHeader } from "../../../../components/admin/page-header";
import { SettingsForm } from "../../../../components/admin/settings-form";
import { createClient } from "../../../../lib/supabase/server";

export const metadata = { title: "Paramètres — District Wear" };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("settings").select("*").eq("id", true).single();

  return (
    <div>
      <PageHeader
        eyebrow="Boutique"
        title="Paramètres"
        description="Coordonnées utilisées par la boutique et par le message WhatsApp."
      />
      {!settings && (
        <p className="border-forest-200 bg-cream-50 text-forest-900 mt-6 rounded-xl border p-4 text-sm">
          La ligne de configuration est absente. Réappliquez le seed avant d&apos;enregistrer.
        </p>
      )}
      <SettingsForm settings={settings ?? undefined} />
    </div>
  );
}
