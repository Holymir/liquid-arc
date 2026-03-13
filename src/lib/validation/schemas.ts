import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .email("Invalid email format"),
  password: z
    .string()
    .min(1, "Password is required"),
});

const evmAddressRegex = /^0x[a-fA-F0-9]{40}$/;
const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export const addWalletSchema = z.object({
  address: z
    .string()
    .trim()
    .refine(
      (addr) => evmAddressRegex.test(addr) || solanaAddressRegex.test(addr),
      "Invalid wallet address (EVM or Solana)"
    ),
  label: z
    .string()
    .trim()
    .max(50, "Label is too long")
    .optional(),
});

export function detectChainType(address: string): "evm" | "svm" {
  return evmAddressRegex.test(address) ? "evm" : "svm";
}

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .email("Invalid email format"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export const createAlertSchema = z.object({
  type: z.enum(["out_of_range", "price_change", "il_threshold", "fees_earned"]),
  config: z.record(z.unknown()),
  channel: z.enum(["email", "webhook"]).default("email"),
});

export const updateAlertSchema = z.object({
  isActive: z.boolean().optional(),
  config: z.record(z.unknown()).optional(),
  channel: z.enum(["email", "webhook"]).optional(),
});
