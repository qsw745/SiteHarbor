export function makeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function normalizeSlug(input: string | undefined, fallback: string) {
  const slug = makeSlug(input || fallback);
  return slug || makeSlug(`site-${Date.now()}`);
}
