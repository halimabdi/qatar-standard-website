import { NextRequest, NextResponse } from 'next/server';
import { createArticle } from '@/lib/articles';
import slugify from 'slugify';

export const dynamic = 'force-dynamic';

const API_KEY = process.env.WEBSITE_API_KEY || 'qatar-standard-2024';

function makeSlug(title: string): string {
  const base = slugify(title, { lower: true, strict: true, locale: 'en' }).slice(0, 60);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${base || 'article'}-${rand}`;
}

async function expandToArticle(opts: {
  tweet_ar?: string;
  tweet_en?: string;
  title: string;
  context?: string;
  speaker?: { name: string; title: string } | null;
  category: string;
}) {
  const { tweet_ar, tweet_en, title, context, speaker, category } = opts;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) throw new Error('No OPENAI_API_KEY');

  const speakerNote = speaker ? `Speaker: ${speaker.name}${speaker.title ? ` (${speaker.title})` : ''}` : '';
  const contextNote = context ? `Context: ${context}` : '';

  const [arRes, enRes] = await Promise.all([
    // Arabic article
    fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.4,
        messages: [{
          role: 'system',
          content: `أنت محرر في موقع قطر ستاندرد الإخباري. اكتب مقالاً إخبارياً باللغة العربية الفصحى بناءً على التغريدة والسياق المعطى.
المقال يجب أن يكون بين 400 و600 كلمة. يتضمن: مقدمة قوية، شرح للسياق والأهمية، تفاصيل وخلفية، وخلاصة.
لا تستخدم كلمات ذكاء اصطناعي مثل: يُجسّد، يُرسّخ، يُسلّط الضوء، مما يعكس.
الأسلوب: احترافي، محايد، متوازن مع منظور قطري.`,
        }, {
          role: 'user',
          content: `عنوان الخبر: ${title}\n${speakerNote}\n${contextNote}\nالتغريدة: ${tweet_ar || tweet_en || title}\n\nاكتب المقال:`,
        }],
      }),
    }).then(r => r.json()).then(d => d.choices?.[0]?.message?.content?.trim() || ''),

    // English article
    fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.4,
        messages: [{
          role: 'system',
          content: `You are an editor at Qatar Standard news website. Write a professional news article in English based on the tweet and context provided. 400–600 words. Include: strong lede, context and significance, details and background, conclusion. Pro-Qatar perspective. No AI filler phrases.`,
        }, {
          role: 'user',
          content: `Title: ${title}\n${speakerNote}\n${contextNote}\nTweet: ${tweet_en || tweet_ar || title}\n\nWrite the article:`,
        }],
      }),
    }).then(r => r.json()).then(d => d.choices?.[0]?.message?.content?.trim() || ''),
  ]);

  return { body_ar: arRes, body_en: enRes };
}

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

  const category = body.category || 'general';
  const title_ar = body.title_ar || body.title;
  const title_en = body.title_en || body.title;
  const slug = makeSlug(title_en);

  let body_ar = '';
  let body_en = '';

  try {
    const expanded = await expandToArticle({
      tweet_ar: body.tweet_ar,
      tweet_en: body.tweet_en,
      title: body.title,
      context: body.context,
      speaker: body.speaker,
      category,
    });
    body_ar = expanded.body_ar;
    body_en = expanded.body_en;
  } catch (err) {
    console.error('[generate] GPT-4o failed:', err);
    body_ar = body.tweet_ar || body.title;
    body_en = body.tweet_en || body.title;
  }

  // Excerpt = first 2 sentences
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
    image_url: body.image_url || null,
    source: body.source || 'bot',
    tweet_ar: body.tweet_ar || null,
    tweet_en: body.tweet_en || null,
    speaker_name: body.speaker?.name || null,
    speaker_title: body.speaker?.title || null,
    published_at: body.published_at || new Date().toISOString(),
  });

  return NextResponse.json({ success: true, slug: article.slug, id: article.id }, { status: 201 });
}
