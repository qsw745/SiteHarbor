"use client";

import { setLocaleAction } from "@/app/actions";
import type { Locale } from "@/lib/i18n";
import { Languages } from "lucide-react";

type Tone = "outline" | "ghost";

export function LanguageSwitcher({
  current,
  tone = "outline",
}: {
  current: Locale;
  tone?: Tone;
}) {
  const next: Locale = current === "zh" ? "en" : "zh";
  const label = current === "zh" ? "English" : "中文";
  const title = current === "zh" ? "Switch to English" : "切换为中文";

  return (
    <form action={setLocaleAction} className="inline-flex">
      <input type="hidden" name="locale" value={next} />
      <button
        aria-label={title}
        className={tone === "ghost" ? "btn-ghost px-3" : "btn-secondary px-3"}
        title={title}
        type="submit"
      >
        <Languages size={15} aria-hidden />
        <span className="text-sm">{label}</span>
      </button>
    </form>
  );
}
