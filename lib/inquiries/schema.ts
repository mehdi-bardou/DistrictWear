import { z } from "zod";

/**
 * Exact cart snapshot the browser may send alongside a WhatsApp inquiry.
 * Strict objects keep rate-limit keys, phone numbers and status out of the body.
 */
export const inquiryBodySchema = z.strictObject({
  reference: z.string().regex(/^[A-Za-z0-9-]{1,40}$/),
  locale: z.enum(["fr", "ar", "en"]),
  message: z.string().min(1).max(4000),
  items: z
    .array(
      z.strictObject({
        nameFr: z.string().min(1).max(200),
        color: z.string().min(1).max(100),
        size: z.string().min(1).max(10),
        quantity: z.number().int().min(1).max(99),
        price: z.number().min(0),
      }),
    )
    .max(20),
  total: z.number().min(0).max(1_000_000),
});

export type InquiryBody = z.infer<typeof inquiryBodySchema>;
