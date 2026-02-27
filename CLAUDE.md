# Qatar Standard Website — CLAUDE.md

## Project Overview
Next.js 16 news website for Qatar Standard (`qatar-standard.com`). Arabic/English bilingual.
Deployed via Docker + Traefik on `5.161.52.117` (Hetzner). Push to GitHub master, then SSH to pull + rebuild.

## Server Setup
- **Repo on server**: `/root/qatar-standard-website/`
- **DB path**: `/data/articles.db` (SQLite, mounted as Docker volume)
- **SSH**: `ssh -i /c/Users/habdi/hetzner/hetzner_new_nopass root@5.161.52.117`

## Deployment Workflow
1. Commit and push locally: `git push origin master`
2. SSH to server and run deploy script:
```bash
bash /root/deploy-qatar.sh
```

**IMPORTANT**: Always use `/root/deploy-qatar.sh` — never run `docker run` manually.
The script includes the required `-v /data/qatar-standard:/data` volume mount.
Running docker without this mount creates an empty DB and loses all articles.

The full deploy script for reference:
```bash
cd /root/qatar-standard-website && git pull origin master
docker build -t qatar-standard-website .
docker stop qatar-standard-website && docker rm qatar-standard-website
docker run -d --name qatar-standard-website \
  --network coolify \
  --env-file /root/qatar-standard-website/.env.local \
  -v /data/qatar-standard:/data \
  --env-file .env.local \
  -l 'traefik.enable=true' \
  -l 'traefik.http.routers.qatar-standard.rule=Host(`qatar-standard.com`) || Host(`www.qatar-standard.com`)' \
  -l 'traefik.http.routers.qatar-standard.entrypoints=https,http' \
  -l 'traefik.http.routers.qatar-standard.tls=true' \
  -l 'traefik.http.routers.qatar-standard.tls.certresolver=letsencrypt' \
  -l 'traefik.http.services.qatar-standard.loadbalancer.server.port=3000' \
  qatar-standard-website
```
3. Verify: `curl -s -o /dev/null -w '%{http_code}' https://qatar-standard.com/`

## Architecture

### Stack
- **Next.js 16** App Router, TypeScript
- **SQLite** via `better-sqlite3` (server-only — never import in client components)
- **Tailwind CSS v4** — uses `@theme {}` in `globals.css` for custom colors (NOT tailwind.config.ts)
- **Language**: English primary, Arabic secondary (toggle in header)

### Key Files
| File | Purpose |
|------|---------|
| `lib/db.ts` | SQLite singleton, creates tables |
| `lib/articles.ts` | Article CRUD — **server-only** |
| `lib/ghost.ts` | Ghost CMS Content API client — **server-only** |
| `lib/categories.ts` | Category constants — **safe for client** |
| `contexts/LanguageContext.tsx` | EN/AR language toggle (localStorage) |
| `app/api/generate/route.ts` | POST /api/generate — creates article via GPT-4o pipeline |
| `app/api/articles/route.ts` | GET /api/articles — paginated list |
| `components/Header.tsx` | Sticky header with nav + language toggle |
| `components/ArticleCard.tsx` | Card component (sm/md/lg sizes) |
| `components/AdUnit.tsx` | Google AdSense ad unit (client component) |
| `components/HomePage.tsx` | Homepage client wrapper |
| `components/ArticleDetail.tsx` | Article page client wrapper |
| `components/CategoryPage.tsx` | Category listing client wrapper |
| `public/ads.txt` | AdSense publisher verification |

### Critical Rules
1. **Never import `lib/articles.ts`, `lib/db.ts`, or `lib/ghost.ts` in client components** — Node.js only
2. **Client components** must use `import type { Article }` and `lib/categories.ts` for categories
3. **Server pages** fetch data and pass as props to client components
4. **Tailwind v4**: custom colors go in `@theme {}` block in `globals.css`
5. **`serverExternalPackages: ["better-sqlite3"]`** must stay in `next.config.ts`

### Colors
Maroon palette defined in `app/globals.css` `@theme {}` block:
- `maroon-800` = `#8b1538` (primary nav/header)
- `maroon-900` = `#781333` (footer)
- `gold` = `#C8A96E`

