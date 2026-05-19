"use server";

import { adminPath } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { normalizeSlug } from "@/lib/slug";
import { firstZodError, formString, siteFormSchema } from "@/lib/validation";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseSiteForm(formData: FormData) {
  const name = formString(formData, "name");
  return siteFormSchema.safeParse({
    name,
    slug: normalizeSlug(formString(formData, "slug"), name),
    url: formString(formData, "url"),
    description: formString(formData, "description"),
    iconUrl: formString(formData, "iconUrl"),
    active: formString(formData, "active") || "false",
    sortOrder: formString(formData, "sortOrder") || "0",
    categoryId: formString(formData, "categoryId"),
  });
}

function isUniqueConstraint(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function redirectToSites(params: Record<string, string>): never {
  redirect(adminPath("/admin/sites", params));
}

export async function createSiteAction(formData: FormData) {
  await requireAdmin();
  const parsed = parseSiteForm(formData);
  if (!parsed.success) {
    redirectToSites({ error: firstZodError(parsed.error) });
  }

  try {
    await prisma.site.create({
      data: parsed.data,
    });
  } catch (error) {
    if (isUniqueConstraint(error)) {
      redirectToSites({ error: "站点 Slug 已存在，请换一个。" });
    }
    throw error;
  }

  revalidatePath("/");
  redirectToSites({ ok: "site-created" });
}

export async function updateSiteAction(id: string, formData: FormData) {
  await requireAdmin();
  const parsed = parseSiteForm(formData);
  if (!parsed.success) {
    redirectToSites({ error: firstZodError(parsed.error) });
  }

  try {
    await prisma.site.update({
      where: { id },
      data: parsed.data,
    });
  } catch (error) {
    if (isUniqueConstraint(error)) {
      redirectToSites({ error: "站点 Slug 已存在，请换一个。" });
    }
    throw error;
  }

  revalidatePath("/");
  redirectToSites({ ok: "site-updated" });
}

export async function toggleSiteAction(id: string) {
  await requireAdmin();
  const site = await prisma.site.findUnique({
    where: { id },
    select: { active: true },
  });

  if (!site) {
    redirectToSites({ error: "站点不存在。" });
  }

  await prisma.site.update({
    where: { id },
    data: { active: !site.active },
  });

  revalidatePath("/");
  redirectToSites({ ok: site.active ? "site-disabled" : "site-enabled" });
}

export async function deleteSiteAction(id: string) {
  await requireAdmin();
  await prisma.site.delete({
    where: { id },
  });

  revalidatePath("/");
  redirectToSites({ ok: "site-deleted" });
}
