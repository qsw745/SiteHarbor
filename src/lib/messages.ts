import type { Dictionary } from "./i18n";
import { translateMessage } from "./i18n";

export function adminPath(path: string, params: Record<string, string>) {
  const search = new URLSearchParams(params);
  return `${path}?${search.toString()}`;
}

type RawParams = Record<string, string | string[] | undefined>;

function pickString(params: RawParams | undefined, key: string): string {
  const value = params?.[key];
  return typeof value === "string" ? value : "";
}

export function messageFromParams(params?: RawParams) {
  return {
    error: pickString(params, "error"),
    ok: pickString(params, "ok"),
  };
}

/**
 * Resolve a translated message from a query-string `?ok=` / `?error=` key,
 * carrying any additional string params from the same URL into the template.
 */
export function resolveMessage(
  dict: Dictionary,
  key: string,
  params?: RawParams,
): string {
  if (!key) return "";
  const extras: Record<string, string> = {};
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      if (name === "ok" || name === "error") continue;
      if (typeof value === "string") extras[name] = value;
    }
  }
  return translateMessage(dict, key, extras);
}
