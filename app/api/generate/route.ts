import { NextRequest, NextResponse } from 'next/server';
import { createArticle, getArticleBySourceUrl, getArticleByContentHash, makeContentHash, getDefaultImage } from '@/lib/articles';
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

// ── Agent 1: Research — fetch & extract source article content ────────────────

async function researchAgent(sourceUrl?: string | null): Promise<string> {
  if (!sourceUrl) return '';
  try {
    const res = await fetch(sourceUrl, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; QatarStandard/1.0)' },
    });
    if (!res.ok) return '';
    const html = await res.text();
    // Extract readable text — strip tags, collapse whitespace
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .slice(0, 4000)
      .trim();
    return text;
  } catch {
    return '';
  }
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
    if (match && match.startsWith('http')) return match;
    return null;
  } catch {
    return null;
  }
}

// SerpAPI: try Google Images first (full-size), fall back to news thumbnails
async function fetchSerpImage(query: string): Promise<string | null> {
  const serpKey = process.env.SERP_API_KEY;
  if (!serpKey) return null;
  try {
    // Google Images — returns full-size editorial images
    const imgUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&tbm=isch&num=5&safe=active&api_key=${serpKey}`;
    const imgRes = await fetch(imgUrl, { signal: AbortSignal.timeout(10000) });
    if (imgRes.ok) {
      const data = await imgRes.json();
      const results: Array<{ original?: string; thumbnail?: string }> = data?.images_results || [];
      for (const r of results) {
        const src = r.original || r.thumbnail;
        if (src?.startsWith('http') && !src.includes('gstatic') && !src.includes('google.com')) return src;
      }
    }
  } catch { /* fall through */ }
  try {
    // Google News thumbnails — fallback
    const newsUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&tbm=nws&num=10&api_key=${serpKey}`;
    const newsRes = await fetch(newsUrl, { signal: AbortSignal.timeout(10000) });
    if (!newsRes.ok) return null;
    const data = await newsRes.json();
    const results: Array<{ thumbnail?: string }> = data?.news_results || [];
    for (const r of results) {
      if (r.thumbnail?.startsWith('http')) return r.thumbnail;
    }
    return null;
  } catch {
    return null;
  }
}

// Full image resolution pipeline — returns first valid external image URL
async function resolveImage(
  provided: string | null,
  sourceUrl: string | null,
  searchQuery: string,
  category: string,
  source: string,
): Promise<string> {
  // 1. Provided image from bot (RSS feed / og:image already fetched)
  if (provided && provided.startsWith('http')) return provided;

  // 2. og:image scraped from source article URL
  if (sourceUrl) {
    const og = await scrapeOgImage(sourceUrl);
    if (og) return og;
  }

  // 3. SerpAPI (Google Images → news thumbnails)
  const serp = await fetchSerpImage(searchQuery);
  if (serp) return serp;

  // 4. Curated category image — last resort
  return getDefaultImage(category, source);
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
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) throw new Error('No OPENAI_API_KEY');

  const speakerNote = speaker ? `المتحدث: ${speaker.name}${speaker.title ? ` (${speaker.title})` : ''}` : '';
  const speakerNoteEN = speaker ? `Speaker: ${speaker.name}${speaker.title ? ` (${speaker.title})` : ''}` : '';
  const sourceNote = sourceContent ? `\n\nمحتوى الخبر الأصلي:\n${sourceContent.slice(0, 2000)}` : '';
  const sourceNoteEN = sourceContent ? `\n\nSource article content:\n${sourceContent.slice(0, 2000)}` : '';
  const contextNote = context ? `السياق: ${context}` : '';
  const contextNoteEN = context ? `Context: ${context}` : '';

  const call = (messages: object[]) =>
    fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o', temperature: 0.35, messages }),
    }).then(r => r.json()).then(d => d.choices?.[0]?.message?.content?.trim() || '');

  const [arRes, enRes] = await Promise.all([
    call([
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
- اكتب الفقرات فقط بدون عناوين`,
      },
      {
        role: 'user',
        content: `عنوان: ${title}\n${speakerNote}\n${contextNote}\nالتغريدة: ${tweet_ar || tweet_en || title}${sourceNote}\n\nاكتب المقال:`,
      },
    ]),
    call([
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
- Write paragraphs only, no headers or bullet points`,
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
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey || !body_ar || !body_en) return { body_ar, body_en };

  try {
    const call = (messages: object[]) =>
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini', temperature: 0.2, messages }),
      }).then(r => r.json()).then(d => d.choices?.[0]?.message?.content?.trim() || '');

    const [edited_ar, edited_en] = await Promise.all([
      call([
        {
          role: 'system',
          content: `أنت مدقق لغوي. راجع المقال العربي وأصلح: أي تعابير ذكاء اصطناعي مبتذلة، تكرار، وعناوين مرقّمة. أعد النص فقط بدون تعليق.`,
        },
        { role: 'user', content: body_ar },
      ]),
      call([
        {
          role: 'system',
          content: `You are a copy editor. Review the English article and fix: any AI clichés, repetition, numbered headers. Return only the cleaned text without comment.`,
        },
        { role: 'user', content: body_en },
      ]),
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
    image_url?: string;
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
  const title_en   = stripMd(body.title_en || body.title);
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
  const slug = makeSlug(title_en);

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
      // Agent 1: Research — fetch source article content
      const sourceContent = await researchAgent(source_url);

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

  // ── Image ────────────────────────────────────────────────────────────────
  const image_url = await resolveImage(
    body.image_url || null,
    source_url,
    `${title_en} ${category}`,
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
    speaker_name:  body.speaker?.name  || null,
    speaker_title: body.speaker?.title || null,
    published_at:  body.published_at || new Date().toISOString(),
  });

  return NextResponse.json({ success: true, slug: article.slug, id: article.id }, { status: 201 });
}
