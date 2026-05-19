# SiteHarbor Long-Term Memory

## Project Intent

SiteHarbor is a website aggregation and management portal for a server that hosts multiple websites. The public page lets visitors search, filter, and jump to managed sites. The admin area maintains site entries, categories, ordering, and enabled/disabled state.

## Current Architecture

- Framework: Next.js App Router with TypeScript.
- UI: Tailwind CSS with a restrained admin-console style.
- UI design reference: `docs/design/siteharbor-admin-ui-reference.png`.
- Current admin direction: left sidebar control deck, top command bar, metric panels, site table, right-side add-site editor, and compact public portal preview.
- Database: Prisma + SQLite.
- Authentication: one administrator password, stored as `ADMIN_PASSWORD_HASH`; login session is an HTTP-only signed cookie using `SESSION_SECRET`.
- Redirect behavior: `/go/[slug]` increments `clickCount` and redirects to the target URL.
- Production runtime: Docker Compose.
- Docker image base stage installs `openssl` and `ca-certificates` from Aliyun Debian mirrors so Prisma can detect OpenSSL during generate, migration, and runtime on the China-hosted server.
- Deployment should build the `linux/amd64` Docker image locally with `scripts/deploy-image.sh`, upload it to the server, and start with `docker compose up -d --no-build`; avoid running expensive builds on the low-memory server.
- Reverse proxy: Nginx on the host.

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
- Nginx domain placeholder: `<PORTAL_DOMAIN>`
- Server check on 2026-05-19: `nginx` command was not installed, so do not assume Nginx is available until the real domain/proxy choice is confirmed.
- Production data: Docker volume `siteharbor-data`, mounted at `/app/data`
- Production database URL inside container: `file:/app/data/siteharbor.db`
- Docker production builds use `npm run build:docker`, which skips Next.js internal typechecking; run `npm run typecheck` locally before pushing.

## Operational Commands

Local verification:

```bash
npm run lint
npm run typecheck
npm run build
```

Generate admin password hash:

```bash
npm run hash-password -- "new-admin-password"
```

Server update:

```bash
./scripts/deploy-image.sh
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

- Replace `<PORTAL_DOMAIN>` with the real public domain before running Nginx and Certbot deployment commands.