## Image Resolution Pipeline (generate route)
`resolveImage()` tries in order:
1. Provided `image_url` from bot/RSS (if starts with `http`)
2. `og:image` scraped from `source_url`
3. SerpAPI Google Images (`tbm=isch`, full-size)
4. SerpAPI news thumbnails (`tbm=nws`, fallback)
5. `getDefaultImage(category, source)` — curated last resort

## Hero Article Logic (`getLatestArticle`)
Prefers `gulf`, `diplomacy`, `economy`, `politics`, `africa`, `media`, `general` categories with real (non-curated) images published within 48h. Falls back to overall latest.

## API

### POST /api/generate
Generates a bilingual article from a tweet/source.
```bash
curl -X POST https://qatar-standard.com/api/generate \
  -H "Content-Type: application/json" \
  -H "x-api-key: qatar-standard-2024" \
  -d '{
    "title": "Breaking news text here",
    "title_ar": "Arabic title (optional)",
    "title_en": "English title (optional)",
    "tweet_ar": "Arabic tweet text",
    "tweet_en": "English tweet text",
    "category": "diplomacy",
    "source_url": "https://source.com/article",
    "image_url": "https://image.com/photo.jpg",
    "speaker": { "name": "Name", "title": "Title" },
    "context": "Additional context",
    "source": "twitter",
    "published_at": "2025-01-01T12:00:00Z"
  }'
```

### GET /api/articles
```bash
curl "https://qatar-standard.com/api/articles?limit=20&offset=0&category=diplomacy"
```

## Categories
`general`, `diplomacy`, `palestine`, `economy`, `politics`, `gulf`, `media`, `turkey`, `africa`

## Environment Variables (`.env.local` on server — never commit)
- `OPENAI_API_KEY` — GPT-4o for article generation
- `WEBSITE_API_KEY` — API auth (`qatar-standard-2024`)
- `DB_PATH` — SQLite dir (default: `./data`, production: `/data`)
- `SERP_API_KEY` — SerpAPI for image search
- `GHOST_URL` — `https://cms.qatar-standard.com`
- `GHOST_CONTENT_KEY` — Ghost Content API key (`c04947be646c0d43eff90f2b13`)
- `CREWAI_URL` — Optional CrewAI service URL for enhanced article pipeline

## Ghost CMS
- **URL**: `https://cms.qatar-standard.com`
- **Container**: `ghost-cms` on `coolify` network (port 2368)
- **Admin**: `newsdesk@qatar-standard.com` / `QatarStandard2024!`
- **Traefik config**: `/data/coolify/proxy/dynamic/ghost-cms.yaml`
- **Content API key**: `c04947be646c0d43eff90f2b13`
- Ghost is for editorial/long-form posts; news articles use SQLite via `/api/generate`

## Google AdSense
- **Publisher ID**: `ca-pub-6753180364525256`
- Script loaded in `app/layout.tsx` via `next/script` (`strategy="afterInteractive"`)
- `public/ads.txt` contains: `google.com, pub-6753180364525256, DIRECT, f08c47fec0942fa0`
- Use `<AdUnit slot="SLOT_ID" />` component anywhere on the page

## Twitter Bot Integration
- **Bot**: `/root/qatar-standard-bot/bot.js`
- Posts via `POST /api/generate` with `x-api-key: qatar-standard-2024`
- `WEBSITE_URL=https://qatar-standard.com`

## Domain & Infrastructure
- **Domain**: `qatar-standard.com` (Cloudflare proxied, zone `1aa984077250a746e945e4f1f1314797`)
- **Account ID**: `9793a834653054818fee8826dab7da8c`
- **DNS**: Cloudflare proxy → `5.161.52.117`
- **Email routing**: `*@qatar-standard.com` → `halim.abdihalim@gmail.com` (Cloudflare Email Routing)
  - `newsdesk@`, `admin@`, `facebook@`, `social@` all forward
- **Cloudflare API key**: `9661c78302f23f7e2ce4aae1a38196dfc8e0c` (Global API Key, X-Auth-Key header)
- **Cloudflare email**: `halim.abdihalim@gmail.com`

## Traefik Routing
- **Container**: `qatar-standard-website` on `coolify` network
- SSL via Traefik letsencrypt certresolver (labels on Docker container)
- Ghost CMS: `/data/coolify/proxy/dynamic/ghost-cms.yaml`
