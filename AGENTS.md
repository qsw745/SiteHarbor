# SiteHarbor Long-Term Memory

## Project Intent

SiteHarbor is a website aggregation and management portal for a server that hosts multiple websites. The public page lets visitors search, filter, and jump to managed sites. The admin area maintains site entries, categories, ordering, and enabled/disabled state.

## Current Architecture

- Framework: Next.js App Router with TypeScript.
- UI: Tailwind CSS with a restrained admin-console style.
- UI design reference: Harbor Control direction generated with Product Design; original reference remains at `docs/design/siteharbor-admin-ui-reference.png`.
- Brand assets: app/logo icon at `public/brand/siteharbor-icon.png`, also copied to `public/icon.png` and `public/apple-icon.png`.
- Current UI direction: light Harbor Control console with sea-teal primary color, real harbor icon lockup, left sidebar control deck, top command bar, metric panels, grouped site rows, right-side add-site editor, and compact public portal/directory experience.
- Public directory surface: `SiteDirectory` uses a sea-glass palette with a compact serif masthead, inline stats, a dark teal most-visited feature beside the introduction, and a three-column product grid (two columns on tablet, one on mobile). Search/category/sort mode shows all matching products as ordinary cards so the featured position never breaks ordering. Search supports legacy Birthday/Exam names, clear/Escape, reset-empty-state, and category `aria-pressed` state. With a single category in use, the category chips, card tags and category stat are hidden and the controls row gets `harbor-controls-row-compact` (a `:not(:has(...))` rule was silently missing from the compiled CSS when tried, so use classes). Card descriptions clamp to three lines with the full text in `title`. Keep `src/components/SiteDirectory.tsx`, `src/components/SiteAvatar.tsx`, and `.harbor-*` CSS in `src/app/globals.css` aligned. `SiteAvatar` must keep the slug-hashed gradient plus first-letter fallback visible until a favicon is confirmed loaded; preserve the ref-based DOM inspection because load/error may happen before hydration.
- Fonts: Inter and Fraunces Latin variable fonts are bundled under `src/app/fonts` with OFL licenses and loaded through `next/font/local`; builds must not depend on reaching Google Fonts. Chinese uses system font fallbacks.
- Database: Prisma + SQLite.
- Authentication: one administrator account in SQLite table `AdminAccount`; username defaults to `admin`, passwords are bcrypt hashes, and login sessions are HTTP-only signed cookies using `SESSION_SECRET`. Login failures are rate-limited in memory per client IP at 10 failures per 15 minutes, reset-token failures at 5 per 15 minutes, and counters clear on success or process restart.
- Login hardening: `verifyAdminLogin` intentionally runs a dummy bcrypt compare for unknown usernames so timing does not reveal whether an account exists; do not short-circuit that path when refactoring password checks.
- Admin recovery: `AdminAccount` stores `sessionVersion`, optional reset token hash, and reset-token expiry. Reset links are short-lived operational tools, not persistent credentials.
- Redirect behavior: `/go/[slug]` increments `clickCount` and redirects to the target URL.
- Environment model: local source, local Docker, and production use separate SQLite files/volumes. Local `/go/[slug]` may redirect to production-domain target URLs imported from mirrored Nginx configs, but local admin edits and click counts stay in the local database/volume until deployment.
- Production runtime: Docker Compose.
- Runtime images reuse pruned production dependencies and exclude npm/build caches. BuildKit keeps the npm cache outside image layers. SiteHarbor container logs rotate at 10 MB with 3 files.
- Prisma 6.19.3 currently pins vulnerable `deepmerge-ts` 7.1.5. The scoped npm override selects 8.0.0; run `node --test scripts/tests/prisma-config.test.mjs` plus Prisma generate/migrate checks when changing this override. Keep Next.js and eslint-config-next versions aligned.
- Docker image base stage installs `openssl` and `ca-certificates` from USTC Debian mirrors so Prisma can detect OpenSSL during generate, migration, and runtime on the China-hosted server.
- Deployment should build the `linux/amd64` Docker image locally with `scripts/deploy-image.sh`, upload it to the server, and start with `docker compose up -d --no-build`; avoid running expensive builds on the low-memory server.
- For slow build networks, `scripts/deploy-image.sh` accepts optional `BUILD_PROXY_URL` (Docker build HTTP/HTTPS proxy only) and `BUILD_NPM_REGISTRY` (defaults to npm mirror). The image normalizes lockfile registry URLs to the selected registry without changing package versions or integrity hashes. Proxy settings are not persisted in the runtime image.
- DNS (migrated 2026-10-06): `qisw.top` is registered at Alibaba Cloud (HiChina) and its authoritative DNS is Alibaba Cloud DNS again (`dns3.hichina.com` / `dns4.hichina.com`, free edition, 10-minute TTL); the `.top` registry switched at 18:57 CST. Records: `@`, `www`, `admin`, `notes`, `profiledock` → `101.37.21.147`; MX/SPF/`MS=` TXT and `autodiscover` CNAME for Microsoft 365; old `_dnsauth` TXT entries are harmless leftovers. The move fixed the external Uptime Kuma monitor flapping DOWN/UP, which came from ISP resolvers intermittently returning a polluted address (`103.73.220.188`) for the Cloudflare-hosted zone. `admin.qisw.top` is now served directly with its own acme.sh webroot certificate (`/opt/nginx/ssl/admin.qisw.top.pem`) and no longer has a Cloudflare-only IP allowlist (backup `admin.conf.bak-dnsmig-20261006184942`). The Cloudflare zone was kept for rollback only. All certificates renew via acme.sh webroot (HTTP-01). The domain expires 2027-01-11 and auto-renew was off on 2026-10-06.
- Reverse proxy: existing Docker container named `nginx`, with config mounted from `/opt/nginx/conf.d` and certificates from `/opt/nginx/ssl`.

