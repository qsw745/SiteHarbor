import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

const ADMIN_ACCOUNT_ID = "primary";

export type AdminPasswordCheck = "valid" | "invalid" | "unconfigured";

async function seedAdminPasswordFromEnv() {
  const envHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (!envHash) return null;

  try {
    const account = await prisma.adminAccount.create({
      data: {
        id: ADMIN_ACCOUNT_ID,
        passwordHash: envHash,
      },
    });

    return account.passwordHash;
  } catch (error) {
    const account = await prisma.adminAccount.findUnique({
      where: { id: ADMIN_ACCOUNT_ID },
      select: { passwordHash: true },
    });

    if (account?.passwordHash) {
      return account.passwordHash;
    }

    throw error;
  }
}

async function getAdminPasswordHash() {
  const account = await prisma.adminAccount.findUnique({
    where: { id: ADMIN_ACCOUNT_ID },
    select: { passwordHash: true },
  });

  if (account?.passwordHash) {
    return account.passwordHash;
  }

  return seedAdminPasswordFromEnv();
}

export async function verifyAdminPassword(password: string): Promise<AdminPasswordCheck> {
  const hash = await getAdminPasswordHash();
  if (!hash) return "unconfigured";

  try {
    return (await bcrypt.compare(password, hash)) ? "valid" : "invalid";
  } catch {
    return "invalid";
  }
}
