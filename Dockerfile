FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
# NODE_ENV=development ensures devDependencies (including better-sqlite3 build tools) are installed
RUN NODE_ENV=development npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

# gcompat provides glibc compatibility layer needed by better-sqlite3 pre-built binaries
RUN apk add --no-cache python3 make g++ curl gcompat

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser  --system --uid 1001 nextjs

# Create data directory for SQLite DB (will be mounted as volume)
RUN mkdir -p /data && chown nextjs:nodejs /data

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1
CMD ["node", "server.js"]
