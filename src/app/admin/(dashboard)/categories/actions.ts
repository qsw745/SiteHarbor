"use server";

import { adminPath } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { normalizeSlug } from "@/lib/slug";
import { categoryFormSchema, firstZodError, formString } from "@/lib/validation";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseCategoryForm(formData: FormData) {
  const name = formString(formData, "name");
  return categoryFormSchema.safeParse({
    name,
    slug: normalizeSlug(formString(formData, "slug"), name),
    sortOrder: formString(formData, "sortOrder") || "0",
  });
}

function isUniqueConstraint(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function redirectToCategories(params: Record<string, string>): never {
  redirect(adminPath("/admin/categories", params));
}

export async function createCategoryAction(formData: FormData) {
  await requireAdmin();
  const parsed = parseCategoryForm(formData);
  if (!parsed.success) {
    redirectToCategories({ error: firstZodError(parsed.error) });
  }

  try {
    await prisma.category.create({
      data: parsed.data,
    });
  } catch (error) {
    if (isUniqueConstraint(error)) {
      redirectToCategories({ error: "err-category-conflict" });
    }
    throw error;
  }

  revalidatePath("/");
  redirectToCategories({ ok: "category-created" });
}

export async function updateCategoryAction(id: string, formData: FormData) {
  await requireAdmin();
  const parsed = parseCategoryForm(formData);
  if (!parsed.success) {
    redirectToCategories({ error: firstZodError(parsed.error) });
  }

  try {
    await prisma.category.update({
      where: { id },
      data: parsed.data,
    });
  } catch (error) {
    if (isUniqueConstraint(error)) {
      redirectToCategories({ error: "err-category-conflict" });
    }
    throw error;
  }

  revalidatePath("/");
  redirectToCategories({ ok: "category-updated" });
}

export async function deleteCategoryAction(id: string) {
  await requireAdmin();
  await prisma.category.delete({
    where: { id },
  });

  revalidatePath("/");
  redirectToCategories({ ok: "category-deleted" });
}
