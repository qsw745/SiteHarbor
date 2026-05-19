# SiteHarbor

SiteHarbor is a small website portal for a server that hosts multiple sites. Visitors open one address, search or filter the visible cards, and jump to the managed target sites. An administrator can maintain sites and categories from the web UI.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS
- Prisma + SQLite
- Single-admin password login with HTTP-only cookies
- Docker Compose deployment behind Nginx

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create local env:

   ```bash
   cp .env.example .env
   npm run hash-password -- "change-this-password"
   ```

3. Put the generated hash into `ADMIN_PASSWORD_HASH` in `.env`, then set a random `SESSION_SECRET` with at least 32 characters.

4. Create the database:

   ```bash
   npm run db:migrate -- --name init
   ```

5. Run the app:

   ```bash
   npm run dev
   ```

Open `http://localhost:3000`, then login at `http://localhost:3000/admin/login`.

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```

Docker builds use `npm run build:docker` and skip Next.js' internal typecheck. Production deployment builds the `linux/amd64` Docker image locally and uploads it to the server, so the low-memory server does not run `npm ci` or `next build`.

## Production Deployment

Target server:

- IP: `101.37.21.147`
- SSH user: `root`
- App directory: `/opt/siteharbor`
- Container port binding: `127.0.0.1:3000:3000`
- Reverse proxy: existing Docker `nginx` container
- Public domain: `https://qisw.top/`

Initial deployment on the server:

```bash
ssh root@101.37.21.147
mkdir -p /opt
cd /opt
git clone https://github.com/qsw745/SiteHarbor.git siteharbor
cd /opt/siteharbor
cp .env.example .env
npm run hash-password -- "replace-with-admin-password"
```

Edit `/opt/siteharbor/.env`:

```env
DATABASE_URL="file:/app/data/siteharbor.db"
ADMIN_PASSWORD_HASH='paste_generated_hash_here'
SESSION_SECRET="replace_with_at_least_32_random_characters"
NEXT_PUBLIC_APP_URL="https://<PORTAL_DOMAIN>"
```

For the current production deployment, use:

```env
NEXT_PUBLIC_APP_URL="https://qisw.top"
```

Build locally, upload the image, and start the app:

```bash
./scripts/deploy-image.sh
```

Current Nginx deployment:

```bash
ssh root@101.37.21.147
docker network connect siteharbor_default nginx 2>/dev/null || true
docker exec nginx nginx -t
docker exec nginx nginx -s reload
```

The active config is `/opt/nginx/conf.d/site.conf`. The `qisw.top` TLS certificate is already mounted at `/opt/nginx/ssl/qisw.top.pem` and `/opt/nginx/ssl/qisw.top.key`. In production, `/`, `/admin`, and `/admin/*` on `qisw.top` proxy to `http://siteharbor:3000` from inside the Nginx container.

Health checks:

```bash
ssh root@101.37.21.147 'curl -I http://127.0.0.1:3000'
curl -I https://qisw.top/
curl -I https://qisw.top/admin/login
```

## Updates

Local workflow:

```bash
git add .
git commit -m "feat: describe change"
git push
```

Server update:

```bash
./scripts/deploy-image.sh
```

The deploy script runs local lint/typecheck, builds a `linux/amd64` image, sends a Git bundle and image archive to the server, loads the image there, then runs `docker compose up -d --no-build`.

## Rollback

```bash
ssh root@101.37.21.147
cd /opt/siteharbor
git log --oneline -5
git checkout <stable-commit>
docker compose up -d --no-build
```

SQLite data is stored in the Docker volume `siteharbor-data`, so code rollback does not delete site records.

## Security Notes

- Do not commit `.env`, SQLite database files, server credentials, or production logs.
- Use a long random `SESSION_SECRET`.
- Wrap bcrypt hashes in single quotes in `.env` so Docker Compose does not treat `$` characters as variable interpolation.
- Production HTTPS currently uses `https://qisw.top/`.
- Keep the GitHub repository public only because no production secrets or data are committed.
