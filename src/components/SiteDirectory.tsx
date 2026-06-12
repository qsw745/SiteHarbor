"use client";

import { BrandMark } from "@/components/BrandMark";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { format, type Dictionary, type Locale } from "@/lib/i18n";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Compass,
  Globe2,
  Layers3,
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

type SiteNarrative = {
  longDescription: string;
  role: string;
  mood: string;
  highlights: string[];
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
  const [lastActivityAt, setLastActivityAt] = useState(() => Date.now());
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
    if (!canAdvance || isPaused || isUserBrowsing || isDreamTransitioning) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % filteredSites.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, [canAdvance, filteredSites.length, isDreamTransitioning, isPaused, isUserBrowsing]);

  useEffect(() => {
    let browsingTimer: number | undefined;

    const markBrowsing = () => {
      setIsUserBrowsing(true);
      setLastActivityAt(Date.now());
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
    if (!canAdvance || isDreamTransitioning) {
      return;
    }

    let advancing = false;
    let advanceTimer: number | undefined;
    const idleCheck = window.setInterval(() => {
      if (advancing) return;
      const page = document.documentElement;
      const bottomOffset = page.scrollHeight - (window.scrollY + window.innerHeight);
      const idleLongEnough = Date.now() - lastActivityAt >= 2600;

      if (bottomOffset <= 36 && idleLongEnough) {
        advancing = true;
        setIsDreamTransitioning(true);
        advanceTimer = window.setTimeout(() => {
          setActiveIndex((current) => (current + 1) % filteredSites.length);
          setLastActivityAt(Date.now());
          setIsDreamTransitioning(false);
        }, 720);
      }
    }, 300);

    return () => {
      window.clearInterval(idleCheck);
      window.clearTimeout(advanceTimer);
    };
  }, [canAdvance, filteredSites.length, isDreamTransitioning, lastActivityAt]);

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
    setIsDreamTransitioning(false);
    setActiveIndex(nextIndex);
  };

  const goToPrevious = () => goTo(activeIndex - 1);
  const goToNext = () => goTo(activeIndex + 1);
  const selectCategory = (nextCategory: string) => {
    setCategory(nextCategory);
    setActiveIndex(0);
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
  const narrative = getSiteNarrative(site, locale, dict);
  const displayUrl = formatUrl(site.url);

  return (
    <article className="dream-story">
      <div className="dream-story-main">
        <div className="dream-story-meta">
          <span>{String(currentIndex).padStart(2, "0")}</span>
          <span>/</span>
          <span>{String(total).padStart(2, "0")}</span>
          <span>{categoryLabel}</span>
        </div>
        <h2>{site.name}</h2>
        <p className="dream-story-lead">{site.description || dict.home.noDescription}</p>
        <p className="dream-story-long">{narrative.longDescription}</p>
      </div>

      <div className="dream-site-profile">
        <div className="dream-profile-heading">
          <BookOpen size={16} aria-hidden />
          <span>{copy.siteProfile}</span>
        </div>
        <dl className="dream-site-facts">
          <div>
            <dt>
              <Globe2 size={14} aria-hidden />
              {copy.entryPath}
            </dt>
            <dd>{displayUrl}</dd>
          </div>
          <div>
            <dt>
              <Layers3 size={14} aria-hidden />
              {copy.siteRole}
            </dt>
            <dd>{narrative.role}</dd>
          </div>
          <div>
            <dt>
              <Activity size={14} aria-hidden />
              {copy.visitHeat}
            </dt>
            <dd>{format(dict.home.visits, { count: site.clickCount })}</dd>
          </div>
          <div>
            <dt>
              <Compass size={14} aria-hidden />
              {copy.browseMood}
            </dt>
            <dd>{narrative.mood}</dd>
          </div>
        </dl>
        <a
          className="dream-visit-button"
          href={`/go/${site.slug}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {copy.openSite}
          <ArrowUpRight size={17} aria-hidden />
        </a>
      </div>

      <div className="dream-highlight-lane" aria-label={copy.highlights}>
        {narrative.highlights.map((item, index) => (
          <div className="dream-highlight" key={item}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <p>{item}</p>
          </div>
        ))}
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

function getSiteNarrative(site: DirectorySite, locale: Locale, dict: Dictionary): SiteNarrative {
  const description = site.description || dict.home.noDescription;
  const category = site.categoryName || dict.home.uncategorized;

  const zhNarratives: Record<string, SiteNarrative> = {
    siteharbor: {
      longDescription:
        "这是这台服务器的总入口，也是所有产品网站的索引页。它把分散在不同路径、子域和服务里的项目收束到一个可浏览的空间里，让访客不用记住每一个地址，也能快速理解每个站点的用途、状态和访问路径。",
      role: "服务器入口总控台",
      mood: "清晰导航 / 轻量管理",
      highlights: [
        "公开页负责展示可访问的网站，后台负责维护名称、分类、排序、启停和目标链接。",
        "每一次从入口跳转都会记录访问次数，方便判断哪些站点更常被打开。",
        "适合作为服务器主页，既能给访客导航，也能给自己留一张完整的网站地图。",
      ],
    },
    benliu: {
      longDescription:
        "奔流是面向桌面端的下载管理工具，重点解决浏览器下载分散、任务状态不清晰、视频站点处理复杂的问题。入口页用于把产品官网、下载说明和后续更新集中呈现，方便用户从一个稳定路径抵达。",
      role: "桌面下载管理器官网",
      mood: "效率工具 / 下载中枢",
      highlights: [
        "浏览器扩展接管普通下载，多连接任务进入统一桌面队列。",
        "视频站点交给独立处理链路，减少普通下载和媒体解析互相干扰。",
        "适合作为用户下载、查看更新、理解产品能力的固定入口。",
      ],
    },
    birthday: {
      longDescription:
        "生日提醒站点把农历生日、下一次提醒时间和邮件通知放在一个轻量页面里。它更像一份安静运行的生活清单，负责把容易忘记的重要日期提前托管起来。",
      role: "生日与提醒管理",
      mood: "生活助手 / 准时提醒",
      highlights: [
        "支持维护生日清单，并自动计算下一次需要提醒的时间。",
        "适合存放家人朋友的重要日期，减少临近当天才想起来的尴尬。",
        "邮件提醒让它可以在后台安静运行，不需要每天手动打开检查。",
      ],
    },
    profiledock: {
      longDescription:
        "ProfileDock 用来管理 Claude、Codex 等多账号本地配置，把不同账号的数据目录、启动入口和 Dock 图标隔离开。它的价值在于减少反复登录、切换环境和误用账号带来的混乱。",
      role: "多账号本地隔离工具",
      mood: "开发辅助 / 环境切换",
      highlights: [
        "每个账号拥有独立的数据目录和启动入口，降低配置互相污染的风险。",
        "适合需要频繁在不同 AI 工具账号之间切换的本地工作流。",
        "备份、重置和入口管理集中在一个工具里，减少手工维护成本。",
      ],
    },
    "qingsong-notes": {
      longDescription:
        "青松笔记用于沉淀个人技术教程、排查记录和长期可复用的操作经验。它不是临时备忘，而是把已经验证过的步骤整理成之后还能重新执行的知识入口。",
      role: "个人技术笔记站",
      mood: "知识沉淀 / 教程归档",
      highlights: [
        "适合存放教程、排错过程、部署记录和反复使用的命令说明。",
        "内容面向之后的自己，强调可复现、可检索和少走弯路。",
        "作为服务器上的公开笔记入口，可以和其它产品站点自然串联。",
      ],
    },
    cloudshellconsole: {
      longDescription:
        "CloudShellConsole 是专业 SSH/SFTP 客户端的产品入口，面向需要经常连接服务器、管理文件和处理远程终端任务的用户。它强调原生桌面体验、多标签工作流和更安全的本地认证方式。",
      role: "SSH/SFTP 桌面客户端",
      mood: "运维工具 / 多标签终端",
      highlights: [
        "终端、多标签和 SFTP 文件传输放在同一个桌面工作区里。",
        "面向 macOS 和 Windows 原生体验，减少 Web 工具常见的割裂感。",
        "支持 Touch ID / 安全隔区等认证方式，让高频连接更顺手。",
      ],
    },
    "online-exam": {
      longDescription:
        "在线考试系统负责题库、考试、阅卷、学习进度和后台权限等教学管理流程。它适合把考试组织、过程管理和结果查看集中在一个稳定入口里。",
      role: "在线考试与题库平台",
      mood: "学习系统 / 流程管理",
      highlights: [
        "覆盖题库维护、考试组织、阅卷和学习进度查看等核心流程。",
        "统一挂载在服务器固定路径，方便学生或管理员直接访问。",
        "后台权限与考试管理集中化，适合持续扩展教学场景。",
      ],
    },
  };

  const enNarratives: Record<string, SiteNarrative> = {
    siteharbor: {
      longDescription:
        "This is the server's front door and the map for every hosted project. It turns scattered paths, subdomains, and services into one readable directory so visitors can understand what each site does before opening it.",
      role: "Server entry console",
      mood: "Clear navigation / light control",
      highlights: [
        "The public page presents enabled sites while the admin area maintains names, categories, order, status, and target URLs.",
        "Every SiteHarbor jump records a visit count, making frequently used destinations easier to spot.",
        "It works as a practical server homepage for visitors and as a living site map for maintenance.",
      ],
    },
    benliu: {
      longDescription:
        "Benliu is a desktop download manager entry point. It gives users a stable place to understand the product, reach downloads, and follow updates without hunting through scattered links.",
      role: "Download manager site",
      mood: "Utility / download hub",
      highlights: [
        "Browser extension capture and desktop queue management live in one workflow.",
        "Media sites can use a dedicated path so ordinary downloads stay clean.",
        "The entry is built for downloads, product context, and update discovery.",
      ],
    },
  };

  const fallback: SiteNarrative = {
    longDescription:
      locale === "en"
        ? `${description} This entry keeps the destination, category, and visit context together so the site can be understood before opening it.`
        : `${description} 这个入口会把目标地址、分类、访问热度和站点说明放在一起展示，让访客在点击前先知道它解决什么问题、适合什么场景。`,
    role: category,
    mood: locale === "en" ? "Hosted site / quick access" : "托管站点 / 快速抵达",
    highlights:
      locale === "en"
        ? [
            "The cover, introduction, path, and visit data update together as the carousel changes.",
            "Search and category filters keep the directory useful as the number of sites grows.",
            "The `/go` entry keeps navigation consistent while preserving the target URL.",
          ]
        : [
            "封面、简介、访问路径和热度会随着轮播切换同步更新。",
            "搜索和分类可以在站点变多后继续保持入口清晰。",
            "统一通过 `/go` 入口跳转，既保持导航一致，也保留真实目标地址。",
          ],
  };

  return (locale === "en" ? enNarratives[site.slug] : zhNarratives[site.slug]) ?? fallback;
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
      siteProfile: "Site profile",
      entryPath: "Entry path",
      siteRole: "Role",
      visitHeat: "Visit heat",
      browseMood: "Browse mood",
      highlights: "Site highlights",
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
    siteProfile: "站点档案",
    entryPath: "访问入口",
    siteRole: "用途定位",
    visitHeat: "浏览热度",
    browseMood: "浏览感觉",
    highlights: "站点亮点",
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
