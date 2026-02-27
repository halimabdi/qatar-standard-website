/**
 * analysis-agent.mjs
 *
 * Runs twice daily (9 AM + 3 PM AST).
 * 1. Scrapes Twitter/X trending topics via Playwright (already authenticated)
 * 2. GPT-4o filters for Middle East & Africa relevance
 * 3. Researches each topic via SerpAPI
 * 4. GPT-4o writes a 900-1200 word analysis article
 * 5. Posts to Ghost CMS as draft for editorial review
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COOKIES_FILE = path.join(__dirname, '.playwright-cookies.json');
const DRAFTED_FILE = path.join(__dirname, 'analysis-drafted.json');

const GHOST_URL = process.env.GHOST_URL || 'https://cms.qatar-standard.com';
const GHOST_ADMIN_KEY = process.env.GHOST_ADMIN_KEY || '';
const SERP_KEY = process.env.SERP_API_KEY || '';
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';

const MAX_PER_RUN = 2;
// Schedule: 9 AM and 3 PM AST (UTC+3) → 6 AM and 12 PM UTC
const SCHEDULE_UTC_HOURS = [6, 12];
const CHECK_INTERVAL_MS = 15 * 60 * 1000; // check every 15 min

// ── Ghost Admin JWT ───────────────────────────────────────────────────────────

function ghostJWT() {
  const [id, secret] = GHOST_ADMIN_KEY.split(':');
  const now = Math.floor(Date.now() / 1000);
  const header  = Buffer.from(JSON.stringify({ alg: 'HS256', kid: id, typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ iat: now, exp: now + 300, aud: '/admin/' })).toString('base64url');
  const sig = crypto.createHmac('sha256', Buffer.from(secret, 'hex')).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

async function postToGhostDraft({ title, html, excerpt, featureImage }) {
  const token = ghostJWT();
  const body = {
    posts: [{
      title,
      html,
      custom_excerpt: excerpt,
      feature_image: featureImage || null,
      status: 'draft',
      tags: [{ name: 'Analysis' }, { name: 'Auto-Research' }],
    }],
  };
  const res = await fetch(`${GHOST_URL}/ghost/api/admin/posts/?source=html`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Ghost ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ghost API ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.posts?.[0]?.url || data.posts?.[0]?.slug || 'unknown';
}

// ── OpenAI helper ─────────────────────────────────────────────────────────────

async function gpt(systemPrompt, userPrompt, maxTokens = 1800) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      temperature: 0.4,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

// ── SerpAPI research ──────────────────────────────────────────────────────────

async function searchNews(query, num = 5) {
  if (!SERP_KEY) return [];
  const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&tbm=nws&num=${num}&api_key=${SERP_KEY}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    return (data.news_results || []).map(r => ({
      title: r.title,
      snippet: r.snippet,
      source: r.source,
      link: r.link,
      thumbnail: r.thumbnail,
    }));
  } catch { return []; }
}

async function searchImage(query) {
  if (!SERP_KEY) return null;
  const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&tbm=isch&num=5&safe=active&api_key=${SERP_KEY}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    const results = data.images_results || [];
    for (const r of results) {
      const src = r.original || r.thumbnail;
      if (src?.startsWith('http') && !src.includes('gstatic') && !src.includes('google.com')) return src;
    }
  } catch {}
  return null;
}

// ── Twitter trending scraper ──────────────────────────────────────────────────

async function getTrendingTopics() {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    // Load saved cookies
    if (fs.existsSync(COOKIES_FILE)) {
      const cookies = JSON.parse(fs.readFileSync(COOKIES_FILE, 'utf-8'));
      await context.addCookies(cookies);
    }

    const page = await context.newPage();
    await page.goto('https://x.com/explore/tabs/trending', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(4000);

    // Extract trending items — X uses data-testid="trend" or cells in explore
    const trends = await page.evaluate(() => {
      const results = [];

      // Method 1: data-testid="trend"
      document.querySelectorAll('[data-testid="trend"]').forEach(el => {
        const text = el.innerText?.trim();
        if (text) results.push(text.split('\n')[0]);
      });

      // Method 2: cells with "Trending" label
      if (results.length === 0) {
        document.querySelectorAll('div[role="link"]').forEach(el => {
          const spans = el.querySelectorAll('span');
          spans.forEach(s => {
            const t = s.innerText?.trim();
            if (t && t.length > 3 && t.length < 80 && !t.includes('·') && !t.startsWith('@')) {
              results.push(t);
            }
          });
        });
      }

      return [...new Set(results)].slice(0, 30);
    });

    await context.close();
    console.log(`[ANALYSIS] Found ${trends.length} trending topics`);
    return trends;
  } catch (err) {
    console.error('[ANALYSIS] Trending scrape failed:', err.message);
    return [];
  } finally {
    await browser.close();
  }
}

// ── Article writer ────────────────────────────────────────────────────────────

async function writeAnalysisArticle(topic, newsItems) {
  const newsContext = newsItems
    .map((n, i) => `[${i + 1}] ${n.title}\n${n.snippet}\nSource: ${n.source}`)
    .join('\n\n');

  const systemPrompt = `You are a senior analyst at Qatar Standard, a geopolitical news outlet focused on the Middle East, Gulf, and Africa.

Write a comprehensive, professional analysis article. Requirements:
- 900 to 1100 words
- Professional journalistic tone — no AI filler phrases
- Structure: strong opening paragraph, 4-6 body paragraphs with clear progression, a concluding outlook
- Include specific facts, context, and implications for the Gulf/Qatar/Africa region
- No bullet points, no numbered lists, no section headers
- Do NOT mention that you are an AI or that this was auto-generated
- Output HTML only: use <p> tags for paragraphs, <strong> for emphasis. No h1/h2 tags.`;

  const userPrompt = `Topic: ${topic}

Recent news context:
${newsContext}

Write the full analysis article now:`;

  const html = await gpt(systemPrompt, userPrompt, 2000);

  // Generate title
  const title = await gpt(
    'You are an editor. Generate a compelling, specific news headline for this analysis article. Under 90 characters. No punctuation at the end. Return only the headline.',
    `Topic: ${topic}\n\nArticle preview: ${html.replace(/<[^>]+>/g, ' ').slice(0, 300)}`,
    80
  );

  // Generate excerpt
  const excerpt = await gpt(
    'Write a 1-2 sentence summary/excerpt for this analysis article. Under 160 characters. Return only the excerpt.',
    html.replace(/<[^>]+>/g, ' ').slice(0, 800),
    100
  );

  return { title, html, excerpt };
}

// ── Scheduling ────────────────────────────────────────────────────────────────

function loadDrafted() {
  try { return JSON.parse(fs.readFileSync(DRAFTED_FILE, 'utf-8')); } catch { return []; }
}
function saveDrafted(list) {
  fs.writeFileSync(DRAFTED_FILE, JSON.stringify(list, null, 2));
}

let lastRunDate = '';
let lastRunHour = -1;

async function runAnalysisAgent() {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const dateStr = now.toISOString().slice(0, 10);

  // Only run at scheduled hours, once per scheduled slot per day
  const shouldRun = SCHEDULE_UTC_HOURS.some(h =>
    utcHour === h && !(lastRunDate === dateStr && lastRunHour === h)
  );
  if (!shouldRun) return;

  lastRunDate = dateStr;
  lastRunHour = utcHour;

  console.log(`[ANALYSIS] Running at ${now.toISOString()}`);

  const drafted = loadDrafted();

  // 1. Get trending topics
  const trends = await getTrendingTopics();
  if (trends.length === 0) {
    console.log('[ANALYSIS] No trends found — skipping');
    return;
  }

  // 2. Filter for ME/Africa relevance using GPT-4o
  const filterPrompt = `You are an editor for Qatar Standard, a Middle East and Africa focused news outlet.

From this list of Twitter trending topics, identify the ${MAX_PER_RUN} most relevant to: Middle East, Gulf states, Qatar, Palestine, Yemen, Sudan, Somalia, Ethiopia, North Africa, Turkey, Iran, Africa, geopolitics, energy/oil/gas, international diplomacy.

Trending topics:
${trends.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Return ONLY a JSON array of the selected topic strings. Example: ["topic1", "topic2"]
If fewer than ${MAX_PER_RUN} are relevant, return only the relevant ones. If none, return [].`;

  let selectedTopics = [];
  try {
    const raw = await gpt('', filterPrompt, 200);
    const match = raw.match(/\[.*?\]/s);
    if (match) selectedTopics = JSON.parse(match[0]);
  } catch (err) {
    console.error('[ANALYSIS] Filter parse error:', err.message);
  }

  // Fallback: use first trend if filter returned nothing
  if (selectedTopics.length === 0 && trends.length > 0) {
    selectedTopics = [trends[0]];
  }

  console.log(`[ANALYSIS] Selected topics: ${selectedTopics.join(', ')}`);

  // 3. For each topic, research + write + post to Ghost
  let count = 0;
  for (const topic of selectedTopics.slice(0, MAX_PER_RUN)) {
    if (drafted.includes(topic)) {
      console.log(`[ANALYSIS] Already drafted: ${topic}`);
      continue;
    }

    try {
      console.log(`[ANALYSIS] Researching: ${topic}`);
      const newsItems = await searchNews(`${topic} Middle East analysis 2025`, 6);

      if (newsItems.length < 2) {
        console.log(`[ANALYSIS] Not enough news for: ${topic} — skipping`);
        continue;
      }

      console.log(`[ANALYSIS] Writing article for: ${topic}`);
      const { title, html, excerpt } = await writeAnalysisArticle(topic, newsItems);

      // Find a feature image
      const featureImage = await searchImage(`${topic} Middle East`);

      console.log(`[ANALYSIS] Posting draft: ${title}`);
      const slug = await postToGhostDraft({ title, html, excerpt, featureImage });
      console.log(`[ANALYSIS] ✓ Draft posted: ${slug}`);

      drafted.push(topic);
      saveDrafted(drafted);
      count++;

      // Pause between articles
      if (count < selectedTopics.length) {
        await new Promise(r => setTimeout(r, 30000));
      }
    } catch (err) {
      console.error(`[ANALYSIS] Failed for "${topic}":`, err.message);
    }
  }

  console.log(`[ANALYSIS] Run complete — ${count} drafts posted`);
}

// ── Entry point ───────────────────────────────────────────────────────────────

console.log('[ANALYSIS] Agent started — checking every 15 min for scheduled runs');
console.log(`[ANALYSIS] Schedule: ${SCHEDULE_UTC_HOURS.map(h => `${h}:00 UTC`).join(', ')} (9 AM + 3 PM AST)`);

// Run immediately on start if we're at a scheduled hour
runAnalysisAgent();
setInterval(runAnalysisAgent, CHECK_INTERVAL_MS);
