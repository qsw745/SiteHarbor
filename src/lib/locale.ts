import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  type Locale,
  getDictionary,
  resolveLocale,
} from "./i18n";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return resolveLocale(store.get(LOCALE_COOKIE)?.value);
}

export async function getActiveDictionary() {
  const locale = await getLocale();
  return { locale, dict: getDictionary(locale) };
}

export { DEFAULT_LOCALE };
