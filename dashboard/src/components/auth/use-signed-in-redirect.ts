"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/context/auth-context";

/** Sends a signed-in visitor of /login or /register on to the dashboard. */
export function useSignedInRedirect() {
  const { status } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (status === "signed-in") router.replace("/dashboard");
  }, [status, router]);
}
