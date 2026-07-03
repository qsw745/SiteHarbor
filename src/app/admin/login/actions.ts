"use server";

import { createAdminSession } from "@/lib/session";
import { verifyAdminLogin } from "@/lib/password";
import { redirect } from "next/navigation";

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

  const loginCheck = await verifyAdminLogin(username, password);
  if (loginCheck === "unconfigured") {
    return { error: "err-password-unconfigured" };
  }

  if (loginCheck !== "valid") {
    return { error: "err-login-invalid" };
  }

  await createAdminSession();
  redirect("/admin/sites");
}
