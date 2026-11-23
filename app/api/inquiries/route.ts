import "server-only";

import { createRateKey } from "@/lib/inquiries/rate-key";
import { inquiryBodySchema } from "@/lib/inquiries/schema";
import { createPublicClient } from "@/lib/supabase/public";

/** node:crypto backs the server-derived rate key. */
export const runtime = "nodejs";

function requestIp(request: Request): string | undefined {
  return request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? undefined;
}

export async function POST(request: Request): Promise<Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  const parsed = inquiryBodySchema.safeParse(payload);
  if (!parsed.success) return new Response(null, { status: 400 });

  try {
    const { data, error } = await createPublicClient().rpc("try_log_inquiry", {
      p_reference: parsed.data.reference,
      p_locale: parsed.data.locale,
      p_message: parsed.data.message,
      p_items: parsed.data.items,
      p_total: parsed.data.total,
      p_customer_phone: "",
      p_key: createRateKey(requestIp(request)),
    });

    if (error) console.error(`[inquiries] ${error.message}`);
    void data;
  } catch (error) {
    console.error("[inquiries] failed to log inquiry", error);
  }

  // Optional side-channel: neither a declined log nor a failure may break checkout.
  return new Response(null, { status: 204 });
}
