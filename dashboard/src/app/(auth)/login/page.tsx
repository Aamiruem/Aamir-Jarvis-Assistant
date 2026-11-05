import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: { absolute: "Sign in to Jarvis, your AI voice assistant" },
  description: "Sign in to Jarvis, your personal AI voice assistant, with your email, your password and a one-time code.",
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-1 text-2xl font-bold">Sign in</h1>
      <p className="mb-6 text-sm text-muted-foreground">Welcome back. Jarvis has been expecting you.</p>
      <LoginForm />
    </>
  );
}
