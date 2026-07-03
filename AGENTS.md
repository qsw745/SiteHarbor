# SiteHarbor Long-Term Memory

## Project Intent

SiteHarbor is a website aggregation and management portal for a server that hosts multiple websites. The public page lets visitors search, filter, and jump to managed sites. The admin area maintains site entries, categories, ordering, and enabled/disabled state.

## Current Architecture

- Framework: Next.js App Router with TypeScript.
- UI: Tailwind CSS with a restrained admin-console style.
- UI design reference: Harbor Control direction generated with Product Design; original reference remains at `docs/design/siteharbor-admin-ui-reference.png`.
- Brand assets: app/logo icon at `public/brand/siteharbor-icon.png`, also copied to `public/icon.png` and `public/apple-icon.png`.
- Current UI direction: light Harbor Control console with sea-teal primary color, real harbor icon lockup, left sidebar control deck, top command bar, metric panels, grouped site rows, right-side add-site editor, and compact public portal/directory experience.
- Public directory surface: `SiteDirectory` uses the "Harbor Manifest" visual system (`.harbor-*` CSS rules): serif editorial masthead (Fraunces display font with CJK serif fallback via `--display-font`), ledger-style stats, search + category chips, a featured most-visited site card with gradient cover and curated per-slug narrative, and a numbered manifest grid reusing `SiteAvatar` fallback gradients. When changing this page, keep `src/components/SiteDirectory.tsx`, `src/components/SiteAvatar.tsx`, and the `.harbor-*` CSS rules in `src/app/globals.css` aligned.
- Database: Prisma + SQLite.
- Authentication: one administrator account in SQLite table `AdminAccount`; username defaults to `admin`, passwords are bcrypt hashes, and login sessions are HTTP-only signed cookies using `SESSION_SECRET`.
- Admin recovery: `AdminAccount` stores `sessionVersion`, optional reset token hash, and reset-token expiry. Reset links are short-lived operational tools, not persistent credentials.
- Redirect behavior: `/go/[slug]` increments `clickCount` and redirects to the target URL.
- Environment model: local source, local Docker, and production use separate SQLite files/volumes. Local `/go/[slug]` may redirect to production-domain target URLs imported from mirrored Nginx configs, but local admin edits and click counts stay in the local database/volume until deployment.
- Production runtime: Docker Compose.
- Docker image base stage installs `openssl` and `ca-certificates` from Aliyun Debian mirrors so Prisma can detect OpenSSL during generate, migration, and runtime on the China-hosted server.
- Deployment should build the `linux/amd64` Docker image locally with `scripts/deploy-image.sh`, upload it to the server, and start with `docker compose up -d --no-build`; avoid running expensive builds on the low-memory server.
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
- Production data: Docker volume `siteharbor-data`, mounted at `/app/data`
- Production database URL inside container: `file:/app/data/siteharbor.db`
- Production admin password reset: `docker exec siteharbor npm run reset-admin-password -- --generate`
- Production admin reset link: `docker exec siteharbor npm run issue-admin-reset-token`
- Docker production builds use `npm run build:docker`, which skips Next.js internal typechecking; run `npm run typecheck` locally before pushing.
- UI QA evidence lives in `design-qa.md` and `docs/design/qa/`; when changing the Harbor Control shell, refresh the relevant desktop/mobile screenshots instead of relying on visual memory.
- 2026-06-23 outage note: `qisw.top` and SSH were TCP-open but application-layer timed out from multiple regions. After ECS reboot, logs showed the 1.8GiB server had no swap and repeated OOMs around `dnf makecache`; `/swapfile` 2G was added, `vm.swappiness=10` set, `dnf-makecache.timer` disabled, and unused Docker images pruned. Treat future "site dead + SSH banner timeout" incidents as likely host resource starvation before changing SiteHarbor code.

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

## Pending External Input

- No domain placeholder is pending. Current production domain is `https://qisw.top/`.
