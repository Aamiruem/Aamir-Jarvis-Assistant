"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { FormError, FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { authApi, errorMessage } from "@/lib/api-client";
import { otpSchema, type OtpValues } from "@/lib/validation";
import type { OtpChallenge, SignedIn } from "@/types/api";

interface OtpFormProps {
  challenge: OtpChallenge;
  verify: (challengeId: string, code: string) => Promise<SignedIn>;
  onVerified: (result: SignedIn) => void;
  onBack: () => void;
}

const secondsUntil = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 1000));

export function OtpForm({ challenge: initial, verify, onVerified, onBack }: OtpFormProps) {
  const [challenge, setChallenge] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [wait, setWait] = useState(() => secondsUntil(initial.resendAvailableAt));
  const { register, handleSubmit, formState } = useForm<OtpValues>({ resolver: zodResolver(otpSchema) });

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait(secondsUntil(challenge.resendAvailableAt)), 1000);
    return () => clearTimeout(timer);
  }, [wait, challenge.resendAvailableAt]);

  const onSubmit = handleSubmit(async ({ code }) => {
    setError(null);
    try {
      onVerified(await verify(challenge.challengeId, code));
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  const resend = async () => {
    setError(null);
    try {
      const next = (await authApi.resendOtp(challenge.challengeId)) as OtpChallenge;
      setChallenge({ ...challenge, ...next });
      setWait(secondsUntil(next.resendAvailableAt));
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <p className="text-sm text-muted-foreground">
        We sent a 6-digit code by {challenge.channel} to <strong className="text-foreground">{challenge.maskedDestination}</strong>.
      </p>
      <FormError message={error} />
      <FormField
        label="One-time code"
        registration={register("code")}
        error={formState.errors.code}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        autoFocus
      />
      <Button type="submit" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? "Checking…" : "Verify"}
      </Button>
      <div className="flex justify-between text-sm">
        <Button type="button" variant="link" className="px-0" onClick={onBack}>
          Back
        </Button>
        <Button type="button" variant="link" className="px-0" disabled={wait > 0} onClick={resend}>
          {wait > 0 ? `Resend in ${wait}s` : "Resend code"}
        </Button>
      </div>
    </form>
  );
}
