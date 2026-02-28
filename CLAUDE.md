# Qatar Standard Website — CLAUDE.md

## Project Overview
Next.js 16 bilingual news website (`qatar-standard.com`). Arabic/English.
Deployed via Docker + Traefik on Hetzner `5.161.52.117`. GitHub → SSH pull → Docker rebuild.

## Server Setup
- **Repo on server**: `/root/qatar-standard-website/`
- **DB path**: `/data/articles.db` (SQLite, Docker volume `/data/qatar-standard:/data`)
- **SSH**: `ssh -i C:/Users/habdi/hetzner/hetzner_new_nopass root@5.161.52.117`

---

## Deployment Workflow

### Coolify Deployment (preferred)

Coolify manages the Docker build, container, Traefik labels, and env vars.

```bash
# 1. Commit and push
cd /root/qatar-standard-website
git add <files>
git commit -m "..."
git push origin master

# 2. Trigger deploy via Coolify API
curl -s -X POST "http://localhost:8010/api/v1/deploy?uuid=ikc04og8kog4s4g404co80og" \
  -H "Authorization: Bearer 23|3rT8aRdGx6E0cBtyYstcVIPvFJWo3q0SlOTfCiOH5ea1dc8b"

# 3. Check deployment status (replace UUID with deployment_uuid from step 2)
curl -s "http://localhost:8010/api/v1/deployments/<deployment_uuid>" \
  -H "Authorization: Bearer 23|3rT8aRdGx6E0cBtyYstcVIPvFJWo3q0SlOTfCiOH5ea1dc8b" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['status'])"

# 4. Fix Traefik race condition (502 after deploy)
docker restart $(docker ps --format '{{.Names}}' | grep ikc04og)

# 5. Verify
curl -s -o /dev/null -w '%{http_code}' https://qatar-standard.com/
```

### Coolify Details
- **App UUID**: `ikc04og8kog4s4g404co80og`
- **API base**: `http://localhost:8010/api/v1`
- **API token**: `23|3rT8aRdGx6E0cBtyYstcVIPvFJWo3q0SlOTfCiOH5ea1dc8b`
- **Build pack**: Dockerfile
- **Git repo**: `halimabdi/qatar-standard-website`, branch `master`
- **Env vars**: Managed in Coolify (OPENAI_API_KEY, WEBSITE_API_KEY, DB_PATH, ADMIN_PASSWORD, GHOST_URL, GHOST_CONTENT_KEY, GROQ_API_KEY, SERP_API_KEY, PEXELS_API_KEY)

### Coolify API — Managing Env Vars
```bash
# List env vars
curl -s "http://localhost:8010/api/v1/applications/ikc04og8kog4s4g404co80og/envs" \
  -H "Authorization: Bearer 23|3rT8aRdGx6E0cBtyYstcVIPvFJWo3q0SlOTfCiOH5ea1dc8b"

# Add env var
curl -s -X POST "http://localhost:8010/api/v1/applications/ikc04og8kog4s4g404co80og/envs" \
  -H "Authorization: Bearer 23|3rT8aRdGx6E0cBtyYstcVIPvFJWo3q0SlOTfCiOH5ea1dc8b" \
  -H "Content-Type: application/json" \
  -d '{"key":"VAR_NAME","value":"VAR_VALUE","is_buildtime":true,"is_preview":false}'
```

### CRITICAL: Duplicate Container Problem

**NEVER create a manual container named `qatar-standard-website`.** Coolify containers use the naming pattern `ikc04og8kog4s4g404co80og-TIMESTAMP`. If a manual `qatar-standard-website` container AND a Coolify container both exist with Traefik labels for `qatar-standard.com`, Traefik load-balances between them randomly — causing intermittent 404s and 500s.

**How to check:**
```bash
# Should show ONLY ONE container matching ikc04og
docker ps --format '{{.Names}}' | grep -E 'qatar-standard|ikc04og'
# If you see BOTH qatar-standard-website AND ikc04og*, remove the manual one:
docker stop qatar-standard-website && docker rm qatar-standard-website
```

**Root cause**: The watchdog's `restart_qatar_standard()` in `coolify.py` creates a manual container — this is BROKEN and must be fixed to restart the Coolify container instead.

