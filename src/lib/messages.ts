export function adminPath(path: string, params: Record<string, string>) {
  const search = new URLSearchParams(params);
  return `${path}?${search.toString()}`;
}

export function messageFromParams(params?: Record<string, string | string[] | undefined>) {
  const error = typeof params?.error === "string" ? params.error : "";
  const ok = typeof params?.ok === "string" ? params.ok : "";
  return { error, ok };
}
