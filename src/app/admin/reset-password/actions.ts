"use server";

import { resetAdminPasswordWithToken } from "@/lib/password";
import { clearAdminSession } from "@/lib/session";
import { redirect } from "next/navigation";

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

  const result = await resetAdminPasswordWithToken({
    token,
    username,
    password,
    confirmPassword,
  });

  if (result === "valid") {
    await clearAdminSession();
    redirect("/admin/login?ok=password-reset");
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
