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
import { loginSchema, type LoginValues } from "@/lib/validation";
import { isChallenge, type OtpChallenge } from "@/types/api";

export function LoginForm() {
  const { signIn } = useAuth();
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  useSignedInRedirect();

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setError(null);
    try {
      const result = await authApi.login(email, password);
      if (isChallenge(result)) setChallenge(result);
      else signIn(result);
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  if (challenge) {
    // An account that never confirmed its email is asked to do that instead of the login code.
    const verify = challenge.emailVerificationRequired ? authApi.verifyEmail : authApi.verifyLogin;
    return <OtpForm challenge={challenge} verify={verify} onVerified={signIn} onBack={() => setChallenge(null)} />;
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <FormError message={error} />
      <FormField label="Email" type="email" autoComplete="email" registration={register("email")} error={formState.errors.email} />
      <FormField
        label="Password"
        type="password"
        autoComplete="current-password"
        registration={register("password")}
        error={formState.errors.password}
      />
      <Button type="submit" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/register" className="text-primary underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