### Coolify Build Gotchas
- **NODE_ENV**: Coolify injects ALL env vars as ARG into every Docker build stage, including `NODE_ENV=production`. The Dockerfile overrides this with `RUN NODE_ENV=development npm ci` in the deps stage.
- **Module-level throws**: Never throw errors at module level based on env vars (e.g., `if (!process.env.X) throw ...`). Next.js evaluates API route modules during `next build` page data collection, and build-time env vars may be missing. Defer checks to request-handling functions.
- **502 after deploy (Traefik race)**: Every Coolify deploy creates a new container with a new name. Run `docker restart $(docker ps --format '{{.Names}}' | grep ikc04og)` after deployment finishes.
- **isomorphic-dompurify / jsdom**: Do NOT use packages with native C++ bindings (jsdom, canvas, etc.) — they won't be traced into Next.js standalone output and will cause 500 errors at runtime.

### Build Logs (debugging failed deploys)
```bash
# Get build logs from Coolify Postgres
docker exec coolify-db psql -U coolify -t -c \
  "SELECT right(logs, 3000) FROM application_deployment_queues WHERE deployment_uuid='<uuid>'"
```

### Manual Deploy (fallback only — use Coolify instead)
```bash
cd /root/qatar-standard-website && git pull origin master
docker build -t qatar-standard-website .
docker stop qatar-standard-website && docker rm qatar-standard-website
docker run -d --name qatar-standard-website \
  --network coolify \
  --env-file /root/qatar-standard-website/.env.local \
  -v /data/qatar-standard:/data \
  -l 'traefik.enable=true' \
  -l 'traefik.http.routers.qatar-standard.rule=Host(`qatar-standard.com`) || Host(`www.qatar-standard.com`)' \
  -l 'traefik.http.routers.qatar-standard.entrypoints=https,http' \
  -l 'traefik.http.routers.qatar-standard.tls=true' \
  -l 'traefik.http.routers.qatar-standard.tls.certresolver=letsencrypt' \
  -l 'traefik.http.services.qatar-standard.loadbalancer.server.port=3000' \
  qatar-standard-website
```

**CRITICAL:** Always include `-v /data/qatar-standard:/data`. Without it, a fresh empty DB is used and all articles are inaccessible.
**WARNING:** If using manual deploy, ensure NO Coolify container is running (check `docker ps | grep ikc04og`). Two containers = intermittent failures.

---

## Architecture

### Stack
- **Next.js 16** App Router, TypeScript, React 19
- **SQLite** via `better-sqlite3` (server-only — never import in client components)
- **Tailwind CSS v4** — colors defined in `app/globals.css` `@theme {}` block (not tailwind.config.ts)
- **Ghost CMS** — editorial/analysis content (separate container, read-only via Content API)

### Key Files
| File | Purpose |
|------|---------|
| `lib/db.ts` | SQLite singleton + schema — server-only |
| `lib/articles.ts` | Article CRUD — server-only |
| `lib/ghost.ts` | Ghost CMS Content API client — server-only |
| `lib/categories.ts` | Category constants — safe for client |
| `contexts/LanguageContext.tsx` | EN/AR language toggle (localStorage + html dir/lang) |
| `app/api/generate/route.ts` | POST — creates article via multi-agent pipeline |
| `app/api/articles/route.ts` | GET — paginated list |
| `app/api/images/[filename]/route.ts` | GET — serve uploaded images from `/data/uploads/` |
| `components/Header.tsx` | Sticky header with nav + language toggle |
| `components/ArticleCard.tsx` | Card (sm/md/lg sizes), category gradient placeholder |
| `components/ArticleDetail.tsx` | Full article view, bilingual toggle, JSON-LD |
| `components/AdUnit.tsx` | Google AdSense (client component) |
| `public/ads.txt` | AdSense publisher verification |

### Critical Rules
1. **Never import `lib/articles.ts`, `lib/db.ts`, `lib/ghost.ts` in client components** — Node.js only
2. **Client components** use `import type { Article }` and `lib/categories.ts` only
3. **Server pages** fetch data, pass as props to client components
4. **Tailwind v4**: custom colors in `@theme {}` in `globals.css`, not in `tailwind.config.ts`
5. **`serverExternalPackages: ["better-sqlite3"]`** must stay in `next.config.ts`

### Colors
```css
maroon-800 = #8b1538   /* primary nav/header */
maroon-900 = #781333   /* footer */
gold       = #C8A96E
```

---

## Database Schema

SQLite at `/data/articles.db` (production) or `./data/articles.db` (local).

```sql
articles (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT UNIQUE NOT NULL,
  title_ar      TEXT NOT NULL,
  title_en      TEXT,
  body_ar       TEXT NOT NULL,
  body_en       TEXT,
  excerpt_ar    TEXT,
  excerpt_en    TEXT,
  category      TEXT DEFAULT 'general',
  image_url     TEXT,              -- null = show gradient placeholder in UI
  source        TEXT DEFAULT 'manual',
  source_url    TEXT,
  content_hash  TEXT,
  tweet_ar      TEXT,
  tweet_en      TEXT,
  speaker_name  TEXT,
  speaker_title TEXT,
  published_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  tweeted_at    DATETIME NULL,
  video_url     TEXT NULL
)
```

