import "server-only";

import { createPublicClient } from "../supabase/public";

export type StoreSettings = {
  whatsappNumber: string;
  contactEmail: string | null;
  instagramUrl: string | null;
  inquiryLoggingEnabled: boolean;
};

const PHONE_PATTERN = /^\d{8,15}$/;

function validPhone(value: string | null | undefined): string {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  return PHONE_PATTERN.test(digits) ? digits : "";
}

/** Public, anon-key read of the singleton settings row; the env var is only a fallback. */
export async function getStoreSettings(): Promise<StoreSettings> {
  const fallback = validPhone(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER);
  const fallbackSettings: StoreSettings = {
    whatsappNumber: fallback,
    contactEmail: null,
    instagramUrl: null,
    inquiryLoggingEnabled: false,
  };

  try {
    const client = await createPublicClient();
    const { data, error } = await client.from("settings").select("*").eq("id", true).limit(1);
    if (error) {
      console.error(`[storefront] settings: ${error.message}`);
      return fallbackSettings;
    }

    const row = Array.isArray(data) ? data[0] : undefined;
    if (!row) return fallbackSettings;

    return {
      whatsappNumber: validPhone(row.whatsapp_number) || fallback,
      contactEmail: row.contact_email,
      instagramUrl: row.instagram_url,
      inquiryLoggingEnabled: row.inquiry_logging_enabled,
    };
  } catch (error) {
    console.error("[storefront] Supabase client error", error);
    return fallbackSettings;
  }
}
