import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";

import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "siteharbor_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const ADMIN_ACCOUNT_ID = "primary";

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters.");
  }
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

async function getSessionVersion() {
  const account = await prisma.adminAccount.findUnique({
    where: { id: ADMIN_ACCOUNT_ID },
    select: { sessionVersion: true },
  });

  return account?.sessionVersion ?? null;
}

async function isValidToken(token: string | undefined) {
  if (!token) return false;
  const [role, version, issuedAt, signature] = token.split(".");
  if (role !== "admin" || !version || !issuedAt || !signature) return false;

  const issuedTime = Number(issuedAt);
  if (!Number.isFinite(issuedTime) || Date.now() - issuedTime > MAX_AGE_SECONDS * 1000) {
    return false;
  }

  const currentVersion = await getSessionVersion();
  if (currentVersion === null || version !== String(currentVersion)) {
    return false;
  }

  const value = `${role}.${version}.${issuedAt}`;
  const expected = sign(value);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);

  return left.length === right.length && timingSafeEqual(left, right);
}

export async function createAdminSession() {
  const sessionVersion = await getSessionVersion();
  if (sessionVersion === null) {
    throw new Error("Admin account is not configured.");
  }

  const issuedAt = Date.now().toString();
  const value = `admin.${sessionVersion}.${issuedAt}`;
  const token = `${value}.${sign(value)}`;
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure:
      process.env.NODE_ENV === "production" &&
      process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://"),
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  return isValidToken(cookieStore.get(COOKIE_NAME)?.value);
}

export async function requireAdmin() {
  const authed = await getAdminSession();
  if (!authed) {
    redirect("/admin/login");
  }
}
