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
    return { error: "请输入管理员密码。" };
  }

  const valid = await verifyAdminPassword(password);
  if (!valid) {
    return { error: "密码不正确，或服务器还没有配置 ADMIN_PASSWORD_HASH。" };
  }

  await createAdminSession();
  redirect("/admin/sites");
}
