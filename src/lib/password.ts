import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

const ADMIN_ACCOUNT_ID = "primary";
export const DEFAULT_ADMIN_USERNAME = "admin";
export const MIN_ADMIN_PASSWORD_LENGTH = 12;
export const MIN_ADMIN_USERNAME_LENGTH = 3;

export type AdminLoginCheck = "valid" | "invalid" | "unconfigured";
export type AdminResetResult =
  | "valid"
  | "invalid"
  | "expired"
  | "password-too-short"
  | "username-invalid"
  | "password-mismatch"
  | "unconfigured";

export function normalizeAdminUsername(username: string) {
  return username.trim();
}

export function isValidAdminUsername(username: string) {
  return /^[a-zA-Z0-9._-]+$/.test(username) && username.length >= MIN_ADMIN_USERNAME_LENGTH;
}

async function seedAdminPasswordFromEnv() {
  const envHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (!envHash) return null;

  try {
    const account = await prisma.adminAccount.create({
      data: {
        id: ADMIN_ACCOUNT_ID,
        username: process.env.ADMIN_USERNAME?.trim() || DEFAULT_ADMIN_USERNAME,
        passwordHash: envHash,
      },
    });

    return account;
  } catch (error) {
    const account = await prisma.adminAccount.findUnique({
      where: { id: ADMIN_ACCOUNT_ID },
      select: { username: true, passwordHash: true },
    });

    if (account?.passwordHash) {
      return account;
    }

    throw error;
  }
}

async function getAdminAccount() {
  const account = await prisma.adminAccount.findUnique({
    where: { id: ADMIN_ACCOUNT_ID },
    select: {
      username: true,
      passwordHash: true,
    },
  });

  if (account?.passwordHash) {
    return account;
  }

  return seedAdminPasswordFromEnv();
}

export async function verifyAdminLogin(
  username: string,
  password: string,
): Promise<AdminLoginCheck> {
  const account = await getAdminAccount();
  if (!account?.passwordHash) return "unconfigured";

  if (normalizeAdminUsername(username) !== account.username) {
    return "invalid";
  }

  try {
    return (await bcrypt.compare(password, account.passwordHash)) ? "valid" : "invalid";
  } catch {
    return "invalid";
  }
}

export async function resetAdminPasswordWithToken({
  token,
  username,
  password,
  confirmPassword,
}: {
  token: string;
  username: string;
  password: string;
  confirmPassword: string;
}): Promise<AdminResetResult> {
  const normalizedUsername = normalizeAdminUsername(username);
  const normalizedToken = token.trim();

  if (!normalizedToken) return "invalid";
  if (!isValidAdminUsername(normalizedUsername)) return "username-invalid";
  if (password.length < MIN_ADMIN_PASSWORD_LENGTH) return "password-too-short";
  if (password !== confirmPassword) return "password-mismatch";

  const account = await prisma.adminAccount.findUnique({
    where: { id: ADMIN_ACCOUNT_ID },
    select: {
      resetTokenHash: true,
      resetTokenExpiresAt: true,
    },
  });

  if (!account) return "unconfigured";
  if (!account.resetTokenHash || !account.resetTokenExpiresAt) return "invalid";
  if (account.resetTokenExpiresAt.getTime() < Date.now()) return "expired";

  const tokenMatches = await bcrypt.compare(normalizedToken, account.resetTokenHash);
  if (!tokenMatches) return "invalid";

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.adminAccount.update({
    where: { id: ADMIN_ACCOUNT_ID },
    data: {
      username: normalizedUsername,
      passwordHash,
      resetTokenHash: null,
      resetTokenExpiresAt: null,
      sessionVersion: { increment: 1 },
    },
  });

  return "valid";
}
