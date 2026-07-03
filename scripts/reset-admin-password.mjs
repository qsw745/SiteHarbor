import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const ADMIN_ACCOUNT_ID = "primary";
const DEFAULT_ADMIN_USERNAME = "admin";
const MIN_PASSWORD_LENGTH = 12;
const MIN_USERNAME_LENGTH = 3;

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
  let username;
  const passwordArgs = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--generate") continue;
    if (arg === "--username") {
      username = args[index + 1];
      index += 1;
      continue;
    }
    if (arg.startsWith("--username=")) {
      username = arg.slice("--username=".length);
      continue;
    }
    passwordArgs.push(arg);
  }

  const explicitPassword = passwordArgs[0];

  if (explicitPassword && generate) {
    throw new Error("Use either a password argument or --generate, not both.");
  }

  if (passwordArgs.length > 1) {
    throw new Error("Only one password argument is allowed.");
  }

  if (generate) {
    return {
      generated: true,
      password: randomBytes(18).toString("base64url"),
      username,
    };
  }

  if (!explicitPassword) {
    throw new Error(
      'Usage: npm run reset-admin-password -- "<new-password>"\n' +
        "   or: npm run reset-admin-password -- --generate\n" +
        'Optional: add --username "admin"',
    );
  }

  return {
    generated: false,
    password: explicitPassword,
    username,
  };
}

loadDotEnvIfPresent();

const { generated, password, username } = readPasswordArgument();
if (password.length < MIN_PASSWORD_LENGTH) {
  throw new Error(`Admin password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
}

function normalizeUsername(value) {
  return value?.trim();
}

function validateUsername(value) {
  return /^[a-zA-Z0-9._-]+$/.test(value) && value.length >= MIN_USERNAME_LENGTH;
}

const prisma = new PrismaClient();

try {
  const currentAccount = await prisma.adminAccount.findUnique({
    where: { id: ADMIN_ACCOUNT_ID },
    select: { username: true },
  });
  const nextUsername =
    normalizeUsername(username) ||
    currentAccount?.username ||
    normalizeUsername(process.env.ADMIN_USERNAME) ||
    DEFAULT_ADMIN_USERNAME;

  if (!validateUsername(nextUsername)) {
    throw new Error(
      `Admin username must be at least ${MIN_USERNAME_LENGTH} characters and contain only letters, digits, dots, underscores and dashes.`,
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.adminAccount.upsert({
    where: { id: ADMIN_ACCOUNT_ID },
    create: {
      id: ADMIN_ACCOUNT_ID,
      username: nextUsername,
      passwordHash,
    },
    update: {
      username: nextUsername,
      passwordHash,
      resetTokenHash: null,
      resetTokenExpiresAt: null,
      sessionVersion: { increment: 1 },
    },
  });

  console.log("Admin password has been reset in the SiteHarbor database.");
  console.log(`Admin username: ${nextUsername}`);
  if (generated) {
    console.log(`Generated admin password: ${password}`);
  }
} finally {
  await prisma.$disconnect();
}
