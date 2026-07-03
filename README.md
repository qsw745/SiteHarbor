# SiteHarbor

SiteHarbor is a small portal for servers that host multiple websites. Visitors open one URL, search or filter the visible cards, and jump to the managed target sites. An administrator maintains sites and categories from a private web UI.

Live deployment: <https://qisw.top/>

## Highlights

- Public site directory with search, category filtering, and per-card click stats
- Bilingual UI (中文 / English) with a one-click toggle, preference stored in a cookie
- Single-admin password login, resettable from the persisted SQLite database
- CRUD for sites and categories from the admin dashboard
- One-click Nginx config scan that imports discovered product routes into `产品网站`
- Click counts filter out browser prefetch, bot user-agents, and same-IP repeats within 60 s
- Gradient avatar fallback when a site's favicon is missing or blank
- Docker Compose deployment behind an existing Nginx reverse proxy
- Build-once-deploy-image flow so the production server never runs `npm ci` or `next build`

## Stack

- **Framework** Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- **Styling** Tailwind CSS v4 + custom design tokens in `src/app/globals.css`
- **Database** Prisma 6 + SQLite (file-based, persisted in a Docker volume)
- **Auth** Single admin account in SQLite, bcrypt password hash + HMAC-signed session cookie
- **Deploy** `docker buildx` (linux/amd64) → image archive over SSH → `docker compose up -d --no-build`

## Repository Layout

```
src/
  app/
    layout.tsx              # Root layout, Inter font
    page.tsx                # Public homepage (server component)
    globals.css             # Design tokens, admin layout, components
    go/[slug]/route.ts      # Click redirect + counter
    admin/
      login/                # Login page + server action
      (dashboard)/
        layout.tsx          # Sidebar + topbar shell
        sites/page.tsx      # Site list + editor
        categories/page.tsx # Category management
        page.tsx            # Redirect to /admin/sites
      actions.ts            # Logout action
  components/
    SiteDirectory.tsx       # Public grid, search, filter
    SiteAvatar.tsx          # Favicon + gradient-letter fallback
    AdminNav.tsx            # Active-route nav (client)
  lib/
    prisma.ts               # Prisma client singleton
    session.ts              # Sign / verify admin cookie
    password.ts             # admin password lookup + bcrypt verify
    site-discovery.ts       # Parse Nginx server blocks
    slug.ts                 # Slug normalisation
    messages.ts             # Map ok/error query params to text
    validation.ts           # Zod schemas for form input
prisma/
  schema.prisma             # Category + Site models
  migrations/               # Generated migrations
scripts/
  deploy-image.sh           # Local build → upload → restart on server
  hash-password.mjs         # Generate a standalone bcrypt hash
  reset-admin-password.mjs  # Reset the persisted admin password
deploy/
  nginx.siteharbor.conf     # Reference Nginx fragment
  nginx-conf.d/             # Ignored local mirror of server Nginx configs
docker-compose.yml          # Local + base service definition
docker-compose.local.yml    # Local overlay (mounts deploy/nginx-conf.d for scan testing)
docker-compose.server.yml   # Server overlay (mounts /opt/nginx/conf.d read-only)
Dockerfile                  # Multi-stage prod image (Debian, Aliyun mirrors)
```

## Routes

| Path                  | Type            | Purpose                                     |
| --------------------- | --------------- | ------------------------------------------- |
| `/`                   | Server page     | Public directory                            |
| `/go/[slug]`          | Route handler   | Redirect with click counter (see filtering) |
| `/admin/login`        | Server page     | Admin login                                 |
| `/admin`              | Redirect        | → `/admin/sites`                            |
| `/admin/sites`        | Server page     | Site list + add/edit editor                 |
| `/admin/categories`   | Server page     | Category management                         |

Everything under `/admin` (except `/admin/login`) is gated by `requireAdmin()` in `src/lib/session.ts`.

## Data Model

