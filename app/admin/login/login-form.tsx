"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../../components/admin/ui/button";
import { Input } from "../../../components/admin/ui/input";
import { Label } from "../../../components/admin/ui/label";
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
      <div className="grid gap-2">
        <Label htmlFor="admin-email">Adresse e-mail</Label>
        <Input
          id="admin-email"
          {...register("email")}
          type="email"
          autoComplete="username"
          aria-invalid={Boolean(errors.email)}
        />
        {errors.email && <span className="text-forest-800 text-xs">{errors.email.message}</span>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="admin-password">Mot de passe</Label>
        <Input
          id="admin-password"
          {...register("password")}
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
        />
        {errors.password && (
          <span className="text-forest-800 text-xs">{errors.password.message}</span>
        )}
      </div>

      {serverError && (
        <p role="alert" className="bg-forest-100 text-forest-950 rounded-md px-3 py-2 text-sm">
          {serverError}
        </p>
      )}

      <Button type="submit" disabled={pending} className="py-3">
        {pending ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
