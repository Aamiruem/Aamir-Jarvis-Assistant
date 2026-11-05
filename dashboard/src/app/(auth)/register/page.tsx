import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: { absolute: "Create your Azarvis account, your AI voice assistant" },
  description: "Create a Azarvis account in a minute and start talking to your AI voice assistant for tasks, reminders and notes.",
  alternates: { canonical: "/register" },
};

export default function RegisterPage() {
  return (
    <>
      <h1 className="mb-1 text-2xl font-bold">Create your account</h1>
      <p className="mb-6 text-sm text-muted-foreground">We&apos;ll email you a code to confirm it&apos;s you.</p>
      <RegisterForm />
    </>
  );
}