```prisma
model Category {
  id        String @id @default(cuid())
  name      String @unique
  slug      String @unique
  sortOrder Int    @default(0)
  sites     Site[]
}

model Site {
  id          String    @id @default(cuid())
  name        String
  slug        String    @unique
  url         String
  description String?
  iconUrl     String?
  active      Boolean   @default(true)
  sortOrder   Int       @default(0)
  clickCount  Int       @default(0)
  categoryId  String?
  category    Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
}

model AdminAccount {
  id           String   @id
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

Deleting a category sets its sites' `categoryId` to `null` (they appear under 未分类).
The single admin account also lives in SQLite, so a database volume backup includes the login credential state.

## Click Count Filtering

`/go/[slug]` redirects 302 to the target URL. Increments happen **only when all of these are true**:

- The request is not a browser prefetch: skips when any of these headers indicate prefetch — `Sec-Purpose`, `Purpose`, `X-Purpose`, `X-Moz`, `Next-Router-Prefetch`, `X-Middleware-Prefetch`, or the `Sec-Fetch-Dest: empty` + `Sec-Fetch-Mode: no-cors` combination
- The `User-Agent` does not match common bots/crawlers/monitors (Googlebot, bingbot, curl, wget, headless Chrome, uptime monitors, etc.)
- The same client IP + slug pair has not been counted in the last 60 seconds (in-memory `Map`, capped at 2000 entries, pruned on overflow)

This drastically reduces inflation from refresh spam, Chrome's link-prefetch, and crawler traffic. The redirect itself always works regardless of filtering.

## Environment Variables

| Variable               | Required | Purpose                                                                                                  |
| ---------------------- | -------- | -------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`         | yes      | Prisma SQLite path. Local: `file:../data/siteharbor.db`. Container: `file:/app/data/siteharbor.db`.      |
| `SESSION_SECRET`       | yes      | HMAC key for the admin session cookie. **At least 32 characters**.                                       |
| `NEXT_PUBLIC_APP_URL`  | yes      | Public origin; in production `https://qisw.top`. Controls whether the session cookie is `Secure`.        |
| `DISCOVERY_NGINX_CONF_DIR` | no   | Directory the admin "scan Nginx" button reads. In production this is `/host/nginx/conf.d` (mounted RO). If unset, the app also checks `deploy/nginx-conf.d` for local testing. |
| `SITE_DISCOVERY_NGINX_CONF_DIR` | no | Alias for the above; either is accepted.                                                            |
| `ADMIN_PASSWORD_HASH`  | no       | Optional legacy/bootstrap seed. If `AdminAccount` is empty, the app imports this hash into SQLite.       |

Use `npm run reset-admin-password -- "<password>"` to create or reset the persisted admin password. If you keep `ADMIN_PASSWORD_HASH` for old deployments, wrap the bcrypt hash in single quotes so Docker Compose does not try to interpolate `$2b$...`.

## Environment Separation

Local development and production are two separate environments:

- Local source runs against `data/siteharbor.db` through `DATABASE_URL="file:../data/siteharbor.db"`.
- Local Docker runs against a local Docker volume named `siteharbor-data`, mounted inside the container at `/app/data`.
- Production runs on the server's own `siteharbor-data` Docker volume under `/opt/siteharbor`; it is not shared with the local machine.
- Local Nginx discovery can import production-domain URLs from mirrored files in `deploy/nginx-conf.d`, so a local `/go/<slug>` request may redirect the browser to `https://qisw.top/...`. The redirect target can be production while the SiteHarbor admin edits and click counts still write only to the local database/volume.

Use this workflow: change locally, test against the local source or local Docker environment, then deploy with `./scripts/deploy-image.sh` after verification.

## Local Development

```bash
# 1. Install
npm install

# 2. Bootstrap env
cp .env.example .env
# Set SESSION_SECRET to 32+ random characters
# Leave DATABASE_URL as file:../data/siteharbor.db for local dev

# 3. Create the database
npm run db:migrate -- --name init
npm run reset-admin-password -- "change-this-password"

# 4. Run
npm run dev
```

Open <http://localhost:3000>, then log in at <http://localhost:3000/admin/login>.

### Local Docker scan testing

To test the admin "扫描 Nginx 配置" flow locally, mirror the server Nginx configs into
the ignored local scan directory, then run the app with the local overlay:

```bash
mkdir -p deploy/nginx-conf.d
scp root@101.37.21.147:/opt/nginx/conf.d/'*.conf' deploy/nginx-conf.d/
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```

The overlay mounts `deploy/nginx-conf.d` read-only into the container, so local scans
exercise the same parser against the same production-style Nginx config without
committing server config files to the public repository.

### Useful scripts

| Command                              | What it does                                                |
| ------------------------------------ | ----------------------------------------------------------- |
| `npm run dev`                        | Next.js dev server (Turbopack)                              |
| `npm run build`                      | `prisma generate` + `tsc --noEmit` + `next build`           |
| `npm run build:docker`               | `prisma generate` + `next build` (skips local typecheck)    |
| `npm run start`                      | Run the built app, bound to `0.0.0.0:3000`                  |
| `npm run lint`                       | ESLint, zero warnings tolerated                             |
| `npm run typecheck`                  | `tsc --noEmit`                                              |
| `npm run db:generate`                | Prisma client                                               |
| `npm run db:migrate -- --name X`     | Create + apply a new migration (dev)                        |
| `npm run db:deploy`                  | Apply pending migrations (used inside the container)        |
| `npm run db:studio`                  | Open Prisma Studio                                          |
| `npm run hash-password -- "pwd"`     | Generate a standalone bcrypt hash                           |
| `npm run reset-admin-password -- "pwd"` | Create or reset the persisted admin password             |
| `npm run reset-admin-password -- --generate` | Generate and store a random admin password          |

