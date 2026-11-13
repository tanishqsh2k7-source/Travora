import { z } from "zod";

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type User = z.infer<typeof UserSchema>;

export const RegisterRequestSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).toLowerCase().trim(),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  name: z.string().min(1, { message: "Name cannot be empty" }).trim().optional(),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).toLowerCase().trim(),
  password: z.string().min(1, { message: "Password is required" }),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AuthUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
});

export type AuthUser = z.infer<typeof AuthUserSchema>;

export const AuthResponseSchema = z.object({
  token: z.string(),
  user: AuthUserSchema,
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;
