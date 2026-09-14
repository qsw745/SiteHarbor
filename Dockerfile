FROM node:24-bookworm-slim AS base
RUN sed -i 's|http://deb.debian.org/debian|http://mirrors.ustc.edu.cn/debian|g; s|http://deb.debian.org/debian-security|http://mirrors.ustc.edu.cn/debian-security|g' /etc/apt/sources.list.d/debian.sources \
  && apt-get -o Acquire::Retries=3 -o Acquire::http::Timeout=30 -o Acquire::https::Timeout=30 update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
WORKDIR /app
ARG NPM_REGISTRY=https://registry.npmmirror.com
ENV NPM_CONFIG_REGISTRY=${NPM_REGISTRY}

COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN --mount=type=cache,id=siteharbor-npm,target=/root/.npm \
  sed -i -E "s#https://registry\.(npmmirror\.com|npmjs\.org)#${NPM_CONFIG_REGISTRY}#g" package-lock.json \
  && npm ci --maxsockets=5 --no-audit --no-fund
RUN npx prisma generate

FROM deps AS production-deps
RUN --mount=type=cache,id=siteharbor-npm,target=/root/.npm \
  npm prune --omit=dev --ignore-scripts --offline --no-audit --no-fund

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build:docker
RUN rm -rf .next/cache

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ARG NPM_REGISTRY=https://registry.npmmirror.com
ENV NPM_CONFIG_REGISTRY=${NPM_REGISTRY}

COPY --from=production-deps /app/package*.json ./
COPY --from=production-deps /app/prisma ./prisma
COPY --from=production-deps /app/node_modules ./node_modules

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/scripts ./scripts

RUN mkdir -p /app/data

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
