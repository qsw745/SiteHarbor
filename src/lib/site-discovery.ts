import { promises as fs } from "node:fs";
import path from "node:path";

import { makeSlug } from "@/lib/slug";

export type DiscoveredSite = {
  description: string;
  iconUrl: string | null;
  name: string;
  slug: string;
  sortOrder: number;
  url: string;
};

type Block = {
  body: string;
  header: string;
};

const DISCOVERY_PATHS = [
  process.env.DISCOVERY_NGINX_CONF_DIR,
  process.env.SITE_DISCOVERY_NGINX_CONF_DIR,
].filter((value): value is string => Boolean(value));

const EXCLUDED_DOMAINS = new Set(["admin.qisw.top"]);

const EXCLUDED_PATH_PREFIXES = [
  "/_next/",
  "/admin",
  "/admin-api/",
  "/api/",
  "/benliu-api/",
  "/benliu-admin/",
  "/clipboard/",
  "/downloads/",
  "/input/",
  "/ws/",
];

const EXCLUDED_EXACT_PATHS = new Set([
  "/debug",
  "/frame.jpg",
  "/health",
  "/schedule-email",
  "/session/trust",
]);

const KNOWN_SITE_DETAILS: Record<string, Pick<DiscoveredSite, "description" | "name" | "slug">> = {
  "https://qisw.top/": {
    name: "网站管理",
    slug: "siteharbor",
    description: "服务器网站聚合管理入口。",
  },
  "https://qisw.top/benliu/": {
    name: "奔流",
    slug: "benliu",
    description: "部署在 qisw.top 下的奔流产品网站。",
  },
  "https://qisw.top/birthday/": {
    name: "生日提醒",
    slug: "birthday",
    description: "部署在 qisw.top 下的生日提醒服务。",
  },
  "https://profiledock.qisw.top/": {
    name: "ProfileDock",
    slug: "profiledock",
    description: "ProfileDock 产品网站。",
  },
};

export async function discoverServerSites() {
  const candidates = new Map<string, DiscoveredSite>();

  for (const discoveryPath of DISCOVERY_PATHS) {
    for (const filePath of await listConfigFiles(discoveryPath)) {
      const content = await fs.readFile(filePath, "utf8");
      for (const site of discoverFromNginxConfig(content)) {
        candidates.set(site.url, site);
      }
    }
  }

  return Array.from(candidates.values()).sort((left, right) => {
    return left.sortOrder - right.sortOrder || left.name.localeCompare(right.name);
  });
}

async function listConfigFiles(rootPath: string): Promise<string[]> {
  try {
    const stats = await fs.stat(rootPath);
    if (stats.isFile()) return rootPath.endsWith(".conf") ? [rootPath] : [];
    if (!stats.isDirectory()) return [];
  } catch {
    return [];
  }

  const entries = await fs.readdir(rootPath, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(rootPath, entry.name);
      if (entry.isDirectory()) return listConfigFiles(entryPath);
      if (entry.isFile() && entry.name.endsWith(".conf")) return [entryPath];
      return [];
    }),
  );

  return files.flat();
}

function discoverFromNginxConfig(content: string) {
  const sites: DiscoveredSite[] = [];
  const stripped = stripComments(content);

  for (const server of findBlocks(stripped, "server")) {
    const domains = extractServerNames(server.body).filter(isPublicDomain);
    if (!domains.length) continue;
    if (!isHttpsServer(server.body)) continue;

    const protocol = "https";
    const primaryDomain = pickPrimaryDomain(domains);
    if (!primaryDomain) continue;

    if (shouldIncludeRoot(primaryDomain)) {
      sites.push(makeSite(protocol, primaryDomain, "/", sites.length));
    }

    if (primaryDomain === "qisw.top") {
      for (const location of findBlocks(server.body, "location")) {
        const locationPath = extractLocationPath(location.header);
        if (!locationPath || !shouldIncludePath(locationPath)) continue;
        sites.push(makeSite(protocol, primaryDomain, normalizeProductPath(locationPath), sites.length));
      }
    }
  }

  return dedupeSites(sites);
}

