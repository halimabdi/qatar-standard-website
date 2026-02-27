import { NextRequest, NextResponse } from 'next/server';
import { createArticle, getArticleBySourceUrl, getArticleByContentHash, makeContentHash } from '@/lib/articles';
import slugify from 'slugify';

export const dynamic = 'force-dynamic';

const API_KEY = process.env.WEBSITE_API_KEY || 'qatar-standard-2024';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeSlug(title: string): string {
  const base = slugify(title, { lower: true, strict: true, locale: 'en' }).slice(0, 60);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${base || 'article'}-${rand}`;
}

const stripMd = (s: string) =>
  s.replace(/^#+\s*/gm, '').replace(/\*\*/g, '').replace(/^["']|["']$/g, '').trim();

// ── SerpAPI news research — enriches articles with real sources ───────────────
// Budget: 100 searches/month free → cap at 3/day to stay safe.
// Used for research only — NOT for images (og:image scraping handles that).

const serpResearchUsed = { date: '', count: 0 };
const SERP_RESEARCH_MAX_PER_DAY = 3;

async function serpNewsResearch(query: string): Promise<string> {
  const serpKey = process.env.SERP_API_KEY;
  if (!serpKey) return '';

  // Daily cap — ~90 searches/month, well within free tier
  const today = new Date().toISOString().slice(0, 10);
  if (serpResearchUsed.date !== today) { serpResearchUsed.date = today; serpResearchUsed.count = 0; }
  if (serpResearchUsed.count >= SERP_RESEARCH_MAX_PER_DAY) return '';

  try {
    const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&tbm=nws&num=5&api_key=${serpKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return '';
    const data = await res.json();
    const results: Array<{ title?: string; snippet?: string; source?: string; date?: string }> =
      data?.news_results || [];
    if (!results.length) return '';

    serpResearchUsed.count++;
    console.log(`[SERP-RESEARCH] Found ${results.length} articles for: "${query.slice(0, 60)}" (${serpResearchUsed.count}/${SERP_RESEARCH_MAX_PER_DAY} today)`);

    return results
      .map(r => `• ${r.source || ''} — ${r.title || ''}: ${r.snippet || ''}`)
      .join('\n');
  } catch {
    return '';
  }
}

// ── Agent 1: Research — fetch source content + SerpAPI related coverage ───────

async function researchAgent(sourceUrl: string | null | undefined, title: string, playwrightResearch?: string): Promise<string> {
  const parts: string[] = [];

  // 0. Playwright Bing News research passed from bot (richest source — real article snippets)
  if (playwrightResearch) {
    parts.push(`Recent news coverage:\n${playwrightResearch}`);
    console.log(`[research] Using Playwright research (${playwrightResearch.length} chars)`);
  }

  // 1. Fetch source article if URL provided
  if (sourceUrl) {
    try {
      const res = await fetch(sourceUrl, {
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; QatarStandard/1.0)' },
      });
      if (res.ok) {
        const html = await res.text();
        const text = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .slice(0, 3000)
          .trim();
        if (text) parts.push(`Source article:\n${text}`);
      }
    } catch { /* skip */ }
  }

  // 2. SerpAPI fallback — only when no Playwright research and no source URL
  const needsResearch = !playwrightResearch && (!sourceUrl || parts.length === 0);
  if (needsResearch && title) {
    const related = await serpNewsResearch(title);
    if (related) parts.push(`Related news coverage:\n${related}`);
  }

  return parts.join('\n\n');
}

// ── Image helpers ─────────────────────────────────────────────────────────────

// Scrape og:image / twitter:image from a URL
async function scrapeOgImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; QatarStandard/1.0)' },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match =
      html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i)?.[1] ||
      html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/i)?.[1] ||
      html.match(/<meta[^>]*name="twitter:image"[^>]*content="([^"]+)"/i)?.[1] ||
      html.match(/<meta[^>]*content="([^"]+)"[^>]*name="twitter:image"/i)?.[1];
    // Reject generic/logo images
    if (match && match.startsWith('http') && !match.includes('logo') && !match.includes('placeholder') && !match.includes('default')) return match;
    return null;
  } catch {
    return null;
  }
}

// SerpAPI image search — separate daily budget from research quota
// One tbm=nws call handles both thumbnail check AND og:image scraping from result links.
const serpImageUsed = { date: '', count: 0 };
const SERP_IMAGE_MAX_PER_DAY = 20;

async function serpImageSearch(query: string): Promise<string | null> {
  const serpKey = process.env.SERP_API_KEY;
  if (!serpKey) return null;

  const today = new Date().toISOString().slice(0, 10);
  if (serpImageUsed.date !== today) { serpImageUsed.date = today; serpImageUsed.count = 0; }
  if (serpImageUsed.count >= SERP_IMAGE_MAX_PER_DAY) return null;

  try {
    // Step A: One SerpAPI news call — thumbnail check + og:image scraping (1 credit)
    const nwsUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&tbm=nws&num=5&api_key=${serpKey}`;
    const nwsRes = await fetch(nwsUrl, { signal: AbortSignal.timeout(8000) });
    if (nwsRes.ok) {
      const nwsData = await nwsRes.json();
      serpImageUsed.count++;
      const newsResults: Array<{ thumbnail?: string; link?: string }> = nwsData?.news_results || [];

      // A1: Direct thumbnail (non-expiring source URL)
      const directThumb = newsResults
        .map(r => r.thumbnail)
        .find(t =>
          t?.startsWith('http') &&
          !t.includes('serpapi.com') &&
          !t.includes('gstatic.com') &&
          !t.includes('google.com/s2')
        );
      if (directThumb) {
        console.log(`[IMAGE] SerpAPI news thumbnail found (${serpImageUsed.count}/${SERP_IMAGE_MAX_PER_DAY})`);
        return directThumb;
      }

      // A2: Scrape og:image from news result links (no extra API credit — reuses same response)
      for (const r of newsResults) {
        if (!r.link) continue;
        const img = await scrapeOgImage(r.link);
        if (img) {
          console.log(`[IMAGE] og:image scraped from news result (${serpImageUsed.count}/${SERP_IMAGE_MAX_PER_DAY}): ${r.link.slice(0, 60)}`);
          return img;
        }
      }
    }

    // Step B: Fallback — Google Images (1 more credit)
    if (serpImageUsed.count >= SERP_IMAGE_MAX_PER_DAY) return null;
    const imgUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&tbm=isch&num=5&safe=active&api_key=${serpKey}`;
    const imgRes = await fetch(imgUrl, { signal: AbortSignal.timeout(8000) });
    if (!imgRes.ok) return null;
    const imgData = await imgRes.json();
    serpImageUsed.count++;
    for (const r of (imgData?.images_results || [])) {
      const src = r.original || r.thumbnail;
      if (src?.startsWith('http') && !src.includes('gstatic') && !src.includes('google.com')) {
        console.log(`[IMAGE] SerpAPI image found (${serpImageUsed.count}/${SERP_IMAGE_MAX_PER_DAY})`);
        return src;
      }
    }
  } catch { /* fall through */ }
  return null;
}

// ── Bing Images search via Playwright ────────────────────────────────────────
let _bingBrowser: import('playwright').Browser | null = null;

async function bingImageSearch(query: string): Promise<string | null> {
  try {
    const { chromium } = await import('playwright');
    if (!_bingBrowser || !_bingBrowser.isConnected()) {
      _bingBrowser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
    }
    const ctx = await _bingBrowser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'en-US',
    });
    const page = await ctx.newPage();
    try {
      await page.route('**/*.{mp4,mp3,woff,woff2,gif,css}', r => r.abort());
      const q = encodeURIComponent(query.slice(0, 80));
      await page.goto(`https://www.bing.com/images/search?q=${q}&cc=US&setlang=en-US`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(2000);
      const murl = await page.evaluate(() => {
        for (const el of document.querySelectorAll('.iusc[m]')) {
          try {
            const obj = JSON.parse((el as HTMLElement).getAttribute('m') || '{}');
            const u: string = obj.murl || '';
            if (u.startsWith('http') && u.length > 40 &&
                !u.includes('bing.com') && !u.includes('microsoft.com') &&
                !u.includes('gstatic.com') && !u.includes('google.com')) return u;
          } catch { /* skip */ }
        }
        return null;
      });
      if (murl) {
        console.log(`[IMAGE] Bing Playwright found: ${murl.slice(0, 80)}`);
        return murl;
      }
    } finally {
      await ctx.close();
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`[IMAGE] Bing Playwright failed: ${msg.slice(0, 80)}`);
    _bingBrowser = null;
  }
  return null;
}

