import { z } from "zod";
import { Role } from "./role";

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
