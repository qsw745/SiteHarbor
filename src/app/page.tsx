import { SiteDirectory } from "@/components/SiteDirectory";
import { getActiveDictionary } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import { isSelfSiteUrl } from "@/lib/self-site";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [{ dict, locale }, categories, sites] = await Promise.all([
    getActiveDictionary(),
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
      },
    }),
    prisma.site.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        url: true,
        description: true,
        iconUrl: true,
        clickCount: true,
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    }),
  ]);

  // The portal is not one of the destinations it lists.
  const externalSites = sites.filter((site) => !isSelfSiteUrl(site.url));

  return (
    <SiteDirectory
      dict={dict}
      locale={locale}
      categories={categories}
      sites={externalSites.map((site) => ({
        id: site.id,
        name: site.name,
        slug: site.slug,
        url: site.url,
        description: site.description,
        iconUrl: site.iconUrl,
        clickCount: site.clickCount,
        categoryName: site.category?.name ?? null,
        categorySlug: site.category?.slug ?? null,
      }))}
    />
  );
}
