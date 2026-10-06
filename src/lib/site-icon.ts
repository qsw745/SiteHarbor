const FETCH_TIMEOUT_MS = 6000;
const MAX_HTML_BYTES = 512 * 1024;
const MAX_CANDIDATES = 10;
const DEFAULT_CONCURRENCY = 4;
const FALLBACK_ICON_NAMES = ["favicon.ico", "favicon.svg", "favicon.png"];
// Icons are shown at up to 72px (144 device pixels); anything smaller turns to mush.
const MIN_SHARP_ICON_PX = 96;
const IMAGE_EXTENSION = /\.(ico|png|svg|jpe?g|webp|gif|avif)$/i;
const OPAQUE_CONTENT_TYPES = new Set(["", "application/octet-stream", "binary/octet-stream"]);

type FetchedPage = {
  finalUrl: URL;
  html: string;
};

type DeclaredIcon = {
  href: string;
  rank: number;
};

/**
 * Resolve a usable icon URL for a site entry.
 *
 * Sites mounted on a sub-path (`https://host/exam/`) cannot rely on the origin
 * favicon, because that file belongs to whatever serves the domain root — for
 * SiteHarbor's own domain that is SiteHarbor. So candidates are always scoped to
 * the site's own mount path, and every candidate must answer with an image
 * content type: SPA rewrites happily return `index.html` with status 200.
 */
export async function resolveSiteIcon(siteUrl: string): Promise<string | null> {
  const target = toHttpUrl(siteUrl);
  if (!target) return null;

  const page = await fetchPage(target);
  const pageUrl = page?.finalUrl ?? target;
  const declaredIcons = page ? extractDeclaredIcons(page.html) : [];

  for (const candidate of buildCandidates(pageUrl, declaredIcons)) {
    if (await isUsableIcon(candidate)) return candidate;
  }

  return null;
}

/** Check whether a stored icon URL still answers with an image. */
export async function isUsableIcon(iconUrl: string): Promise<boolean> {
  const target = toHttpUrl(iconUrl);
  if (!target) return false;

  try {
    const response = await fetchWithTimeout(target, { method: "GET" });
    const contentType = readContentType(response);
    response.body?.cancel().catch(() => undefined);
    if (!response.ok) return false;
    if (contentType.startsWith("image/")) return true;
    return OPAQUE_CONTENT_TYPES.has(contentType) && IMAGE_EXTENSION.test(target.pathname);
  } catch {
    return false;
  }
}

/**
 * Decide the icon a refresh should store: follow what the site declares now,
 * keep a stored icon that still loads when nothing resolves, and retry once
 * before clearing so a single network hiccup cannot wipe a working icon.
 */
export async function refreshedSiteIcon(site: { iconUrl: string | null; url: string }): Promise<string | null> {
  const resolved = await resolveSiteIcon(site.url);
  if (resolved) return resolved;
  if (!site.iconUrl) return null;
  if (await isUsableIcon(site.iconUrl)) return site.iconUrl;
  return resolveSiteIcon(site.url);
}

/** Resolve icons for many sites with a bounded number of concurrent requests. */
export async function resolveSiteIcons(
  siteUrls: readonly string[],
  concurrency = DEFAULT_CONCURRENCY,
): Promise<Map<string, string | null>> {
  const uniqueUrls = Array.from(new Set(siteUrls));
  const resolved = await mapWithLimit(uniqueUrls, concurrency, resolveSiteIcon);
  return new Map(uniqueUrls.map((url, index) => [url, resolved[index]]));
}

export async function mapWithLimit<Item, Result>(
  items: readonly Item[],
  concurrency: number,
  task: (item: Item) => Promise<Result>,
): Promise<Result[]> {
  const results: Result[] = new Array(items.length);
  let cursor = 0;

  const workers = Array.from({ length: Math.max(1, Math.min(concurrency, items.length)) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await task(items[index]);
    }
  });

  await Promise.all(workers);
  return results;
}

