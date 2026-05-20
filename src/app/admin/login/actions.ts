"use server";

import { createAdminSession } from "@/lib/session";
import { verifyAdminPassword } from "@/lib/password";
import { redirect } from "next/navigation";

export type LoginState = {
  error: string;
};

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = formData.get("password");

  if (typeof password !== "string" || password.length === 0) {
    return { error: "err-password-required" };
  }

  const valid = await verifyAdminPassword(password);
  if (!valid) {
    return { error: "err-password-invalid" };
  }

  await createAdminSession();
  redirect("/admin/sites");
}
