import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const site = await prisma.site.findUnique({
    where: { slug },
    select: {
      id: true,
      url: true,
      active: true,
    },
  });

  if (!site || !site.active) {
    notFound();
  }

  await prisma.site.update({
    where: { id: site.id },
    data: {
      clickCount: {
        increment: 1,
      },
    },
  });

  redirect(site.url);
}
