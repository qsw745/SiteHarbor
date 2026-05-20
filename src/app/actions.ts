"use server";

import { LOCALE_COOKIE, resolveLocale } from "@/lib/i18n";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function setLocaleAction(formData: FormData) {
  const locale = resolveLocale(formData.get("locale") as string | null);
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  // Refresh both the public and admin trees so server-rendered text re-emits.
  revalidatePath("/", "layout");
}