## Repository

- Local path: `/Users/qsw/work/project/SiteHarbor`
- GitHub owner: `qsw745`
- Intended repo: `qsw745/SiteHarbor`
- Visibility: public
- Main branch: `main`

## Server And Deployment

- Server IP: `101.37.21.147`
- SSH user: `root`
- Deploy path: `/opt/siteharbor`
- Container binding: `127.0.0.1:3000:3000`
- Public domain: `https://qisw.top/`
- Production `NEXT_PUBLIC_APP_URL`: `https://qisw.top`
- Active Nginx config: `/opt/nginx/conf.d/site.conf`
- Active TLS certificate files: `/opt/nginx/ssl/qisw.top.pem` and `/opt/nginx/ssl/qisw.top.key`
- The `nginx` Docker container must be connected to Docker network `siteharbor_default` so it can proxy to `http://siteharbor:3000`.
- Production Nginx change on 2026-05-19: `/` plus `/admin` and `/admin/*` on `qisw.top` proxy to SiteHarbor. Existing paths such as `/benliu/`, `/birthday/`, and legacy `/api/` routes remain in `site.conf`.
- Nginx backup from the SiteHarbor cutover: `/opt/nginx/conf.d/site.conf.bak-siteharbor-20260519174601`
- Server-only compose overlay: `docker-compose.server.yml` mounts `/opt/nginx/conf.d` read-only at `/host/nginx/conf.d` and sets `DISCOVERY_NGINX_CONF_DIR=/host/nginx/conf.d`.
- Local compose overlay: `docker-compose.local.yml` mounts untracked mirrored configs from `deploy/nginx-conf.d` so `/admin/sites` can test Nginx discovery locally without server filesystem access.
- Admin site discovery: `/admin/sites` has a "扫描现有站点" action that reads Nginx config, imports product routes into category `产品网站`, and avoids duplicate URLs.
- Self-site exclusion: SiteHarbor's own entry (`https://qisw.top/`) is never imported by discovery and never rendered on the public directory or the admin public preview. `isSelfSiteUrl()` in `src/lib/self-site.ts` matches a site URL against `NEXT_PUBLIC_APP_URL` plus the comma-separated `SELF_SITE_URLS`; local runs against production-mirrored data set `SELF_SITE_URLS=https://qisw.top` (see `docker-compose.local.yml`).
- Site icons: never guess `${origin}/favicon.ico` for a path-mounted site — that file belongs to whatever serves the domain root, which on `qisw.top` is SiteHarbor. `src/lib/site-icon.ts` resolves icons from each site's own page (declared `rel=icon`/`apple-touch-icon`, then path-scoped `favicon.*`), repairs sub-path build bugs (root-relative hrefs, and base paths joined without a separator such as `/exambrand-logo.svg` → `/exam/brand-logo.svg`), and requires an image content type because SPA rewrites answer `200 text/html` for missing assets. Candidates are ranked so SVG/`sizes="any"`, then ≥96px or touch icons, beat 16/32px favicons. The admin "刷新站点图标" action re-resolves every non-curated site so icons follow product changes, keeps a stored icon that still loads when resolution fails, and only clears an icon that is dead after one retry, so the letter mark is intentional. `https://qisw.top/birthday/` now declares `favicon.svg` (verified 2026-09-14); it returns `Cross-Origin-Resource-Policy: same-origin`, so localhost previews use the letter fallback while production on the same origin can load it.
- Product icons (2026-10-06): several product websites still serve favicons older than their native app icons (岁时's cake vs. the moon-and-flame app icon, ProfileDock's card vs. the desktop pinwheel, Clario's Flutter default vs. its blue "C"). The directory therefore uses curated icons bundled in `public/product-icons/`, referenced by site-relative `/product-icons/<name>.(svg|webp|png)` paths that `isCuratedIcon()` recognises; refreshes never overwrite them and validation accepts them (the admin icon field is `type="text"` because `type="url"` rejects relative paths). Sources: 信桥 `xinqiao-sms/sms/static/sms/favicon.svg`; 奔流 `idm-app/crates/benliu_app/icons/icon.png`; 岁时 `birthday/ios/BirthdayMobile/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png`; ProfileDock `ProfileDock/apps/desktop/src-tauri/icons/icon.png`; 青松笔记 `QSWNotes/public/favicon.svg`; CloudShellConsole `CloudShellConsole/CloudShellConsole/Assets.xcassets/AppIcon.appiconset/icon_1024.png`; 问衡 `online-exam-system/apps/web/public/brand-logo.svg`; Clario `Clario/Clario/Assets.xcassets/AppIcon.appiconset/AppIcon-mac-1024.png`; RDesk `rdesk/design/app-icon-1024.png`; 盘屿 `Volisle/assets/brand/app-icon-1024.png` (all under `/Volumes/Data/work/project/`). Raster icons are cropped to the opaque tile (alpha ≥ 200, dropping macOS margins and shadows), squared, resized to 256px and saved as WebP q90; SVGs are copied as-is. When a product rebrands, regenerate its file and keep the path. Migration `20261006100000_bundle_product_icons` points the ten known product URLs at these files.
- Product brands: Birthday is “岁时” (full product name “岁时·农历生日提醒”); the exam system is “问衡”. Migration `20260914040000_refresh_product_brands` updates only known legacy names/URLs, fills missing brand icons, and preserves IDs, slugs and click counts. `/go/online-exam` stays stable while its destination becomes `https://qisw.top/wenheng/`. Discovery canonicalizes `/exam/` to `/wenheng/` before deduplication. These changes reach each database only when its migration is applied.
- Production data: Docker volume `siteharbor_siteharbor-data` (Compose key `siteharbor-data`), mounted at `/app/data`
- Production database URL inside container: `file:/app/data/siteharbor.db`
- Server journal budget is configured in `/etc/systemd/journald.conf.d/60-siteharbor-disk-budget.conf`: `SystemMaxUse=512M`, `SystemKeepFree=2G`. For disk cleanup, preserve container-used images, tagged rollback images, volumes, and database backups; prefer `docker image prune` without `-a` for dangling images.
- Production admin password reset: `docker exec siteharbor npm run reset-admin-password -- --generate`
- Production admin reset link: `docker exec siteharbor npm run issue-admin-reset-token`
- Docker production builds use `npm run build:docker`, which skips Next.js internal typechecking; run `npm run typecheck` locally before pushing.
- UI QA evidence lives in `design-qa.md` and `docs/design/qa/`; when changing the Harbor Control shell, refresh the relevant desktop/mobile screenshots instead of relying on visual memory.
- Security headers are defined centrally in `next.config.ts` and apply to all routes: CSP, `X-Frame-Options: DENY`, `nosniff`, referrer policy, permissions policy, and HSTS. If a feature needs scripts, images, connections, or framing outside the current policy, update the header list deliberately and verify with `curl -I` instead of weakening it inline.
- 2026-06-23 outage note: `qisw.top` and SSH were TCP-open but application-layer timed out from multiple regions. After ECS reboot, logs showed the 1.8GiB server had no swap and repeated OOMs around `dnf makecache`; `/swapfile` 2G was added, `vm.swappiness=10` set, `dnf-makecache.timer` disabled, and unused Docker images pruned. Treat future "site dead + SSH banner timeout" incidents as likely host resource starvation before changing SiteHarbor code.
- 2026-09-20 outage note: the host hung from 11:46 to 13:24 CST and needed a forced reboot. Root cause was an on-server `cargo build` of `/opt/rdesk-server-src`: available memory fell to ~140 MB, page-cache thrashing pinned disk reads at ~108 MB/s (cloud-disk cap), load reached ~45 with ~93% iowait, and the kernel OOM killer never fired. For incident history use `sar -q/-r/-B/-u -f /var/log/sa/saDD` (1-minute samples, ~30 days) and `/var/log/messages*`; journald fills its 512M budget in about 5 days.
- Host memory guards (added 2026-10-06): root SSH/cron sessions are capped at 400M memory and 600M memory+swap (`user-0.slice` `MemoryLimit` plus `/etc/systemd/system/user@0.service.d/50-memsw-limit.conf`), so an oversized command is killed alone by the cgroup OOM killer. `earlyoom` (EPEL RPM, args in `/etc/default/earlyoom`) sends SIGTERM at ≤8% available memory regardless of swap, preferring compilers/package managers and avoiding mysqld/dockerd/sshd/nginx/rdesk-server. The Rust toolchain was removed from the server. Never build on the server, and never lift these limits to make a build pass; build locally and upload artifacts.

## Operational Commands

Local verification:

```bash
npm run lint
npm run typecheck
npm run build
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```

Reset admin password:

```bash
npm run reset-admin-password -- "new-admin-password"
npm run reset-admin-password -- "new-admin-password" --username "admin"
# or generate a random one:
npm run reset-admin-password -- --generate
```

Issue a one-time admin reset link:

```bash
npm run issue-admin-reset-token
```

Server update:

```bash
./scripts/deploy-image.sh
```

Nginx validation/reload:

```bash
ssh root@101.37.21.147
docker exec nginx nginx -t
docker exec nginx nginx -s reload
```

Host outage triage:

```bash
ssh root@101.37.21.147
uptime
free -h
swapon --show
df -h
docker ps -a
systemctl status dnf-makecache.timer --no-pager
journalctl -k --since "24 hours ago" | egrep -i "oom|killed|hung|blocked|docker|nginx|ext4|nvme"
journalctl --since "24 hours ago" | egrep -i "oom|killed|docker|nginx|sshd|siteharbor|dnf"
```

Server rollback:

```bash
ssh root@101.37.21.147
cd /opt/siteharbor
git log --oneline -5
git checkout <stable-commit>
docker compose up -d --no-build
```

## Maintenance Rules

- Never commit `.env`, SQLite database files, production logs, SSH keys, tokens, or real server credentials.
- Never commit mirrored server Nginx configs from `deploy/nginx-conf.d/*.conf`; keep only `.gitkeep` there and use the files locally for scan testing.
- Keep production site data in SQLite on the server, not in the public GitHub repository.
- Treat reset tokens like passwords. They are printed once by `issue-admin-reset-token`, expire quickly, and should never be copied into committed docs, logs, screenshots, or chat summaries.
- Update this file when architecture, deployment paths, server details, or operational commands change.
- Keep the first version single-admin unless a future requirement explicitly asks for multi-user roles.
- Do not edit existing Nginx site configs without first identifying which domain/server block is affected.
- Auth and reset flows use server-action error keys from `src/lib/i18n.ts`; when adding rate-limit, reset, login, or validation outcomes, add both `zh` and `en` messages and keep the returned key stable.

## Pending External Input

- No domain placeholder is pending. Current production domain is `https://qisw.top/`.
