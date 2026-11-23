import { z } from "zod";

/** Shared between client forms and server actions so validation cannot drift. */

export const loginSchema = z.object({
  email: z.string().trim().min(1).email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
