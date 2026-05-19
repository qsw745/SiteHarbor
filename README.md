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

Docker builds use `npm run build:docker` and skip Next.js' internal typecheck so weak servers can build without hanging. Always run `npm run typecheck` locally before pushing.

## Production Deployment

Target server:

- IP: `101.37.21.147`
- SSH user: `root`
- App directory: `/opt/siteharbor`
- Container port binding: `127.0.0.1:3000:3000`
- Reverse proxy: existing Nginx
- Final domain placeholder: `<PORTAL_DOMAIN>`

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

Start the app:

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f --tail=100
```

Nginx:

```bash
cp deploy/nginx.siteharbor.conf /etc/nginx/sites-available/siteharbor.conf
sed -i 's/<PORTAL_DOMAIN>/your-real-domain.example/g' /etc/nginx/sites-available/siteharbor.conf
ln -s /etc/nginx/sites-available/siteharbor.conf /etc/nginx/sites-enabled/siteharbor.conf
nginx -t
systemctl reload nginx
```

HTTPS with Certbot:

```bash
certbot --nginx -d your-real-domain.example
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
ssh root@101.37.21.147
cd /opt/siteharbor
git pull
docker compose up -d --build
docker compose logs -f --tail=100
```

## Rollback

```bash
ssh root@101.37.21.147
cd /opt/siteharbor
git log --oneline -5
git checkout <stable-commit>
docker compose up -d --build
```

SQLite data is stored in the Docker volume `siteharbor-data`, so code rollback does not delete site records.

## Security Notes

- Do not commit `.env`, SQLite database files, server credentials, or production logs.
- Use a long random `SESSION_SECRET`.
- Wrap bcrypt hashes in single quotes in `.env` so Docker Compose does not treat `$` characters as variable interpolation.
- Replace `<PORTAL_DOMAIN>` before enabling HTTPS.
- Keep the GitHub repository public only because no production secrets or data are committed.
