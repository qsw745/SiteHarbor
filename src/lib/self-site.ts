/**
 * SiteHarbor is itself one of the sites served by the harbor domain, and the
 * Nginx scan happily discovers it. Listing the portal inside its own manifest is
 * noise, so entries that point back at this deployment are treated as "self" and
 * hidden from the public directory and from discovery imports.
 *
 * `NEXT_PUBLIC_APP_URL` identifies the deployment. `SELF_SITE_URLS` (comma
 * separated) covers extra aliases — mainly local development against a database
 * that mirrors production URLs.
 */
function selfSiteKeys(): Set<string> {
  const configured = [
    process.env.NEXT_PUBLIC_APP_URL,
    ...(process.env.SELF_SITE_URLS ?? "").split(","),
  ];

  const keys = new Set<string>();
  for (const value of configured) {
    const key = siteKey(value?.trim() ?? "");
    if (key) keys.add(key);
  }

  return keys;
}

export function isSelfSiteUrl(url: string): boolean {
  const key = siteKey(url);
  if (!key) return false;
  return selfSiteKeys().has(key);
}

/** Host plus path, normalised so `www.`, trailing slashes and queries do not matter. */
function siteKey(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return `${url.host.replace(/^www\./, "")}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return null;
  }
}
