"use client";

// Who is signed in, via React Context. Small, app-wide and rarely changing: exactly what
// Context is good at (frequently changing data like tasks goes to Redux / Zustand instead).
import { createContext, use, useCallback, useEffect, useMemo, useState } from "react";

import { authApi } from "@/lib/api-client";
import { onSessionExpired, setAccessToken } from "@/lib/auth-token";
import type { SignedIn, User } from "@/types/api";

type Status = "loading" | "signed-in" | "signed-out";

interface AuthContextValue {
  status: Status;
  user: User | null;
  signIn: (result: SignedIn) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    onSessionExpired(() => {
      setUser(null);
      setStatus("signed-out");
    });
    authApi.restore().then((restored) => {
      setUser(restored);
      setStatus(restored ? "signed-in" : "signed-out");
    });
  }, []);

  const signIn = useCallback((result: SignedIn) => {
    setAccessToken(result.accessToken);
    setUser(result.user);
    setStatus("signed-in");
  }, []);

  const signOut = useCallback(async () => {
    await authApi.logout();
    setAccessToken(null);
    setUser(null);
    setStatus("signed-out");
  }, []);

  const value = useMemo(() => ({ status, user, signIn, signOut }), [status, user, signIn, signOut]);
  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
