# SiteHarbor Long-Term Memory

## Project Intent

SiteHarbor is a website aggregation and management portal for a server that hosts multiple websites. The public page lets visitors search, filter, and jump to managed sites. The admin area maintains site entries, categories, ordering, and enabled/disabled state.

## Current Architecture

- Framework: Next.js App Router with TypeScript.
- UI: Tailwind CSS with a restrained admin-console style.
- UI design reference: `docs/design/siteharbor-admin-ui-reference.png`.
- Current admin direction: left sidebar control deck, top command bar, metric panels, site table, right-side add-site editor, and compact public portal preview.
- Database: Prisma + SQLite.
- Authentication: one administrator password, stored in SQLite table `AdminAccount`; legacy `ADMIN_PASSWORD_HASH` is only a first-run/old-deployment seed when the table is empty. Login session is an HTTP-only signed cookie using `SESSION_SECRET`.
- Redirect behavior: `/go/[slug]` increments `clickCount` and redirects to the target URL.
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
- Admin site discovery: `/admin/sites` has a "扫描现有站点" action that reads Nginx config, imports product routes into category `产品网站`, and avoids duplicate URLs.
- Production data: Docker volume `siteharbor-data`, mounted at `/app/data`
- Production database URL inside container: `file:/app/data/siteharbor.db`
- Production admin password reset: `docker exec siteharbor npm run reset-admin-password -- --generate`
- Docker production builds use `npm run build:docker`, which skips Next.js internal typechecking; run `npm run typecheck` locally before pushing.

## Operational Commands

Local verification:

```bash
npm run lint
npm run typecheck
npm run build
```

Reset admin password:

```bash
npm run reset-admin-password -- "new-admin-password"
# or generate a random one:
npm run reset-admin-password -- --generate
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
- Keep production site data in SQLite on the server, not in the public GitHub repository.
- Update this file when architecture, deployment paths, server details, or operational commands change.
- Keep the first version single-admin unless a future requirement explicitly asks for multi-user roles.
- Do not edit existing Nginx site configs without first identifying which domain/server block is affected.

## Pending External Input

- No domain placeholder is pending. Current production domain is `https://qisw.top/`.
