/**
 * Product icons bundled under `public/product-icons/` mirror each product's
 * native app icon, because the favicons on the products' own websites can lag
 * behind a rebrand. They are referenced by a site-relative path and curated by
 * hand, so automatic icon refreshes must never replace them.
 */
const CURATED_ICON_PATH = /^\/product-icons\/[a-z0-9-]+\.(?:svg|webp|png)$/;

export function isCuratedIcon(iconUrl: string | null | undefined): boolean {
  return Boolean(iconUrl && CURATED_ICON_PATH.test(iconUrl));
}