### Pre-deploy verification

```bash
npm run lint
npm run typecheck
npm run build   # full build, includes typecheck
```

`scripts/deploy-image.sh` runs lint + typecheck before building; if you change those steps locally, keep the deploy script in sync.

## Production Deployment

Target server:

- IP: `101.37.21.147`
- SSH user: `root`
- App directory: `/opt/siteharbor`
- Container port binding: `127.0.0.1:3000:3000`
- Reverse proxy: existing Docker `nginx` container
- Public domain: <https://qisw.top/>

### First-time bootstrap

```bash
ssh root@101.37.21.147
mkdir -p /opt
cd /opt
git clone https://github.com/qsw745/SiteHarbor.git siteharbor
cd /opt/siteharbor
cp .env.example .env
```

Edit `/opt/siteharbor/.env`:

```env
DATABASE_URL="file:/app/data/siteharbor.db"
SESSION_SECRET="replace_with_at_least_32_random_characters"
NEXT_PUBLIC_APP_URL="https://qisw.top"
```

After the container has run migrations, create the first admin password:

```bash
docker compose -f docker-compose.yml -f docker-compose.server.yml up -d --no-build
docker exec siteharbor npm run reset-admin-password -- --generate
```

Connect the existing Nginx container to SiteHarbor's network (only needed once):

```bash
docker network connect siteharbor_default nginx 2>/dev/null || true
docker exec nginx nginx -t
docker exec nginx nginx -s reload
```

The active config is `/opt/nginx/conf.d/site.conf`; TLS cert + key live at `/opt/nginx/ssl/qisw.top.{pem,key}`. In production `/`, `/admin`, and `/admin/*` on `qisw.top` proxy to `http://siteharbor:3000` from inside the Nginx container.

### Regular updates

Local workflow:

```bash
git add .
git commit -m "feat: describe change"
git push
./scripts/deploy-image.sh
```

`scripts/deploy-image.sh`:

1. Refuses to run with a dirty working tree.
2. Runs `npm run lint` and `npm run typecheck`.
3. Builds `siteharbor-siteharbor:latest` for `linux/amd64` and exports it to a gzipped tar.
4. Creates a Git bundle of the `main` branch.
5. SCP's both to the server's `/tmp`.
6. On the server: `git fetch` the bundle into `/opt/siteharbor`, fast-forward merge, `docker load`, `docker compose -f docker-compose.yml -f docker-compose.server.yml up -d --no-build --force-recreate`.
7. Polls `http://127.0.0.1:3000` up to 20×2 s for a healthy response.

`docker-compose.server.yml` adds the read-only mount of `/opt/nginx/conf.d → /host/nginx/conf.d` and the `DISCOVERY_NGINX_CONF_DIR` env var, so the in-app "扫描 Nginx 配置" button can read but never write the host's Nginx config.

### Health checks

```bash
ssh root@101.37.21.147 'curl -I http://127.0.0.1:3000'
curl -I https://qisw.top/
curl -I https://qisw.top/admin/login
```

### Reset admin password

Run this on the server when the admin password is forgotten:

```bash
ssh root@101.37.21.147
docker exec siteharbor npm run reset-admin-password -- --generate
```

Use an explicit password instead when needed:

```bash
docker exec siteharbor npm run reset-admin-password -- "new-long-admin-password"
```

### Rollback

```bash
ssh root@101.37.21.147
cd /opt/siteharbor
git log --oneline -5
git checkout <stable-commit>
docker compose -f docker-compose.yml -f docker-compose.server.yml up -d --no-build
```

SQLite data is stored in the Docker volume `siteharbor-data`, so code rollback does not delete site records. To inspect the volume:

```bash
docker run --rm -v siteharbor-data:/data alpine ls -lh /data
```

### Reset click counts

There is no UI button yet. To zero out counts on the server:

```bash
ssh root@101.37.21.147
docker exec -it siteharbor sh -c 'apk add --no-cache sqlite >/dev/null 2>&1 || true; sqlite3 /app/data/siteharbor.db "UPDATE Site SET clickCount = 0;"'
```

(`sqlite3` is not bundled in the image; the easiest path is to copy the DB out, edit it locally, and copy it back, or run a one-off `prisma db execute`.)

