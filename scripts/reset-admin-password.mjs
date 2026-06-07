import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const ADMIN_ACCOUNT_ID = "primary";
const MIN_PASSWORD_LENGTH = 12;

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

function readPasswordArgument() {
  const args = process.argv.slice(2);
  const generate = args.includes("--generate");
  const explicitPassword = args.find((arg) => arg !== "--generate");

  if (explicitPassword && generate) {
    throw new Error("Use either a password argument or --generate, not both.");
  }

  if (generate) {
    return {
      generated: true,
      password: randomBytes(18).toString("base64url"),
    };
  }

  if (!explicitPassword) {
    throw new Error(
      'Usage: npm run reset-admin-password -- "<new-password>"\n' +
        "   or: npm run reset-admin-password -- --generate",
    );
  }

  return {
    generated: false,
    password: explicitPassword,
  };
}

loadDotEnvIfPresent();

const { generated, password } = readPasswordArgument();
if (password.length < MIN_PASSWORD_LENGTH) {
  throw new Error(`Admin password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
}

const prisma = new PrismaClient();

try {
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.adminAccount.upsert({
    where: { id: ADMIN_ACCOUNT_ID },
    create: {
      id: ADMIN_ACCOUNT_ID,
      passwordHash,
    },
    update: {
      passwordHash,
    },
  });

  console.log("Admin password has been reset in the SiteHarbor database.");
  if (generated) {
    console.log(`Generated admin password: ${password}`);
  }
} finally {
  await prisma.$disconnect();
}
