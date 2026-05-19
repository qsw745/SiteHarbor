"use client";

import { useState } from "react";

type Size = "sm" | "md" | "lg";

const sizeClass: Record<Size, string> = {
  sm: "h-8 w-8 rounded-lg text-sm",
  md: "h-11 w-11 rounded-xl text-base",
  lg: "h-14 w-14 rounded-2xl text-lg",
};

const GRADIENTS = [
  "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
  "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
  "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
  "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
  "linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)",
  "linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)",
  "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
  "linear-gradient(135deg, #84cc16 0%, #10b981 100%)",
  "linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)",
  "linear-gradient(135deg, #14b8a6 0%, #0ea5e9 100%)",
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
  iconUrl: string | null;
  name: string;
  slug: string;
  size?: Size;
}) {
  const [errored, setErrored] = useState(false);
  const showImage = Boolean(iconUrl) && !errored;
  const gradient = pickGradient(slug || name || "x");
  const letter = (name.trim().slice(0, 1) || "?").toUpperCase();

  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden border border-[var(--line)] ${sizeClass[size]}`}
    >
      <span aria-hidden className="absolute inset-0" style={{ background: gradient }} />
      <span
        aria-hidden
        className="relative font-semibold text-white"
        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.18)" }}
      >
        {letter}
      </span>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          className="absolute inset-0 h-full w-full bg-white object-cover"
          src={iconUrl as string}
          onError={() => setErrored(true)}
        />
      ) : null}
    </span>
  );
}
