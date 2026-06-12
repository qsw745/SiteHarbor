"use client";

import { BrandMark } from "@/components/BrandMark";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { format, type Dictionary, type Locale } from "@/lib/i18n";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

export type DirectoryCategory = {
  id: string;
  name: string;
  slug: string;
};

export type DirectorySite = {
  id: string;
  name: string;
  slug: string;
  url: string;
  description: string | null;
  iconUrl: string | null;
  clickCount: number;
  categoryName: string | null;
  categorySlug: string | null;
};

type SiteDirectoryProps = {
  categories: DirectoryCategory[];
  sites: DirectorySite[];
  dict: Dictionary;
  locale: Locale;
};

type BookPage = {
  site: DirectorySite;
  position: "previous" | "active" | "next";
};

const COVER_GRADIENTS = [
  "linear-gradient(135deg, #0b4f6c 0%, #0f8f86 42%, #f4c95d 100%)",
  "linear-gradient(135deg, #30336b 0%, #6c5ce7 46%, #00cec9 100%)",
  "linear-gradient(135deg, #12343b 0%, #2ec4b6 48%, #ffbf69 100%)",
  "linear-gradient(135deg, #1f2937 0%, #2563eb 44%, #f0abfc 100%)",
  "linear-gradient(135deg, #0f172a 0%, #14b8a6 48%, #fb7185 100%)",
  "linear-gradient(135deg, #164e63 0%, #38bdf8 45%, #fde68a 100%)",
];

