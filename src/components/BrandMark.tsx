"use client";

import Image from "next/image";

type BrandMarkSize = "sm" | "md" | "lg";

const sizeConfig: Record<
  BrandMarkSize,
  {
    icon: string;
    title: string;
    subtitle: string;
    gap: string;
  }
> = {
  sm: {
    icon: "h-8 w-8",
    title: "text-base",
    subtitle: "text-[11px]",
    gap: "gap-2",
  },
  md: {
    icon: "h-10 w-10",
    title: "text-lg",
    subtitle: "text-xs",
    gap: "gap-2.5",
  },
  lg: {
    icon: "h-12 w-12",
    title: "text-xl",
    subtitle: "text-xs",
    gap: "gap-3",
  },
};

export function BrandMark({
  className = "",
  showSubtitle = false,
  size = "md",
  subtitle,
}: {
  className?: string;
  showSubtitle?: boolean;
  size?: BrandMarkSize;
  subtitle?: string;
}) {
  const config = sizeConfig[size];

  return (
    <div className={`brand-mark inline-flex min-w-0 items-center ${config.gap} ${className}`}>
      <span className={`brand-icon ${config.icon}`}>
        <Image
          alt=""
          aria-hidden
          src="/brand/siteharbor-icon.png"
          width={96}
          height={96}
          priority={size === "lg"}
        />
      </span>
      <span className="min-w-0">
        <span className={`block truncate font-semibold tracking-tight ${config.title}`}>
          SiteHarbor
        </span>
        {showSubtitle && subtitle ? (
          <span className={`block truncate text-[var(--muted)] ${config.subtitle}`}>
            {subtitle}
          </span>
        ) : null}
      </span>
    </div>
  );
}
