import { SiteDirectory } from "@/components/SiteDirectory";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, sites] = await Promise.all([
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

  return (
    <SiteDirectory
      categories={categories}
      sites={sites.map((site) => ({
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
