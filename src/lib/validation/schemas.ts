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
    .max(128, "Password is too long"),
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
    .max(128, "Password is too long"),
});