**WAL mode enabled.** Dynamic column migration on startup (adds columns if missing).

---

## Image Resolution Pipeline

`resolveImage()` in `app/api/generate/route.ts` tries in order:

1. `image_url` provided by bot/RSS (must start with `http`)
2. `og:image` scraped from `source_url`
3. SerpAPI: one `tbm=nws` call → check direct thumbnail → scrape `og:image` from result links
4. SerpAPI: `tbm=isch` Google Images fallback
5. Wikimedia Commons API: free search by article title keywords (first 5 words)
6. Pexels API: stock photo search (requires `PEXELS_API_KEY` env var)
7. Returns `''` — article stores `null`, UI shows category gradient placeholder

**SerpAPI budget:** 20 image searches/day, shared across steps 3+4.
**SerpAPI free tier:** 100 searches/month — exhausts in ~5 active days.

**Image serving:** `/api/images/[filename]` serves from `/data/uploads/` (Docker volume).
All image filenames are sanitized to `[a-zA-Z0-9._-]` before serving.

**No curated images in UI.** When `image_url` is null, `ArticleCard` and `ArticleDetail` show a category-colored gradient (`bg-gradient-to-br`) instead of a fallback photo.

---

## Article Generation Pipeline (`/api/generate`)

Multi-agent pipeline invoked by bot or manually:

```
1. Deduplication   — check source_url + content_hash (SHA256[0:16])
2. Research Agent  — fetch source URL + Playwright Bing News (from bot) + SerpAPI fallback
3. Writer Agents   — GPT-4o writes Arabic + English in parallel
4. Editor Agent    — gpt-4o-mini quality pass (remove AI clichés, fix formatting)
5. Image           — resolveImage() pipeline above
6. Save            — INSERT OR IGNORE into SQLite
```

LLM fallback: OpenAI GPT-4o → Groq llama-3.3-70b → throws if both unavailable.

---

## Hero Article Logic

`getLatestArticle()` in `lib/articles.ts`:
- Prefers categories: `gulf`, `diplomacy`, `economy`, `politics`, `africa`, `media`, `general`
- Requires real image (`image_url IS NOT NULL`)
- Published within last 48h
- Falls back to overall latest article

---

## API Reference

### POST /api/generate
```bash
curl -X POST https://qatar-standard.com/api/generate \
  -H "x-api-key: $WEBSITE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "News title",
    "title_ar": "العنوان",
    "title_en": "English title",
    "tweet_ar": "Arabic tweet text",
    "tweet_en": "English tweet text",
    "category": "diplomacy",
    "source_url": "https://source.com/article",
    "image_url": "https://image.com/photo.jpg",
    "video_url": "https://video.com/clip.mp4",
    "speaker": { "name": "Name", "title": "Title" },
    "context": "Additional context",
    "research": "Playwright Bing News snippets",
    "source": "bot",
    "published_at": "2026-01-01T12:00:00Z"
  }'
# Returns: { success: true, slug, id } or { duplicate: true, slug, id }
```

### GET /api/articles
```bash
curl "https://qatar-standard.com/api/articles?limit=20&offset=0&category=diplomacy"
```

---

## Categories
`general`, `diplomacy`, `palestine`, `economy`, `politics`, `gulf`, `media`, `turkey`, `africa`

---

## Environment Variables (`.env.local` on server — never commit)

```bash
OPENAI_API_KEY      # GPT-4o (required for article generation)
GROQ_API_KEY        # Groq llama-3.3-70b (LLM fallback)
WEBSITE_API_KEY     # Auth key for /api/generate (see security note)
DB_PATH             # SQLite dir: ./data (dev) / /data (production)
SERP_API_KEY        # SerpAPI image search (optional, 100 free/month)
PEXELS_API_KEY      # Pexels stock photo search (optional, free tier 200 req/hr)
GHOST_URL           # https://cms.qatar-standard.com
GHOST_CONTENT_KEY   # Ghost Content API key (in .env.local, not here)
CREWAI_URL          # Optional external article pipeline
ADMIN_PASSWORD      # Admin panel auth (see security note)
```

