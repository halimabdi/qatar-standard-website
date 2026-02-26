FROM node:22-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN NODE_ENV=development npm ci

FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app

# Build tools needed to recompile native modules + curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ curl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000

RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs

# Create data directory for SQLite DB (will be mounted as volume)
RUN mkdir -p /data && chown nextjs:nodejs /data

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy package files and rebuild better-sqlite3 natively for this Node.js version
COPY --from=builder /app/package*.json ./
RUN npm rebuild better-sqlite3 --build-from-source

USER nextjs

EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1
CMD ["node", "server.js"]
