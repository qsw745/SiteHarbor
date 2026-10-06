"use client";

import { isCuratedIcon } from "@/lib/product-icons";
import { useCallback, useState } from "react";

type Size = "sm" | "md" | "lg" | "xl";

const sizeClass: Record<Size, string> = {
  sm: "h-8 w-8 rounded-lg text-sm",
  md: "h-11 w-11 rounded-xl text-lg",
  lg: "h-14 w-14 rounded-2xl text-2xl",
  xl: "h-[72px] w-[72px] rounded-[20px] text-3xl",
};

const GRADIENTS = [
  "linear-gradient(135deg, #0f8f86 0%, #18b7aa 100%)",
  "linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)",
  "linear-gradient(135deg, #10b981 0%, #65a30d 100%)",
  "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
  "linear-gradient(135deg, #f43f5e 0%, #ef4444 100%)",
  "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)",
  "linear-gradient(135deg, #0ea5e9 0%, #0f8f86 100%)",
  "linear-gradient(135deg, #84cc16 0%, #14b8a6 100%)",
  "linear-gradient(135deg, #dc2626 0%, #f59e0b 100%)",
  "linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)",
];

function pickGradient(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return GRADIENTS[hash % GRADIENTS.length];
}

type IconStatus = "loading" | "ok" | "error";

export function SiteAvatar({
  iconUrl,
  name,
  slug,
  size = "md",
  isEager = false,
}: {
  iconUrl?: string | null;
  name: string;
  slug: string;
  size?: Size;
  /** Load immediately instead of lazily, for icons above the fold. */
  isEager?: boolean;
}) {
  const [iconStatus, setIconStatus] = useState<IconStatus>("loading");
  const gradient = pickGradient(slug || name || "x");
  const identity = `${slug} ${name}`.toLowerCase();
  const displayIconUrl =
    iconUrl || (identity.includes("siteharbor") ? "/brand/siteharbor-icon.png" : null);
  const showIcon = Boolean(displayIconUrl) && iconStatus === "ok";
  // Curated app icons are trimmed full-bleed tiles; remote favicons are often
  // glyphs on transparency and need a padded white backdrop.
  const isAppIcon = isCuratedIcon(displayIconUrl);
  const initial = (name.trim() || slug.trim() || "?").charAt(0).toUpperCase();

  // Load/error events can fire before React hydration attaches handlers,
  // so re-derive the outcome from the DOM node once it is available.
  const inspectImage = useCallback((img: HTMLImageElement | null) => {
    if (!img || !img.complete) return;
    setIconStatus(img.naturalWidth > 0 ? "ok" : "error");
  }, []);

  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden border border-[var(--line)] ${sizeClass[size]}`}
    >
      <span
        aria-hidden
        className="absolute inset-0 transition-opacity duration-200"
        style={{ background: gradient, opacity: showIcon ? 0 : 1 }}
      />
      <span
        aria-hidden
        className="relative font-semibold text-white/95 [text-shadow:0_1px_4px_rgba(9,20,28,0.35)] transition-opacity duration-200"
        style={{ opacity: showIcon ? 0 : 1 }}
      >
        {initial}
      </span>
      {displayIconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          aria-hidden
          ref={inspectImage}
          className={`absolute inset-0 h-full w-full transition-opacity duration-200 ${
            isAppIcon ? "object-cover" : "object-contain bg-white p-1"
          }`}
          style={{ opacity: showIcon ? 1 : 0 }}
          src={displayIconUrl}
          // Bundled icons are a few KB each, so loading them lazily only adds a letter flash.
          loading={isEager || isAppIcon ? "eager" : "lazy"}
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setIconStatus("ok")}
          onError={() => setIconStatus("error")}
        />
      ) : null}
    </span>
  );
}
