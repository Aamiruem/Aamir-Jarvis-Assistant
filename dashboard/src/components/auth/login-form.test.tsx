import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/components/auth/login-form";
import { authApi } from "@/lib/api-client";

const signIn = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));
vi.mock("@/context/auth-context", () => ({ useAuth: () => ({ status: "signed-out", user: null, signIn, signOut: vi.fn() }) }));
vi.mock("@/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-client")>();
  return { ...actual, authApi: { ...actual.authApi, login: vi.fn(), verifyLogin: vi.fn() } };
});

describe("<LoginForm />", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows validation errors without calling the API", async () => {
    render(<LoginForm />);
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(screen.getByText("Enter your password")).toBeInTheDocument();
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it("asks for the one-time code, then signs in", async () => {
    const user = { id: "u1", name: "Aamir", email: "a@example.com", role: "user" as const, emailVerified: true };
    vi.mocked(authApi.login).mockResolvedValue({
      challengeId: "c1",
      channel: "email",
      maskedDestination: "a***@example.com",
      expiresAt: new Date(Date.now() + 300_000).toISOString(),
      resendAvailableAt: new Date(Date.now() + 60_000).toISOString(),
      mfaRequired: true,
    });
    vi.mocked(authApi.verifyLogin).mockResolvedValue({ accessToken: "token", user });

    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText("Email"), "a@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "Correct-Horse-9-Battery");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("a***@example.com")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("One-time code"), "123456");
    await userEvent.click(screen.getByRole("button", { name: "Verify" }));

    expect(authApi.verifyLogin).toHaveBeenCalledWith("c1", "123456");
    expect(signIn).toHaveBeenCalledWith({ accessToken: "token", user });
  });
});
