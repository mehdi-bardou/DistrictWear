"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { saveSettings } from "../../app/admin/actions";
import { settingsSchema, type SettingsForm, type SettingsInput } from "../../lib/admin/schemas";
import type { Settings } from "../../lib/supabase/database.types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";

export function SettingsForm({ settings }: { settings?: Settings }) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingsForm, unknown, SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      whatsapp_number: settings?.whatsapp_number ?? "",
      contact_email: settings?.contact_email ?? "",
      instagram_url: settings?.instagram_url ?? "",
      inquiry_logging_enabled: settings?.inquiry_logging_enabled ?? false,
    },
  });

  const onSubmit = (values: SettingsInput) => {
    startTransition(async () => {
      const result = await saveSettings(values);
      if (!result.ok) {
        toast.error(result.error ?? "Enregistrement impossible.");
        return;
      }
      toast.success("Paramètres enregistrés.");
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 grid max-w-2xl gap-5" noValidate>
      <div className="grid gap-2">
        <Label htmlFor="s-whatsapp">Numéro WhatsApp boutique</Label>
        <Input
          id="s-whatsapp"
          inputMode="tel"
          {...register("whatsapp_number")}
          placeholder="212721919977"
        />
        <p className="text-ink-700 text-xs">
          Chiffres uniquement, indicatif pays inclus. Préfixe automatique pour les liens wa.me.
        </p>
        {errors.whatsapp_number && (
          <span className="text-forest-800 text-xs">{errors.whatsapp_number.message}</span>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="s-email">E-mail de contact</Label>
        <Input id="s-email" type="email" {...register("contact_email")} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="s-instagram">URL Instagram</Label>
        <Input id="s-instagram" type="url" {...register("instagram_url")} />
      </div>
      <label className="flex items-start gap-3 text-sm">
        <Controller
          control={control}
          name="inquiry_logging_enabled"
          render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
        />
        <span>
          Journaliser les demandes
          <span className="text-ink-700 mt-1 block text-xs">
            Enregistre une copie de chaque commande envoyée. Désactivé par défaut.
          </span>
        </span>
      </label>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer les paramètres"}
        </Button>
      </div>
    </form>
  );
}
