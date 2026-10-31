"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { OtpForm } from "@/components/auth/otp-form";
import { useSignedInRedirect } from "@/components/auth/use-signed-in-redirect";
import { FormError, FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { authApi, errorMessage } from "@/lib/api-client";
import { registerSchema, type RegisterValues } from "@/lib/validation";
import { isChallenge, type OtpChallenge } from "@/types/api";

export function RegisterForm() {
  const { signIn } = useAuth();
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
  });
  useSignedInRedirect();

  const onSubmit = handleSubmit(async ({ name, email, password }) => {
    setError(null);
    try {
      const result = await authApi.register(name, email, password);
      if (isChallenge(result)) setChallenge(result);
      else signIn(result);
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  if (challenge) {
    return <OtpForm challenge={challenge} verify={authApi.verifyEmail} onVerified={signIn} onBack={() => setChallenge(null)} />;
  }

  const { errors } = formState;
  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <FormError message={error} />
      <FormField label="Name" autoComplete="name" registration={register("name")} error={errors.name} />
      <FormField label="Email" type="email" autoComplete="email" registration={register("email")} error={errors.email} />
      <FormField
        label="Password"
        type="password"
        autoComplete="new-password"
        registration={register("password")}
        error={errors.password}
        hint="12+ characters with upper and lower case, a digit and a symbol"
      />
      <FormField
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        registration={register("confirm")}
        error={errors.confirm}
      />
      <Button type="submit" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
