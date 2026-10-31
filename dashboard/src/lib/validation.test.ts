import { describe, expect, it } from "vitest";

import { countSentiment, sentimentBucket } from "@/lib/sentiment";
import { loginSchema, otpSchema, registerSchema, taskSchema } from "@/lib/validation";

describe("Zod schemas", () => {
  it("rejects a bad email on login", () => {
    const r = loginSchema.safeParse({ email: "nope", password: "x" });
    expect(r.success).toBe(false);
  });

  it("applies the server's password policy on register", () => {
    const base = { name: "Aamir", email: "a@example.com", confirm: "" };
    const weak = registerSchema.safeParse({ ...base, password: "short", confirm: "short" });
    expect(weak.success).toBe(false);

    const strong = "Correct-Horse-9-Battery";
    expect(registerSchema.safeParse({ ...base, password: strong, confirm: strong }).success).toBe(true);
  });

  it("requires the confirmation to match", () => {
    const r = registerSchema.safeParse({ name: "Aamir", email: "a@example.com", password: "Correct-Horse-9-Battery", confirm: "different" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path).toEqual(["confirm"]);
  });

  it("accepts only 6-digit codes", () => {
    expect(otpSchema.safeParse({ code: "123456" }).success).toBe(true);
    expect(otpSchema.safeParse({ code: "12345a" }).success).toBe(false);
  });
});

describe("Yup task schema", () => {
  it("needs a title", async () => {
    await expect(taskSchema.validate({ title: "  " })).rejects.toThrow("Give the task a title");
  });

  it("rejects a reminder in the past", async () => {
    await expect(taskSchema.validate({ title: "Call", remindAt: "2001-01-01T10:00" })).rejects.toThrow("future");
  });

  it("accepts a task without a reminder", async () => {
    await expect(taskSchema.validate({ title: "Call" })).resolves.toMatchObject({ title: "Call", remindAt: "" });
  });
});

describe("sentiment buckets", () => {
  it("groups scores around a neutral band", () => {
    expect(sentimentBucket(0.6)).toBe("positive");
    expect(sentimentBucket(-0.3)).toBe("negative");
    expect(sentimentBucket(0.01)).toBe("neutral");
    expect(sentimentBucket(null)).toBe("neutral");
    expect(countSentiment([0.5, -0.5, 0, null])).toEqual({ positive: 1, neutral: 2, negative: 1 });
  });
});