// ── Wikimedia Commons image search — free, no API key ─────────────────────────
async function wikimediaImageSearch(query: string): Promise<string | null> {
  try {
    // Use first 5 words of title as search terms — full titles return poor results
    const shortQuery = query.split(/\s+/).slice(0, 5).join(' ');
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(shortQuery)}&srnamespace=6&format=json&srlimit=5&origin=*`;
    const res = await fetch(searchUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    const hits: Array<{ title?: string }> = data?.query?.search || [];
    for (const hit of hits) {
      if (!hit.title) continue;
      // Get the actual image URL via imageinfo
      const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(hit.title)}&prop=imageinfo&iiprop=url&iiurlwidth=1200&format=json&origin=*`;
      const infoRes = await fetch(infoUrl, { signal: AbortSignal.timeout(6000) });
      if (!infoRes.ok) continue;
      const infoData = await infoRes.json();
      const pages = Object.values((infoData?.query?.pages || {}) as Record<string, { imageinfo?: Array<{ thumburl?: string; url?: string }> }>);
      for (const page of pages) {
        const url = page.imageinfo?.[0]?.thumburl || page.imageinfo?.[0]?.url;
        if (url?.startsWith('http') && /\.(jpe?g|png|webp)/i.test(url)) {
          console.log(`[IMAGE] Wikimedia Commons: ${hit.title}`);
          return url;
        }
      }
    }
  } catch { /* fall through */ }
  return null;
}