**Security notes:**
- `WEBSITE_API_KEY` has a hardcoded fallback in source (`qatar-standard-2024`) — always set this in `.env.local`
- `ADMIN_PASSWORD` is required at runtime — app throws if not set (no hardcoded fallback)
- Ghost admin credentials are in `.env.local` on the server only, not in this file

---

## Ghost CMS
- **URL**: `https://cms.qatar-standard.com`
- **Container**: `ghost-cms` on `coolify` network (port 2368)
- **Traefik config**: `/data/coolify/proxy/dynamic/ghost-cms.yaml`
- Ghost is for editorial/long-form analysis posts; news articles use SQLite via `/api/generate`
- Ghost Content API is read-only from the website side
- Admin credentials are stored in `.env.local` on the server

---

## Google AdSense
- **Publisher ID**: `ca-pub-6753180364525256`
- Script loaded in `app/layout.tsx` via `next/script` (`strategy="afterInteractive"`)
- `public/ads.txt`: `google.com, pub-6753180364525256, DIRECT, f08c47fec0942fa0`
- Use `<AdUnit slot="SLOT_ID" />` component to place ads

---

## Twitter Bot Integration
- **Bot**: `/root/qatar-standard-bot/bot.js` on server
- Posts via `POST /api/generate` with `x-api-key: $WEBSITE_API_KEY`
- `WEBSITE_URL=https://qatar-standard.com` in bot `.env`
- Article published to website BEFORE tweet is sent

---

## Domain & Infrastructure
- **Domain**: `qatar-standard.com` (Cloudflare proxied → `5.161.52.117`)
- **DNS zone**: `1aa984077250a746e945e4f1f1314797`
- **Cloudflare account**: `9793a834653054818fee8826dab7da8c`
- **Email routing**: `*@qatar-standard.com` → `halim.abdihalim@gmail.com`
  - `newsdesk@`, `admin@`, `facebook@`, `social@` all forward
- **Cloudflare API**: Global API Key in `.env.local`

---

## NordVPN + Web Traffic (IMPORTANT)

Server uses NordVPN for Twitter posting. This routes all non-allowlisted traffic through VPN, which breaks inbound web traffic on 80/443.

**Fix applied:** iptables connmark rules in `/etc/network/if-up.d/nordvpn-webports` mark port 80/443 connections with `0xe1f1` so replies bypass VPN and go via eth0.

**If site goes down (522 error):**
```bash
nordvpn settings | grep Firewall          # Must be: disabled
iptables -t mangle -L PREROUTING -n | grep CONNMARK  # Must have 3 rules
nordvpn set firewall off                  # If firewall is on, this breaks UFW
nordvpn allowlist add port 80             # Re-add if reset
nordvpn allowlist add port 443
```

---

## Traefik Routing
- Coolify container `ikc04og8kog4s4g404co80og-*` on `coolify` network
- SSL via Let's Encrypt (Traefik labels managed by Coolify)
- Static config at `/data/coolify/proxy/dynamic/qatar-standard.yaml` was renamed to `.bak` — Coolify labels handle routing now
- Ghost CMS: `/data/coolify/proxy/dynamic/ghost-cms.yaml`

---

## Known Issues & Gaps

| Issue | Severity | Notes |
|---|---|---|
| Hardcoded API key fallback in source | HIGH | Set `WEBSITE_API_KEY` in `.env.local` to override |
| Admin UI not yet implemented | MEDIUM | `/api/admin/auth` exists but no dashboard UI |
| og:image scraper uses fragile regex | LOW | Can fail on unusual HTML |
| SerpAPI free tier: 100/month | LOW | Exhausts after ~5 active days |

### Recently Fixed (Feb 2026)
- **Admin password** — hardcoded fallback removed; `ADMIN_PASSWORD` env var required at runtime (deferred check via `getPassword()`)
- **DOMPurify removed** — `isomorphic-dompurify`/`dompurify` break Next.js standalone SSR; content from own DB/Ghost CMS is trusted
- **Rate limiting** — added to `/api/generate` (10/min), `/api/articles` (60/min), `/api/admin/auth` (5/min)
- **Article search** — LIKE-based search via `/api/search` + SearchBar in header
- **Image optimization** — `<img>` replaced with Next.js `<Image>` components
- **Accessibility** — ARIA labels, skip-to-content link, RTL logical properties
- **SEO** — JSON-LD keywords/wordCount, canonical URLs for paginated pages
- **Features** — breaking news banner, social sharing, most-read sidebar, print stylesheet, privacy policy
- **Database backup** — daily cron at 3 AM to `/root/backups/qatar-standard/`
- **Duplicate container fix** — removed stale manual `qatar-standard-website` container that caused intermittent 404s/500s
