// Shapes returned by the Jarvis backend (see docs/API.md in the project root).

export type Role = "user" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

/** A sign-in that is complete. */
export interface SignedIn {
  accessToken: string;
  user: User;
}

/** A sign-in that still needs a one-time code. */
export interface OtpChallenge {
  challengeId: string;
  channel: "email" | "sms";
  maskedDestination: string;
  expiresAt: string;
  resendAvailableAt: string;
  emailVerificationRequired?: boolean;
  mfaRequired?: boolean;
}

export type AuthResult = SignedIn | OtpChallenge;

export const isChallenge = (r: AuthResult): r is OtpChallenge => "challengeId" in r;

export interface Task {
  id: number;
  title: string;
  due: string | null;
  remind_at: string | null;
  done: boolean;
  created_at: string;
}

export interface Memory {
  id: number;
  fact: string;
  created_at: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
}

export interface RecentChat {
  message: string;
  intent: string;
  sentiment: number;
  tools: string[] | string | null;
  latency_ms: number;
  at: string;
}

export interface ChatStats {
  total_messages: number;
  active_users: number;
  by_intent: Record<string, number>;
  avg_latency_ms: number;
  input_tokens: number;
  output_tokens: number;
  recent: RecentChat[];
}

/** One Server-Sent Event from POST /api/chat. */
export type ChatEvent =
  | { type: "conversation"; id: string; title: string }
  | { type: "nlp"; intent: string; confidence: number; sentiment: number; entities: unknown }
  | { type: "text"; text: string }
  | { type: "tool"; name: string; input: unknown; ok: boolean }
  | { type: "error"; message: string }
  | { type: "done"; usage: unknown; tools: string[] };