## Site Discovery From Nginx

The admin "扫描 Nginx 配置" button reads every `*.conf` file under `DISCOVERY_NGINX_CONF_DIR` (plus `deploy/nginx-conf.d` when present locally) and looks for `server` blocks that:

- Listen on `443 ssl` (or have an `ssl_certificate` directive)
- Have a public, non-wildcard, non-IP `server_name`

For `qisw.top` the scanner also enumerates top-level `location /<segment>/` blocks, skipping internal paths like `/_next/`, `/api/`, `/admin`, `/clipboard/`, etc. Discovered URLs are inserted into category `产品网站`, deduped by URL. Known URLs get curated names/descriptions from `KNOWN_SITE_DETAILS` in `src/lib/site-discovery.ts` — extend that map if you add more first-party products.

## Internationalisation

- Two locales: `zh` (default) and `en`. Defined in `src/lib/i18n.ts`.
- The active locale is stored in the `siteharbor_locale` cookie (1-year max age, `httpOnly: false` so it can be inspected in DevTools).
- Server components read the cookie via `getActiveDictionary()` in `src/lib/locale.ts` and pass the dictionary down.
- `<LanguageSwitcher />` (top-right of the public homepage and admin topbar) submits a server action that sets the cookie and revalidates the layout.
- Server-action results (success + error) are emitted as keys like `site-created` or `err-slug-taken` in the `?ok=` / `?error=` query string, then translated by `resolveMessage(dict, key, params)`. Add new strings to **both** locales in `i18n.ts` whenever you introduce a key.
- Form validation messages in `src/lib/validation.ts` are also keys (e.g. `err-name-required`), translated on display.

## UI Notes

- Public homepage hides any "admin" entry. Administrators access the dashboard by going to `/admin` directly (or bookmarking it).
- Site avatars always show a slug-hashed gradient + first character. If a usable favicon (≥16×16) loads, it fades in on top; otherwise the gradient stays.
- Admin sidebar and main content scroll independently (`overflow-y: auto` on each column, full-viewport height `100dvh`). Below 900 px the layout collapses to a single column.
- All admin form submissions are React Server Actions; success/error feedback round-trips via the `?ok=` / `?error=` query string and `lib/messages.ts`.

## Security Notes

- Do not commit `.env`, the SQLite database file, server credentials, or production logs (`.gitignore` already excludes them).
- Use a long, random `SESSION_SECRET`.
- Admin password hashes are stored in SQLite and should be reset through `reset-admin-password`. Keep old `ADMIN_PASSWORD_HASH` values out of Git.
- The session cookie is marked `Secure` only when `NODE_ENV=production` **and** `NEXT_PUBLIC_APP_URL` starts with `https://`.
- Login and reset-token submissions are rate limited in memory per client IP (10 login failures / 5 reset failures per 15 minutes); counters reset on success or process restart.
- `verifyAdminLogin` runs a dummy bcrypt compare when the username does not match, so response timing does not reveal whether a username exists.
- `next.config.ts` sets security headers on every response: CSP (self-only scripts, `img-src https:` for favicons, `frame-ancestors 'none'`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, and HSTS.
- Production HTTPS currently uses <https://qisw.top/>.
- The GitHub repository is public because no production secrets or data are committed; double-check before adding new files.

## Troubleshooting

| Symptom                                                  | Likely cause / fix                                                                                                                |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `SESSION_SECRET must be set to at least 32 characters.`  | Set `SESSION_SECRET` to a 32+ character random string in `.env`.                                                                  |
| Login form rejects the correct password                  | Reset the persisted password with `docker exec siteharbor npm run reset-admin-password -- --generate`.                             |
| Login says the admin password is not configured          | Run migrations, then run `npm run reset-admin-password -- "<password>"` locally or inside the container.                           |
| `docker compose` fails with `network ... not found`      | Run `docker network connect siteharbor_default nginx` on the server, then reload Nginx.                                            |
| `prisma: command not found` during a manual server build | Use `scripts/deploy-image.sh` instead — production should never run `npm ci` / `next build`.                                       |
| Click counts not increasing                              | Expected for prefetch/bot UAs and same-IP repeats within 60 s. Hit `/go/<slug>` from a clean browser or curl with a real UA.        |
| Favicons not showing on cards                            | Either the site has no `iconUrl`, or the fetched image is < 16×16. The gradient letter is the intended fallback.                  |
| Sidebar scrolls together with main content               | You're on a viewport < 900 px (responsive collapse), or `.admin-shell`'s `height: 100dvh` was overridden — check `globals.css`.    |

## License

No license file ships with this repository. The code is intended for the author's personal portal and is not packaged for redistribution.
