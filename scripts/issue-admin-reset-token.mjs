import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const ADMIN_ACCOUNT_ID = "primary";
const EXPIRES_IN_MINUTES = 30;

function parseEnvValue(rawValue) {
  let value = rawValue.trim();

  if (
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('"') && value.endsWith('"'))
  ) {
    value = value.slice(1, -1);
  }

  return value;
}

function loadDotEnvIfPresent() {
  if (!existsSync(".env")) return;

  const lines = readFileSync(".env", "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    if (process.env[key] !== undefined) continue;

    process.env[key] = parseEnvValue(trimmed.slice(separatorIndex + 1));
  }
}

loadDotEnvIfPresent();

const prisma = new PrismaClient();

try {
  const account = await prisma.adminAccount.findUnique({
    where: { id: ADMIN_ACCOUNT_ID },
    select: { id: true },
  });

  if (!account) {
    throw new Error(
      "Admin account is not configured yet. Run reset-admin-password first to create it.",
    );
  }

  const token = randomBytes(32).toString("base64url");
  const resetTokenHash = await bcrypt.hash(token, 12);
  const resetTokenExpiresAt = new Date(Date.now() + EXPIRES_IN_MINUTES * 60 * 1000);

  await prisma.adminAccount.update({
    where: { id: ADMIN_ACCOUNT_ID },
    data: {
      resetTokenHash,
      resetTokenExpiresAt,
    },
  });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://qisw.top").replace(/\/+$/, "");
  console.log(`Admin reset token expires in ${EXPIRES_IN_MINUTES} minutes.`);
  console.log(`Reset token: ${token}`);
  console.log(`Reset URL: ${appUrl}/admin/reset-password?token=${encodeURIComponent(token)}`);
} finally {
  await prisma.$disconnect();
}
