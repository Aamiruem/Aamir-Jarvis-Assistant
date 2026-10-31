// Form validation. Zod drives the auth forms (with React Hook Form); Yup drives the task form,
// so both libraries are shown side by side. The password rules mirror the server's
// backend/express-api/src/auth/PasswordPolicy.js, so users see problems before submitting.
import * as yup from "yup";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const strongPassword = z
  .string()
  .min(12, "At least 12 characters")
  .max(128, "At most 128 characters")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/\d/, "Add a digit")
  .regex(/[^A-Za-z0-9]/, "Add a symbol");

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name").max(80),
    email: z.email("Enter a valid email address"),
    password: strongPassword,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "Passwords don't match", path: ["confirm"] });
export type RegisterValues = z.infer<typeof registerSchema>;

export const otpSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});
export type OtpValues = z.infer<typeof otpSchema>;

export const taskSchema = yup.object({
  title: yup.string().trim().required("Give the task a title").max(200, "Keep it under 200 characters"),
  due: yup.string().default(""),
  remindAt: yup
    .string()
    .default("")
    .test("future", "Pick a time in the future", (v) => !v || new Date(v).getTime() > Date.now()),
});
export type TaskValues = yup.InferType<typeof taskSchema>;

export const memorySchema = z.object({
  fact: z.string().trim().min(3, "Write a short fact").max(500),
});
export type MemoryValues = z.infer<typeof memorySchema>;
