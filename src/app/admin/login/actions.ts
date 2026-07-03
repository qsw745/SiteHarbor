"use server";

import { verifyAdminLogin } from "@/lib/password";
import { clearFailures, clientIpFrom, isRateLimited, registerFailure } from "@/lib/rate-limit";
import { createAdminSession } from "@/lib/session";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const LOGIN_FAILURE_LIMIT = 10;
const LOGIN_FAILURE_WINDOW_MS = 15 * 60 * 1000;

export type LoginState = {
  error: string;
};

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = formData.get("username");
  const password = formData.get("password");

  if (typeof username !== "string" || username.trim().length === 0) {
    return { error: "err-username-required" };
  }

  if (typeof password !== "string" || password.length === 0) {
    return { error: "err-password-required" };
  }

  const rateKey = `login:${clientIpFrom(await headers())}`;
  if (isRateLimited(rateKey, LOGIN_FAILURE_LIMIT, LOGIN_FAILURE_WINDOW_MS)) {
    return { error: "err-too-many-attempts" };
  }

  const loginCheck = await verifyAdminLogin(username, password);
  if (loginCheck === "unconfigured") {
    return { error: "err-password-unconfigured" };
  }

  if (loginCheck !== "valid") {
    registerFailure(rateKey, LOGIN_FAILURE_WINDOW_MS);
    return { error: "err-login-invalid" };
  }

  clearFailures(rateKey);
  await createAdminSession();
  redirect("/admin/sites");
}
