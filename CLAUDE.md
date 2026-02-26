# Qatar Standard Website — CLAUDE.md

## Project Overview
Next.js 16 news website for Qatar Standard (`qatar-standard.com`). Arabic/English bilingual.
Deployed via Coolify on `5.161.52.117`, auto-deploys on push to `master` branch.

## Server Setup
- **Repo on server**: `/root/qatar-standard-website/`
- **Dev**: `cd /root/qatar-standard-website && npm run dev` (port 3000)
- **DB path**: `/data/articles.db` (SQLite, persisted via Coolify volume)
- **Coolify app UUID**: `ikc04og8kog4s4g404co80og`
- **Coolify URL**: `http://localhost:8010` (localhost only)
- **Coolify token**: `23|3rT8aRdGx6E0cBtyYstcVIPvFJWo3q0SlOTfCiOH5ea1dc8b`

## Deployment Workflow
1. Edit code in `/root/qatar-standard-website/`
2. `git add . && git commit -m "..." && git push origin master`
3. Coolify auto-deploys from GitHub on push

### Manual deploy trigger:
```bash
curl -s -X POST \
  -H "Authorization: Bearer 23|3rT8aRdGx6E0cBtyYstcVIPvFJWo3q0SlOTfCiOH5ea1dc8b" \
  "http://localhost:8010/api/v1/applications/ikc04og8kog4s4g404co80og/start"
```

### Check deployment status:
```bash
curl -s -H "Authorization: Bearer 23|3rT8aRdGx6E0cBtyYstcVIPvFJWo3q0SlOTfCiOH5ea1dc8b" \
  "http://localhost:8010/api/v1/deployments/applications/ikc04og8kog4s4g404co80og" | python3 -c "
import json,sys; d=json.load(sys.stdin); dep=d['deployments'][0]
print(dep['status'])
"
```

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
| `lib/categories.ts` | Category constants — **safe for client** |
| `contexts/LanguageContext.tsx` | EN/AR language toggle (localStorage) |
| `app/api/generate/route.ts` | POST /api/generate — creates article from tweet via GPT-4o |
| `app/api/articles/route.ts` | GET /api/articles — paginated list |
| `components/Header.tsx` | Sticky header with nav + language toggle |
| `components/ArticleCard.tsx` | Card component (sm/md/lg sizes) |
| `components/HomePage.tsx` | Homepage client wrapper |
| `components/ArticleDetail.tsx` | Article page client wrapper |
| `components/CategoryPage.tsx` | Category listing client wrapper |

### Critical Rules
1. **Never import `lib/articles.ts` or `lib/db.ts` in client components** — they import `better-sqlite3` which is Node.js only
2. **Client components** must use `import type { Article }` and `lib/categories.ts` for categories
3. **Server pages** fetch data and pass as props to client components
4. **Tailwind v4**: custom colors go in `@theme {}` block in `globals.css`
5. **`serverExternalPackages: ["better-sqlite3"]`** must stay in `next.config.ts`

### Colors
Maroon palette defined in `app/globals.css` `@theme {}` block:
- `maroon-800` = `#8b1538` (primary nav/header)
- `maroon-900` = `#781333` (footer)
- `gold` = `#C8A96E`

## API

### POST /api/generate
Generates a bilingual article from a tweet.
```bash
curl -X POST https://qatar-standard.com/api/generate \
  -H "Content-Type: application/json" \
  -H "x-api-key: qatar-standard-2024" \
  -d '{
    "tweet": "Breaking news text here",
    "category": "diplomacy",
    "source_tweet_id": "optional",
    "image_url": "optional"
  }'
```

### GET /api/articles
```bash
curl "https://qatar-standard.com/api/articles?limit=20&offset=0&category=diplomacy"
```

## Categories
`general`, `diplomacy`, `palestine`, `economy`, `politics`, `gulf`, `media`, `turkey`, `africa`

## Environment Variables
See `.env.local` (never commit this file):
- `OPENAI_API_KEY` — GPT-4o for article generation
- `WEBSITE_API_KEY` — API auth key (`qatar-standard-2024`)
- `DB_PATH` — SQLite directory (default: `./data`, production: `/data`)

## Twitter Bot Integration
Bot at `/root/qatar-standard-bot/bot.js` posts articles via `POST /api/generate`.
Daily analysis runs 9 AM–2 PM AST, 22h cooldown.
Bot uses `WEBSITE_URL=https://qatar-standard.com` and `WEBSITE_API_KEY=qatar-standard-2024`.

## Domain & Infrastructure
- **Domain**: `qatar-standard.com` (Cloudflare, zone `1aa984077250a746e945e4f1f1314797`)
- **Server IP**: `5.161.52.117`
- **Email**: `newsdesk@qatar-standard.com` → forwarded to `halim.abdihalim@gmail.com` via Cloudflare Email Routing
- **Healthcheck**: disabled in Coolify (app runs fine, healthcheck was misconfigured)
