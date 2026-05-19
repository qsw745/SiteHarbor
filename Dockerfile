FROM node:24-bookworm AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate

FROM node:24-bookworm AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-bookworm AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --omit=dev
RUN npx prisma generate

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

RUN mkdir -p /app/data

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