// ── Pexels image search — needs PEXELS_API_KEY ────────────────────────────────
async function pexelsImageSearch(query: string): Promise<string | null> {
  const pexelsKey = process.env.PEXELS_API_KEY;
  if (!pexelsKey) return null;
  try {
    const shortQuery = query.split(/\s+/).slice(0, 5).join(' ');
    const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(shortQuery)}&per_page=5&orientation=landscape`, {
      headers: { Authorization: pexelsKey },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const photo = (data?.photos || [])[0];
    const url = photo?.src?.large || photo?.src?.medium;
    if (url?.startsWith('http')) {
      console.log(`[IMAGE] Pexels: ${photo.photographer} — ${photo.url}`);
      return url;
    }
  } catch { /* fall through */ }
  return null;
}

// Verify an image URL is actually reachable (HEAD request, 200 OK)
async function checkImageUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(6000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; QatarStandard/1.0)' },
    });
    if (res.ok) return true;
    // Some servers block HEAD — fall back to GET with no body read
    if (res.status === 405 || res.status === 403) {
      const res2 = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(6000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; QatarStandard/1.0)', Range: 'bytes=0-0' },
      });
      return res2.ok || res2.status === 206;
    }
    console.log(`[IMAGE] URL check failed (${res.status}): ${url.slice(0, 80)}`);
    return false;
  } catch {
    return false;
  }
}

// Full image resolution pipeline
async function resolveImage(
  provided: string | null,
  sourceUrl: string | null,
  searchQuery: string,
  category: string,
  source: string,
): Promise<string> {
  // 1. Provided image from bot (RSS feed / og:image already fetched)
  if (provided && provided.startsWith('http')) {
    if (await checkImageUrl(provided)) return provided;
    console.log(`[IMAGE] Provided URL 404/unreachable, searching…`);
  }

  // 2. og:image scraped from source article URL
  if (sourceUrl) {
    const og = await scrapeOgImage(sourceUrl);
    if (og && await checkImageUrl(og)) return og;
  }

  // 3. SerpAPI — news thumbnail, og:image from news links, or Google Images (single call for news)
  if (searchQuery) {
    const serpImg = await serpImageSearch(searchQuery);
    if (serpImg && await checkImageUrl(serpImg)) return serpImg;
  }

  // 4. Bing Images via Playwright — same approach as bot, finds news-relevant photos
  if (searchQuery) {
    const bingImg = await bingImageSearch(searchQuery);
    if (bingImg && await checkImageUrl(bingImg)) return bingImg;
  }

  // 5. Wikimedia Commons — free, topic-matched encyclopedia images
  if (searchQuery) {
    const wikiImg = await wikimediaImageSearch(searchQuery);
    if (wikiImg && await checkImageUrl(wikiImg)) return wikiImg;
  }

  // 6. Pexels — stock photos (requires PEXELS_API_KEY)
  if (searchQuery) {
    const pexelsImg = await pexelsImageSearch(searchQuery);
    if (pexelsImg && await checkImageUrl(pexelsImg)) return pexelsImg;
  }

  // 7. No image found — return empty so article stores null and shows gradient placeholder
  return '';
}

// ── LLM helper with fallback: OpenAI → Groq ───────────────────────────────────

async function callLLM(messages: object[], opts: { temperature?: number; large?: boolean } = {}): Promise<string> {
  const { temperature = 0.35, large = true } = opts;
  const openaiKey = process.env.OPENAI_API_KEY;
  const groqKey   = process.env.GROQ_API_KEY;

  // 1. Try OpenAI (gpt-4o for writers, gpt-4o-mini for editor)
  if (openaiKey) {
    try {
      const model = large ? 'gpt-4o' : 'gpt-4o-mini';
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, temperature, messages }),
        signal: AbortSignal.timeout(60000),
      });
      const data = await res.json();
      if (res.ok) return data.choices?.[0]?.message?.content?.trim() || '';
      if (res.status !== 429 && res.status !== 503) throw new Error(`OpenAI ${res.status}`);
      console.warn(`[generate] OpenAI ${res.status} — falling back to Groq`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes('429') && !msg.includes('quota')) throw err;
      console.warn('[generate] OpenAI quota exceeded — falling back to Groq');
    }
  }

  // 2. Groq fallback (llama-3.3-70b — fast, free tier generous)
  if (groqKey) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', temperature, messages, max_tokens: 2048 }),
      signal: AbortSignal.timeout(60000),
    });
    const data = await res.json();
    if (res.ok) return data.choices?.[0]?.message?.content?.trim() || '';
    throw new Error(`Groq ${res.status}: ${JSON.stringify(data).slice(0, 100)}`);
  }

  throw new Error('No LLM provider available');
}

// ── Agent 3 + 4: Writers — Arabic & English ───────────────────────────────────

async function writerAgents(opts: {
  title: string;
  tweet_ar?: string;
  tweet_en?: string;
  context?: string;
  sourceContent?: string;
  speaker?: { name: string; title: string } | null;
  category: string;
}): Promise<{ body_ar: string; body_en: string }> {
  const { title, tweet_ar, tweet_en, context, sourceContent, speaker, category } = opts;

  const speakerNote = speaker ? `المتحدث: ${speaker.name}${speaker.title ? ` (${speaker.title})` : ''}` : '';
  const speakerNoteEN = speaker ? `Speaker: ${speaker.name}${speaker.title ? ` (${speaker.title})` : ''}` : '';
  const sourceNote = sourceContent ? `\n\nمحتوى الخبر الأصلي:\n${sourceContent.slice(0, 2000)}` : '';
  const sourceNoteEN = sourceContent ? `\n\nSource article content:\n${sourceContent.slice(0, 2000)}` : '';
  const contextNote = context ? `السياق: ${context}` : '';
  const contextNoteEN = context ? `Context: ${context}` : '';

  const [arRes, enRes] = await Promise.all([
    callLLM([
      {
        role: 'system',
        content: `أنت محرر أول في موقع قطر ستاندرد الإخباري. اكتب مقالاً إخبارياً احترافياً باللغة العربية الفصحى.
القواعد:
- 400 إلى 600 كلمة
- مقدمة قوية تلخص الخبر في جملة واحدة
- فقرة للسياق والأهمية
- تفاصيل وأرقام ومعلومات محددة من المصدر
- خلاصة بمنظور قطري
- لا تستخدم: يُجسّد، يُرسّخ، يُسلّط الضوء، مما يعكس، في ظل، تجدر الإشارة
- لا تذكر أنك ذكاء اصطناعي
- اكتب الفقرات فقط بدون عناوين أو نقاط أو تنسيق مارك داون (**) أو مسميات مثل "المقدمة" أو "الخلاصة"
- النص العادي فقط — يجب أن يبدو كمقال في صحيفة`,
      },
      {
        role: 'user',
        content: `عنوان: ${title}\n${speakerNote}\n${contextNote}\nالتغريدة: ${tweet_ar || tweet_en || title}${sourceNote}\n\nاكتب المقال:`,
      },
    ]),
    callLLM([
      {
        role: 'system',
        content: `You are a senior editor at Qatar Standard news website. Write a professional news article in English.
Rules:
- 400 to 600 words
- Strong lede summarizing the news in one sentence
- Paragraph on context and significance
- Specific details, numbers, and facts from the source
- Conclusion with Qatar/Gulf perspective
- No AI filler phrases: "it is worth noting", "in light of", "this reflects", "underscores"
- Write paragraphs only — NO headers, NO bold (**), NO markdown, NO bullet points
- Do NOT write section labels like "Introduction", "Background", "Conclusion"
- Plain prose only — it must read like a newspaper article`,
      },
      {
        role: 'user',
        content: `Title: ${title}\n${speakerNoteEN}\n${contextNoteEN}\nTweet: ${tweet_en || tweet_ar || title}${sourceNoteEN}\n\nWrite the article:`,
      },
    ]),
  ]);

  return { body_ar: arRes, body_en: enRes };
}

// ── Agent 5: Editor — quality pass ────────────────────────────────────────────

async function editorAgent(body_ar: string, body_en: string): Promise<{ body_ar: string; body_en: string }> {
  if (!body_ar || !body_en) return { body_ar, body_en };

  try {
    const [edited_ar, edited_en] = await Promise.all([
      callLLM([
        {
          role: 'system',
          content: `أنت مدقق لغوي. راجع المقال العربي وأصلح: أي تعابير ذكاء اصطناعي مبتذلة، تكرار، وعناوين مرقّمة. أعد النص فقط بدون تعليق.`,
        },
        { role: 'user', content: body_ar },
      ], { temperature: 0.2, large: false }),
      callLLM([
        {
          role: 'system',
          content: `You are a copy editor. Review the English article and fix: any AI clichés, repetition, markdown bold (**text**), section headers (Introduction, Conclusion, Background), bullet points, or numbered lists. The output must be plain prose paragraphs only — like a newspaper article. Return only the cleaned text without comment.`,
        },
        { role: 'user', content: body_en },
      ], { temperature: 0.2, large: false }),
    ]);

    return {
      body_ar: edited_ar || body_ar,
      body_en: edited_en || body_en,
    };
  } catch {
    return { body_ar, body_en };
  }
}

// ── Main POST handler ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
  if (auth !== API_KEY) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: {
    title: string;
    title_ar?: string;
    title_en?: string;
    tweet_ar?: string;
    tweet_en?: string;
    context?: string;
    research?: string;
    image_url?: string;
    video_url?: string;
    source_url?: string;
    speaker?: { name: string; title: string } | null;
    category?: string;
    source?: string;
    published_at?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  if (!body.title) {
    return NextResponse.json({ error: 'title required' }, { status: 400 });
  }

  const category   = body.category || 'general';
  const source     = body.source || 'bot';
  const title_ar   = stripMd(body.title_ar || body.title);
  let   title_en   = stripMd(body.title_en || body.title);
  const source_url = body.source_url || null;

  // ── Deduplication ────────────────────────────────────────────────────────
  const contentHash = makeContentHash(title_en, source_url);

  if (source_url) {
    const existing = getArticleBySourceUrl(source_url);
    if (existing) {
      return NextResponse.json({ success: true, slug: existing.slug, id: existing.id, duplicate: true });
    }
  }

  const hashExisting = getArticleByContentHash(contentHash);
  if (hashExisting) {
    return NextResponse.json({ success: true, slug: hashExisting.slug, id: hashExisting.id, duplicate: true });
  }

  // ── Agent pipeline ────────────────────────────────────────────────────────
  let slug = makeSlug(title_en);

  let body_ar = '';
  let body_en = '';

  // Try CrewAI service first (if configured), then fall back to built-in pipeline
  const crewaiUrl = process.env.CREWAI_URL; // e.g. http://localhost:8001

  if (crewaiUrl) {
    try {
      const crewRes = await fetch(`${crewaiUrl}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify({
          title:      body.title,
          tweet_ar:   body.tweet_ar,
          tweet_en:   body.tweet_en,
          source_url,
          context:    body.context,
          category,
          speaker:    body.speaker,
        }),
        signal: AbortSignal.timeout(120000),
      });
      if (crewRes.ok) {
        const crewData = await crewRes.json();
        body_ar  = crewData.body_ar  || '';
        body_en  = crewData.body_en  || '';
        console.log('[generate] ✓ CrewAI pipeline used');
      }
    } catch (err) {
      console.warn('[generate] CrewAI unavailable, falling back to built-in pipeline');
    }
  }

  if (!body_ar || !body_en) {
    try {
      // Agent 1: Research — Playwright Bing News (from bot) + source URL + SerpAPI fallback
      const sourceContent = await researchAgent(source_url, title_en, body.research);

      // Agents 3+4: Write Arabic + English
      const written = await writerAgents({
        title:         body.title,
        tweet_ar:      body.tweet_ar,
        tweet_en:      body.tweet_en,
        context:       body.context,
        sourceContent,
        speaker:       body.speaker,
        category,
      });

      // Agent 5: Edit — quality pass
      const edited = await editorAgent(written.body_ar, written.body_en);
      body_ar = edited.body_ar;
      body_en = edited.body_en;
    } catch (err) {
      console.error('[generate] Pipeline failed:', err);
      body_ar = body.tweet_ar || body.title;
      body_en = body.tweet_en || body.title;
    }
  }

  // ── Fix Arabic title_en — generate English headline if title came in as Arabic ─
  if (/[\u0600-\u06FF]/.test(title_en) && body_en) {
    try {
      const headline = await callLLM([
        { role: 'system', content: 'Write a concise English news headline (max 12 words, no quotes, no period at end) for this article.' },
        { role: 'user', content: body_en.slice(0, 400) },
      ], { temperature: 0.2, large: false });
      if (headline) {
        title_en = headline.replace(/^["']|["']$/g, '').trim();
        slug = makeSlug(title_en);
        console.log(`[generate] Arabic title_en replaced with: "${title_en}"`);
      }
    } catch { /* keep original */ }
  }

  // ── Image ────────────────────────────────────────────────────────────────
  const image_url = await resolveImage(
    body.image_url || null,
    source_url,
    title_en.slice(0, 100),  // use full title for relevant image search
    category,
    source,
  );

  // ── Excerpts ─────────────────────────────────────────────────────────────
  const excerpt_ar = body_ar.split(/[.!؟]/)[0]?.trim() || '';
  const excerpt_en = body_en.split(/[.!]/)[0]?.trim() || '';

  const article = createArticle({
    slug,
    title_ar,
    title_en,
    body_ar,
    body_en,
    excerpt_ar,
    excerpt_en,
    category,
    image_url,
    source,
    source_url,
    content_hash: contentHash,
    tweet_ar:     body.tweet_ar || null,
    tweet_en:     body.tweet_en || null,
    video_url:     body.video_url || null,
    speaker_name:  body.speaker?.name  || null,
    speaker_title: body.speaker?.title || null,
    published_at:  body.published_at || new Date().toISOString(),
  });

  return NextResponse.json({ success: true, slug: article.slug, id: article.id }, { status: 201 });
}