function buildCandidates(pageUrl: URL, declaredIcons: readonly DeclaredIcon[]): string[] {
  const basePath = mountPath(pageUrl);
  const mountSegment = basePath.replace(/^\/|\/$/g, "");
  const candidates: string[] = [];

  const push = (value: string | null) => {
    if (value && !candidates.includes(value)) candidates.push(value);
  };

  for (const icon of declaredIcons) {
    push(absoluteUrl(icon.href, pageUrl));

    if (!icon.href.startsWith("/") || !mountSegment) continue;

    // Sub-path apps often emit root-relative icon hrefs that only exist under
    // their own mount path.
    push(absoluteUrl(`${basePath}${icon.href.slice(1)}`, pageUrl));

    // A base path joined without its separator: "/exam/" + "brand-logo.svg"
    // shipped as "/exambrand-logo.svg".
    if (icon.href.startsWith(`/${mountSegment}`) && !icon.href.startsWith(`/${mountSegment}/`)) {
      push(absoluteUrl(`${basePath}${icon.href.slice(mountSegment.length + 1)}`, pageUrl));
    }
  }

  for (const name of FALLBACK_ICON_NAMES) {
    push(absoluteUrl(`${basePath}${name}`, pageUrl));
  }

  return candidates.slice(0, MAX_CANDIDATES);
}

function extractDeclaredIcons(html: string): DeclaredIcon[] {
  const icons: DeclaredIcon[] = [];

  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = readAttribute(tag, "rel")?.toLowerCase();
    const href = readAttribute(tag, "href");
    if (!rel || !href) continue;

    const rank = rankIcon({
      relTokens: rel.split(/\s+/).filter(Boolean),
      href,
      sizes: readAttribute(tag, "sizes")?.toLowerCase() ?? "",
      type: readAttribute(tag, "type")?.toLowerCase() ?? "",
    });
    if (rank === null) continue;
    icons.push({ href, rank });
  }

  // Array#sort is stable, so equally ranked icons keep their document order.
  return icons.sort((left, right) => left.rank - right.rank);
}

/**
 * Lower is better. Scalable and large icons beat the 16/32px favicons many sites
 * still declare first, which look blurry at card size.
 */
function rankIcon(icon: { relTokens: readonly string[]; href: string; sizes: string; type: string }): number | null {
  const isTouchIcon =
    icon.relTokens.includes("apple-touch-icon") || icon.relTokens.includes("apple-touch-icon-precomposed");
  // `mask-icon` is a monochrome silhouette, so it is deliberately ignored.
  if (!icon.relTokens.includes("icon") && !isTouchIcon) return null;

  const isScalable =
    icon.sizes.split(/\s+/).includes("any") ||
    icon.type === "image/svg+xml" ||
    /\.svg(?:[?#]|$)/i.test(icon.href);
  if (isScalable) return 0;

  const largestSize = largestDeclaredSize(icon.sizes);
  // Touch icons are 180px by convention even when they omit `sizes`.
  if (largestSize >= MIN_SHARP_ICON_PX || (isTouchIcon && !largestSize)) return 1;
  if (largestSize) return 3;
  return /\.ico(?:[?#]|$)/i.test(icon.href) ? 3 : 2;
}

function largestDeclaredSize(sizes: string): number {
  return sizes
    .split(/\s+/)
    .map((token) => /^(\d+)x\d+$/.exec(token)?.[1])
    .reduce((largest, width) => Math.max(largest, Number(width ?? 0)), 0);
}

function readAttribute(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  if (!match) return null;
  const value = (match[2] ?? match[3] ?? match[4] ?? "").trim();
  return value || null;
}

async function fetchPage(target: URL): Promise<FetchedPage | null> {
  try {
    const response = await fetchWithTimeout(target, { method: "GET" });
    const contentType = readContentType(response);
    if (!response.ok || !isHtmlContentType(contentType)) {
      response.body?.cancel().catch(() => undefined);
      return null;
    }

    const finalUrl = toHttpUrl(response.url) ?? target;
    return { finalUrl, html: await readCappedText(response) };
  } catch {
    return null;
  }
}

async function readCappedText(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";

  const decoder = new TextDecoder();
  let text = "";
  let size = 0;

  while (size < MAX_HTML_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    text += decoder.decode(value, { stream: true });
  }

  await reader.cancel().catch(() => undefined);
  return text;
}

async function fetchWithTimeout(target: URL, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(target, {
      ...init,
      cache: "no-store",
      redirect: "follow",
      referrerPolicy: "no-referrer",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function readContentType(response: Response): string {
  return (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
}

function isHtmlContentType(contentType: string): boolean {
  return contentType === "text/html" || contentType === "application/xhtml+xml";
}

function mountPath(pageUrl: URL): string {
  return pageUrl.pathname.endsWith("/")
    ? pageUrl.pathname
    : pageUrl.pathname.replace(/[^/]*$/, "");
}

function absoluteUrl(value: string, base: URL): string | null {
  return toHttpUrl(value, base)?.toString() ?? null;
}

function toHttpUrl(value: string, base?: URL): URL | null {
  try {
    const url = new URL(value, base);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}
