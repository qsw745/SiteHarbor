import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const DEDUP_WINDOW_MS = 60_000;
const MAX_MAP_SIZE = 2000;

const recentVisits = new Map<string, number>();

const BOT_PATTERN =
  /bot|spider|crawler|crawl|slurp|bingpreview|facebookexternalhit|whatsapp|telegrambot|twitterbot|linkedinbot|pinterest|preview|monitor|uptime|pingdom|gtmetrix|lighthouse|headlesschrome|phantomjs|curl|wget|python-requests|go-http-client|java\//i;

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const site = await prisma.site.findUnique({
    where: { slug },
    select: { id: true, url: true, active: true },
  });

  if (!site || !site.active) {
    notFound();
  }

  if (await shouldCountVisit(slug)) {
    await prisma.site.update({
      where: { id: site.id },
      data: { clickCount: { increment: 1 } },
    });
  }

  redirect(site.url);
}

async function shouldCountVisit(slug: string): Promise<boolean> {
  const headerList = await headers();

  if (isPrefetch(headerList)) return false;

  const ua = headerList.get("user-agent") ?? "";
  if (!ua || BOT_PATTERN.test(ua)) return false;

  const ip = clientIp(headerList);
  const key = `${ip}:${slug}`;
  const now = Date.now();
  const last = recentVisits.get(key);
  if (last && now - last < DEDUP_WINDOW_MS) return false;

  recentVisits.set(key, now);
  pruneIfLarge(now);
  return true;
}

function isPrefetch(headerList: Headers): boolean {
  const purpose =
    headerList.get("sec-purpose") ??
    headerList.get("purpose") ??
    headerList.get("x-purpose") ??
    headerList.get("x-moz");
  if (purpose && purpose.toLowerCase().includes("prefetch")) return true;
  if (headerList.get("next-router-prefetch")) return true;
  if (headerList.get("x-middleware-prefetch")) return true;
  if (headerList.get("sec-fetch-dest") === "empty" && headerList.get("sec-fetch-mode") === "no-cors") {
    return true;
  }
  return false;
}

function clientIp(headerList: Headers): string {
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headerList.get("x-real-ip") ?? headerList.get("cf-connecting-ip") ?? "unknown";
}

function pruneIfLarge(now: number) {
  if (recentVisits.size <= MAX_MAP_SIZE) return;
  for (const [key, timestamp] of recentVisits) {
    if (now - timestamp > DEDUP_WINDOW_MS) {
      recentVisits.delete(key);
    }
  }
}
