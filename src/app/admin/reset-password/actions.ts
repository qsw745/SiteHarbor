"use server";

import { resetAdminPasswordWithToken } from "@/lib/password";
import { clearFailures, clientIpFrom, isRateLimited, registerFailure } from "@/lib/rate-limit";
import { clearAdminSession } from "@/lib/session";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const RESET_FAILURE_LIMIT = 5;
const RESET_FAILURE_WINDOW_MS = 15 * 60 * 1000;

export type ResetPasswordState = {
  error: string;
};

export async function resetPasswordAction(
  _previousState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const token = formData.get("token");
  const username = formData.get("username");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  if (typeof token !== "string" || token.trim().length === 0) {
    return { error: "err-reset-token-required" };
  }

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    typeof confirmPassword !== "string"
  ) {
    return { error: "err-form-invalid" };
  }

  const rateKey = `reset:${clientIpFrom(await headers())}`;
  if (isRateLimited(rateKey, RESET_FAILURE_LIMIT, RESET_FAILURE_WINDOW_MS)) {
    return { error: "err-too-many-attempts" };
  }

  const result = await resetAdminPasswordWithToken({
    token,
    username,
    password,
    confirmPassword,
  });

  if (result === "valid") {
    clearFailures(rateKey);
    await clearAdminSession();
    redirect("/admin/login?ok=password-reset");
  }

  if (result === "invalid" || result === "expired") {
    registerFailure(rateKey, RESET_FAILURE_WINDOW_MS);
  }

  const errors: Record<Exclude<typeof result, "valid">, string> = {
    expired: "err-reset-token-expired",
    invalid: "err-reset-token-invalid",
    "password-mismatch": "err-reset-password-mismatch",
    "password-too-short": "err-reset-password-short",
    unconfigured: "err-password-unconfigured",
    "username-invalid": "err-reset-username-invalid",
  };

  return { error: errors[result] };
}
