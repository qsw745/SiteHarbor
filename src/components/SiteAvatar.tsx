"use client";

import { useState } from "react";

type Size = "sm" | "md" | "lg";

const sizeClass: Record<Size, string> = {
  sm: "h-8 w-8 rounded-lg text-sm",
  md: "h-11 w-11 rounded-xl text-base",
  lg: "h-14 w-14 rounded-2xl text-lg",
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

export function SiteAvatar({
  iconUrl,
  name,
  slug,
  size = "md",
}: {
  iconUrl?: string | null;
  name: string;
  slug: string;
  size?: Size;
}) {
  const [hasIconError, setHasIconError] = useState(false);
  const gradient = pickGradient(slug || name || "x");
  const identity = `${slug} ${name}`.toLowerCase();
  const displayIconUrl =
    iconUrl || (identity.includes("siteharbor") ? "/brand/siteharbor-icon.png" : null);
  const showIcon = Boolean(displayIconUrl && !hasIconError);

  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden border border-[var(--line)] ${sizeClass[size]}`}
    >
      <span aria-hidden className="absolute inset-0" style={{ background: gradient }} />
      <span
        aria-hidden
        className="relative h-3 w-3 rounded-[4px] border border-white/70 bg-white/45 shadow-sm"
      />
      {displayIconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-contain p-1 transition-opacity duration-200"
          style={{ opacity: showIcon ? 1 : 0, background: "white" }}
          src={displayIconUrl}
          onLoad={() => setHasIconError(false)}
          onError={() => setHasIconError(true)}
        />
      ) : null}
    </span>
  );
}
