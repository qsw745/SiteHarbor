"use server";

import { adminPath } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { discoverServerSites } from "@/lib/site-discovery";
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
      redirectToSites({ error: "err-slug-taken" });
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
      redirectToSites({ error: "err-slug-taken" });
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
    redirectToSites({ error: "err-site-not-found" });
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

export async function syncDiscoveredSitesAction() {
  await requireAdmin();
  const discoveredSites = await discoverServerSites();

  if (!discoveredSites.length) {
    redirectToSites({ error: "err-discovery-empty" });
  }

  const category = await prisma.category.upsert({
    where: { slug: "products" },
    update: { name: "产品网站" },
    create: {
      name: "产品网站",
      slug: "products",
      sortOrder: 0,
    },
  });

  const existingSites = await prisma.site.findMany({
    select: {
      categoryId: true,
      description: true,
      iconUrl: true,
      id: true,
      slug: true,
      url: true,
    },
  });
  const existingByUrl = new Map(existingSites.map((site) => [canonicalUrl(site.url), site]));
  const usedSlugs = new Set(existingSites.map((site) => site.slug));
  let created = 0;
  let updated = 0;

  for (const discovered of discoveredSites) {
    const existing = existingByUrl.get(canonicalUrl(discovered.url));

    if (existing) {
      const updateData: Prisma.SiteUpdateInput = {
        active: true,
        category: { connect: { id: category.id } },
      };

      if (!existing.description) updateData.description = discovered.description;
      if (!existing.iconUrl) updateData.iconUrl = discovered.iconUrl;

      await prisma.site.update({
        where: { id: existing.id },
        data: updateData,
      });
      updated += 1;
      continue;
    }

    const slug = nextAvailableSlug(discovered.slug, usedSlugs);
    usedSlugs.add(slug);

    await prisma.site.create({
      data: {
        active: true,
        categoryId: category.id,
        description: discovered.description,
        iconUrl: discovered.iconUrl,
        name: discovered.name,
        slug,
        sortOrder: discovered.sortOrder,
        url: discovered.url,
      },
    });
    created += 1;
  }

  revalidatePath("/");
  redirectToSites({
    ok: "discovery-synced",
    created: String(created),
    updated: String(updated),
  });
}

function canonicalUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = "";
    url.search = "";
    url.pathname = url.pathname === "/" ? "/" : `${url.pathname.replace(/\/+$/, "")}/`;
    return url.toString();
  } catch {
    return value.replace(/\/+$/, "");
  }
}

function nextAvailableSlug(baseSlug: string, usedSlugs: Set<string>) {
  const base = baseSlug || normalizeSlug("", "site");
  let slug = base;
  let index = 2;
  while (usedSlugs.has(slug)) {
    slug = `${base}-${index}`;
    index += 1;
  }
  return slug;
}
