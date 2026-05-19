"use server";

import { clearAdminSession } from "@/lib/session";
import { redirect } from "next/navigation";

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}
