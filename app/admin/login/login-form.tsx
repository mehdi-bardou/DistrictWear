"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { loginSchema, type LoginInput } from "../../../lib/admin/schemas";
import { signIn } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: LoginInput) => {
    setServerError(null);
    const formData = new FormData();
    formData.set("email", values.email);
    formData.set("password", values.password);
    formData.set("next", next);
    startTransition(async () => {
      const result = await signIn(formData);
      if (result?.error) setServerError(result.error);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5" noValidate>
      <label className="grid gap-2 text-sm font-medium">
        Adresse e-mail
        <input
          {...register("email")}
          type="email"
          autoComplete="username"
          className="bg-cream-50 text-ink-900 focus-visible:border-forest-700 rounded-md border px-3 py-2.5 outline-none"
          aria-invalid={Boolean(errors.email)}
        />
        {errors.email && <span className="text-forest-800 text-xs">{errors.email.message}</span>}
      </label>

      <label className="grid gap-2 text-sm font-medium">
        Mot de passe
        <input
          {...register("password")}
          type="password"
          autoComplete="current-password"
          className="bg-cream-50 text-ink-900 focus-visible:border-forest-700 rounded-md border px-3 py-2.5 outline-none"
          aria-invalid={Boolean(errors.password)}
        />
        {errors.password && (
          <span className="text-forest-800 text-xs">{errors.password.message}</span>
        )}
      </label>

      {serverError && (
        <p role="alert" className="bg-forest-100 text-forest-950 rounded-md px-3 py-2 text-sm">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-forest-900 text-cream-100 rounded-md px-4 py-3 font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