export function SiteDirectory({ categories, sites, dict, locale }: SiteDirectoryProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isUserBrowsing, setIsUserBrowsing] = useState(false);
  const [hasUserBrowsed, setHasUserBrowsed] = useState(false);
  const [lastActivityAt, setLastActivityAt] = useState(() => Date.now());
  const [dreamCountdown, setDreamCountdown] = useState<number | null>(null);
  const [isDreamTransitioning, setIsDreamTransitioning] = useState(false);
  const copy = getDirectoryCopy(locale);

  const filteredSites = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sites.filter((site) => {
      const matchesCategory =
        category === "all" ||
        site.categorySlug === category ||
        (!site.categorySlug && category === "uncategorized");
      const searchable = [site.name, site.description, site.url, site.categoryName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [category, query, sites]);

  const canAdvance = filteredSites.length > 1;

  useEffect(() => {
    if (!canAdvance || isPaused || isUserBrowsing || dreamCountdown !== null) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % filteredSites.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, [canAdvance, dreamCountdown, filteredSites.length, isPaused, isUserBrowsing]);

  useEffect(() => {
    let browsingTimer: number | undefined;

    const markBrowsing = () => {
      setIsUserBrowsing(true);
      setHasUserBrowsed(true);
      setLastActivityAt(Date.now());
      setDreamCountdown(null);
      setIsDreamTransitioning(false);
      window.clearTimeout(browsingTimer);
      browsingTimer = window.setTimeout(() => setIsUserBrowsing(false), 1600);
    };

    window.addEventListener("scroll", markBrowsing, { passive: true });
    window.addEventListener("wheel", markBrowsing, { passive: true });
    window.addEventListener("touchstart", markBrowsing, { passive: true });
    window.addEventListener("pointerdown", markBrowsing);
    window.addEventListener("keydown", markBrowsing);
    window.addEventListener("resize", markBrowsing);

    return () => {
      window.clearTimeout(browsingTimer);
      window.removeEventListener("scroll", markBrowsing);
      window.removeEventListener("wheel", markBrowsing);
      window.removeEventListener("touchstart", markBrowsing);
      window.removeEventListener("pointerdown", markBrowsing);
      window.removeEventListener("keydown", markBrowsing);
      window.removeEventListener("resize", markBrowsing);
    };
  }, []);

  useEffect(() => {
    if (!canAdvance || !hasUserBrowsed || dreamCountdown !== null || isDreamTransitioning) {
      return;
    }

    const idleCheck = window.setInterval(() => {
      const page = document.documentElement;
      const bottomOffset = page.scrollHeight - (window.scrollY + window.innerHeight);
      const idleLongEnough = Date.now() - lastActivityAt >= 2600;

      if (bottomOffset <= 36 && idleLongEnough) {
        setDreamCountdown(3);
      }
    }, 300);

    return () => window.clearInterval(idleCheck);
  }, [canAdvance, dreamCountdown, hasUserBrowsed, isDreamTransitioning, lastActivityAt]);

  useEffect(() => {
    if (dreamCountdown === null || !canAdvance) return;

    if (dreamCountdown > 0) {
      const countTimer = window.setTimeout(() => {
        setDreamCountdown((current) => (current === null ? null : current - 1));
      }, 1000);
      return () => window.clearTimeout(countTimer);
    }

    const transitionTimer = window.setTimeout(() => setIsDreamTransitioning(true), 0);
    const advanceTimer = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % filteredSites.length);
      setDreamCountdown(null);
      setIsDreamTransitioning(false);
    }, 720);

    return () => {
      window.clearTimeout(transitionTimer);
      window.clearTimeout(advanceTimer);
    };
  }, [canAdvance, dreamCountdown, filteredSites.length]);

  const hasUncategorized = sites.some((site) => !site.categorySlug);
  const totalVisits = sites.reduce((sum, site) => sum + site.clickCount, 0);
  const usedCategoryCount =
    categories.filter((item) => sites.some((site) => site.categorySlug === item.slug)).length +
    (hasUncategorized ? 1 : 0);

  const activeSite = filteredSites.length
    ? filteredSites[activeIndex % filteredSites.length]
    : null;
  const bookPages = activeSite ? getBookPages(filteredSites, activeIndex) : [];

  const goTo = (index: number) => {
    if (!filteredSites.length) return;
    const nextIndex = (index + filteredSites.length) % filteredSites.length;
    setDreamCountdown(null);
    setIsDreamTransitioning(false);
    setActiveIndex(nextIndex);
  };

  const goToPrevious = () => goTo(activeIndex - 1);
  const goToNext = () => goTo(activeIndex + 1);
  const selectCategory = (nextCategory: string) => {
    setCategory(nextCategory);
    setActiveIndex(0);
    setDreamCountdown(null);
    setIsDreamTransitioning(false);
  };

  return (
    <main
      className={`directory-shell dream-directory-shell flex min-h-screen flex-col pb-10 ${isDreamTransitioning ? "dream-transitioning" : ""}`}
    >
      <div className="anime-sky" aria-hidden>
        <span className="anime-spark anime-spark-one" />
        <span className="anime-spark anime-spark-two" />
        <span className="anime-ribbon anime-ribbon-one" />
        <span className="anime-ribbon anime-ribbon-two" />
        <span className="anime-moon" />
      </div>

      <header className="directory-topbar dream-topbar">
        <div className="shell flex items-center justify-between gap-4">
          <BrandMark size="lg" showSubtitle subtitle={dict.brandTag} />
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-white/45 bg-white/55 px-3 py-1.5 text-xs font-medium text-[var(--muted-strong)] shadow-sm backdrop-blur sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
              {format(dict.home.showing, {
                shown: sites.length,
                total: sites.length,
              })}
            </span>
            <LanguageSwitcher current={locale} />
          </div>
        </div>
      </header>

      <section className="dream-hero shell">
        <div className="dream-hero-copy">
          <p className="dream-kicker">
            <Sparkles size={14} aria-hidden />
            {copy.kicker}
          </p>
          <h1>
            {dict.home.titleBefore}
            <span>{dict.home.titleHighlight}</span>
          </h1>
          <p>{copy.subtitle}</p>
        </div>

        <div className="dream-stats" aria-label={copy.statsLabel}>
          <StatTile label={dict.home.statSites} value={sites.length} />
          <StatTile label={dict.home.statCategories} value={usedCategoryCount} />
          <StatTile label={dict.home.statVisits} value={totalVisits} />
        </div>
      </section>

      <section
        className="dream-stage shell"
        onMouseEnter={() => {
          setIsPaused(true);
          setDreamCountdown(null);
        }}
        onMouseLeave={() => setIsPaused(false)}
      >
        {activeSite ? (
          <>
            <div className="book-carousel" aria-live="polite">
              <button
                className="dream-nav-button"
                type="button"
                aria-label={copy.previous}
                disabled={filteredSites.length <= 1}
                onClick={goToPrevious}
              >
                <ChevronLeft size={22} aria-hidden />
              </button>

              <div className="book-pages" style={{ perspective: "1400px" }}>
                {bookPages.map(({ site, position }) => (
                  <BookCover
                    key={`${site.id}-${position}`}
                    site={site}
                    dict={dict}
                    locale={locale}
                    position={position}
                  />
                ))}
              </div>

              <button
                className="dream-nav-button"
                type="button"
                aria-label={copy.next}
                disabled={filteredSites.length <= 1}
                onClick={goToNext}
              >
                <ChevronRight size={22} aria-hidden />
              </button>
            </div>

            <SiteStory
              key={activeSite.id}
              site={activeSite}
              dict={dict}
              locale={locale}
              currentIndex={(activeIndex % filteredSites.length) + 1}
              total={filteredSites.length}
            />

            {filteredSites.length > 1 ? (
              <div className="dream-thumbnails" aria-label={copy.pickSite}>
                {filteredSites.map((site, index) => (
                  <button
                    key={site.id}
                    className={`dream-thumb ${index === activeIndex % filteredSites.length ? "active" : ""}`}
                    type="button"
                    aria-label={`${copy.pickSite}: ${site.name}`}
                    onClick={() => goTo(index)}
                  >
                    <CoverEmblem site={site} compact />
                    <span>{site.name}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <div className="dream-empty">
            <h2>{dict.home.emptyTitle}</h2>
            <p>{query ? dict.home.emptyDescSearch : dict.home.emptyDescNone}</p>
          </div>
        )}
      </section>

      <section className="dream-controls shell">
        <label className="dream-search focus-within">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            size={17}
          />
          <span className="sr-only">{dict.home.searchPlaceholder}</span>
          <input
            className="focus-ring"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
              setDreamCountdown(null);
              setIsDreamTransitioning(false);
            }}
            placeholder={dict.home.searchPlaceholder}
          />
        </label>

        <div className="dream-category-strip">
          <CategoryChip active={category === "all"} onClick={() => selectCategory("all")}>
            {dict.home.all}
            <Counter>{sites.length}</Counter>
          </CategoryChip>
          {categories.map((item) => {
            const count = sites.filter((site) => site.categorySlug === item.slug).length;
            if (!count) return null;
            return (
              <CategoryChip
                key={item.id}
                active={category === item.slug}
                onClick={() => selectCategory(item.slug)}
              >
                {item.name}
                <Counter>{count}</Counter>
              </CategoryChip>
            );
          })}
          {hasUncategorized ? (
            <CategoryChip
              active={category === "uncategorized"}
              onClick={() => selectCategory("uncategorized")}
            >
              {dict.home.uncategorized}
            </CategoryChip>
          ) : null}
        </div>
      </section>

      <footer className="shell mt-10 flex flex-col items-start justify-between gap-2 border-t border-white/50 pt-6 text-xs text-[var(--muted)] sm:flex-row sm:items-center">
        <span>{format(dict.home.footer.copyright, { year: new Date().getFullYear() })}</span>
        <span>{format(dict.home.showing, { shown: filteredSites.length, total: sites.length })}</span>
      </footer>

      {dreamCountdown !== null || isDreamTransitioning ? (
        <div className="dream-countdown-overlay" role="status" aria-live="polite">
          <div className="dream-countdown-card">
            <span className="dream-countdown-rune" aria-hidden>
              ✦
            </span>
            <p>{copy.dreamCountdown}</p>
            <strong>{dreamCountdown && dreamCountdown > 0 ? dreamCountdown : copy.dreamNow}</strong>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function BookCover({
  site,
  dict,
  locale,
  position,
}: {
  site: DirectorySite;
  dict: Dictionary;
  locale: Locale;
  position: BookPage["position"];
}) {
  const categoryLabel = site.categoryName || dict.home.uncategorized;
  const style = {
    "--cover-bg": pickCoverGradient(site.slug || site.name),
  } as CSSProperties;

  return (
    <a
      className={`book-cover ${position}`}
      href={`/go/${site.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      style={style}
      aria-label={`${getDirectoryCopy(locale).openSite}: ${site.name}`}
    >
      <span className="book-spine" aria-hidden />
      <span className="book-cover-glass" aria-hidden />
      <span className="book-category">{categoryLabel}</span>
      <CoverEmblem site={site} />
      <span className="book-title">{site.name}</span>
      <span className="book-url">{formatUrl(site.url)}</span>
    </a>
  );
}

function CoverEmblem({ site, compact = false }: { site: DirectorySite; compact?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const letter = (site.name.trim().slice(0, 1) || "?").toUpperCase();

  return (
    <span className={`cover-emblem ${compact ? "compact" : ""}`}>
      <span aria-hidden className="cover-letter">
        {letter}
      </span>
      {site.iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          aria-hidden
          src={site.iconUrl}
          className="cover-icon"
          style={{ opacity: loaded ? 1 : 0 }}
          onLoad={(event) => {
            const target = event.currentTarget;
            if (target.naturalWidth >= 16 && target.naturalHeight >= 16) {
              setLoaded(true);
            }
          }}
          onError={() => setLoaded(false)}
        />
      ) : null}
    </span>
  );
}

function SiteStory({
  site,
  dict,
  locale,
  currentIndex,
  total,
}: {
  site: DirectorySite;
  dict: Dictionary;
  locale: Locale;
  currentIndex: number;
  total: number;
}) {
  const copy = getDirectoryCopy(locale);
  const categoryLabel = site.categoryName || dict.home.uncategorized;

  return (
    <article className="dream-story">
      <div className="dream-story-meta">
        <span>{String(currentIndex).padStart(2, "0")}</span>
        <span>/</span>
        <span>{String(total).padStart(2, "0")}</span>
        <span>{categoryLabel}</span>
      </div>
      <div>
        <h2>{site.name}</h2>
        <p>{site.description || dict.home.noDescription}</p>
      </div>
      <div className="dream-story-actions">
        <a
          className="dream-visit-button"
          href={`/go/${site.slug}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {copy.openSite}
          <ArrowUpRight size={17} aria-hidden />
        </a>
        <span className="dream-story-url">{formatUrl(site.url)}</span>
        <span className="dream-story-visits">
          <Eye size={14} aria-hidden />
          {format(dict.home.visits, { count: site.clickCount })}
        </span>
      </div>
    </article>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-tile dream-stat-tile">
      <div className="text-[11px] font-medium uppercase text-[var(--muted)]">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-[var(--foreground)]">
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function CategoryChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`focus-ring chip dream-chip ${active ? "active" : ""}`}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Counter({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-black/10 px-1.5 py-px text-[10.5px] font-medium tabular-nums">
      {children}
    </span>
  );
}

function getBookPages(sites: DirectorySite[], activeIndex: number): BookPage[] {
  if (sites.length === 1) {
    return [{ site: sites[0], position: "active" }];
  }

  const active = activeIndex % sites.length;
  const offsets = sites.length === 2 ? [0, 1] : [-1, 0, 1];

  return offsets.map((offset) => {
    const index = (active + offset + sites.length) % sites.length;
    return {
      site: sites[index],
      position: offset < 0 ? "previous" : offset > 0 ? "next" : "active",
    };
  });
}

function pickCoverGradient(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return COVER_GRADIENTS[hash % COVER_GRADIENTS.length];
}

function getDirectoryCopy(locale: Locale) {
  if (locale === "en") {
    return {
      kicker: "Dream portal",
      subtitle:
        "Flip through every hosted site as a glowing page, then open the destination that fits the moment.",
      statsLabel: "Directory statistics",
      previous: "Previous site",
      next: "Next site",
      openSite: "Open site",
      pickSite: "Choose site",
      dreamCountdown: "Entering the next dream in",
      dreamNow: "Now",
    };
  }

  return {
    kicker: "梦境入口",
    subtitle: "像翻开一本微光图册一样浏览每个站点，封面切换时简介、链接与访问数据同步浮现。",
    statsLabel: "站点统计",
    previous: "上一个站点",
    next: "下一个站点",
    openSite: "进入网站",
    pickSite: "选择站点",
    dreamCountdown: "即将进入下一个梦幻",
    dreamNow: "启程",
  };
}

function formatUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.host + (parsed.pathname === "/" ? "" : parsed.pathname);
  } catch {
    return url;
  }
}