function stripComments(content: string) {
  return content
    .split("\n")
    .map((line) => line.replace(/\s+#.*$/, ""))
    .join("\n");
}

function findBlocks(content: string, keyword: "location" | "server"): Block[] {
  const blocks: Block[] = [];
  const pattern = keyword === "server" ? /\bserver\s*\{/g : /\blocation\s+[^{}]+\{/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content))) {
    const openBraceIndex = content.indexOf("{", match.index);
    const closeBraceIndex = findMatchingBrace(content, openBraceIndex);
    if (closeBraceIndex === -1) continue;

    blocks.push({
      header: content.slice(match.index, openBraceIndex).trim(),
      body: content.slice(openBraceIndex + 1, closeBraceIndex),
    });
    pattern.lastIndex = closeBraceIndex + 1;
  }

  return blocks;
}

function findMatchingBrace(content: string, openBraceIndex: number) {
  let depth = 0;
  for (let index = openBraceIndex; index < content.length; index += 1) {
    if (content[index] === "{") depth += 1;
    if (content[index] === "}") depth -= 1;
    if (depth === 0) return index;
  }
  return -1;
}

function extractServerNames(body: string) {
  const match = body.match(/server_name\s+([^;]+);/);
  if (!match) return [];
  return match[1].split(/\s+/).map((item) => item.trim()).filter(Boolean);
}

function isHttpsServer(body: string) {
  return /listen\s+[^;]*443[^;]*ssl/.test(body) || /ssl_certificate\s+/.test(body);
}

function isPublicDomain(domain: string) {
  if (domain === "_" || domain.includes("*")) return false;
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(domain)) return false;
  return !EXCLUDED_DOMAINS.has(domain);
}

function pickPrimaryDomain(domains: string[]) {
  return domains.find((domain) => !domain.startsWith("www.")) ?? domains[0] ?? "";
}

function shouldIncludeRoot(domain: string) {
  if (domain === "qisw.top") return true;
  return domain.endsWith(".qisw.top") && !domain.startsWith("www.");
}

function extractLocationPath(header: string) {
  const parts = header.replace(/^location\s+/, "").trim().split(/\s+/);
  const candidate = parts.find((part) => part.startsWith("/"));
  return candidate ?? "";
}

function shouldIncludePath(locationPath: string) {
  const normalizedPath = normalizeProductPath(locationPath);
  if (normalizedPath === "/") return false;
  if (EXCLUDED_EXACT_PATHS.has(normalizedPath.replace(/\/$/, ""))) return false;
  if (/\.[a-z0-9]{2,5}$/i.test(normalizedPath)) return false;
  if (EXCLUDED_PATH_PREFIXES.some((prefix) => normalizedPath.startsWith(prefix))) return false;

  const segments = normalizedPath.split("/").filter(Boolean);
  return segments.length === 1;
}

function normalizeProductPath(locationPath: string) {
  const clean = locationPath.split("?")[0].replace(/\/+$/, "");
  return clean === "" ? "/" : `${clean}/`;
}

function makeSite(protocol: string, domain: string, sitePath: string, index: number): DiscoveredSite {
  const url = `${protocol}://${domain}${sitePath}`;
  const known = KNOWN_SITE_DETAILS[url];
  const fallbackName = sitePath === "/" ? titleFromDomain(domain) : titleFromPath(sitePath);
  const name = known?.name ?? fallbackName;
  const fallbackSlug = makeSlug(name) || makeSlug(`${domain}-${sitePath}`);

  return {
    description: known?.description ?? `从 Nginx 配置自动发现：${url}`,
    iconUrl: `${protocol}://${domain}/favicon.ico`,
    name,
    slug: known?.slug ?? fallbackSlug,
    sortOrder: index * 10,
    url,
  };
}

function titleFromDomain(domain: string) {
  return domain
    .replace(/\.qisw\.top$/, "")
    .split(/[.-]+/)
    .filter(Boolean)
    .map(capitalize)
    .join(" ") || domain;
}

function titleFromPath(sitePath: string) {
  return sitePath.split("/").filter(Boolean).map(capitalize).join(" ");
}

function capitalize(value: string) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}

function dedupeSites(sites: DiscoveredSite[]) {
  const seen = new Map<string, DiscoveredSite>();
  for (const site of sites) {
    seen.set(site.url, site);
  }
  return Array.from(seen.values());
}
