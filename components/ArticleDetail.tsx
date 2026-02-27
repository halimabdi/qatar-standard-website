'use client';
import type { Article } from '@/lib/articles';
import { CATEGORIES_AR, CATEGORIES_EN } from '@/lib/categories';
import ArticleCard from './ArticleCard';
import Link from 'next/link';
import { useLang } from '@/contexts/LanguageContext';
import { marked } from 'marked';

function renderMarkdown(text: string): string {
  try {
    return marked.parse(text, { async: false }) as string;
  } catch {
    return text;
  }
}

function formatDateTime(dateStr: string, lang: 'en' | 'ar'): string {
  const d = new Date(dateStr);
  if (lang === 'ar') {
    return d.toLocaleString('ar-QA', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Qatar',
    }) + ' بتوقيت قطر';
  }
  return d.toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Qatar',
  }) + ' AST';
}

function sourceLabel(source: string, source_url: string | null): { label: string; url: string | null } | null {
  if (!source || source === 'manual') return null;
  const map: Record<string, string> = {
    bot:         'Qatar Standard',
    analysis:    'Qatar Standard Analysis',
    ghost:       'Qatar Standard',
    aljazeera:   'Al Jazeera',
    anadolu:     'Anadolu Agency',
    reuters:     'Reuters',
    middleeasteye: 'Middle East Eye',
    qna:         'Qatar News Agency',
  };
  const label = map[source] || source;
  return { label, url: source_url };
}

interface Props {
  article: Article;
  related: Article[];
}

export default function ArticleDetail({ article, related }: Props) {
  const { lang, setLang } = useLang();
  const isAr = lang === 'ar';

  const cleanMd  = (s: string) => s.replace(/\*\*/g, '').replace(/^#+\s*/gm, '').trim();
  const catLabel = isAr ? (CATEGORIES_AR[article.category] || article.category) : (CATEGORIES_EN[article.category] || article.category);
  const title    = cleanMd(isAr ? (article.title_ar || article.title_en || '') : (article.title_en || article.title_ar || ''));
  const body     = isAr ? (article.body_ar || article.body_en || '') : (article.body_en || article.body_ar || '');
  const dir      = isAr ? 'rtl' : 'ltr';

  const publishedDate = formatDateTime(article.published_at, lang);
  const bodyHtml      = renderMarkdown(body);

  const heroImg     = article.image_url || null;

  const src       = sourceLabel(article.source, article.source_url);
  const altBody   = isAr ? (article.body_en || '') : (article.body_ar || '');
  const altTitle  = isAr ? (article.title_en || '') : (article.title_ar || '');
  const altDir    = isAr ? 'ltr' : 'rtl';
  const altParas  = altBody.split('\n').filter(Boolean);

  // JSON-LD for Google News / Search
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    description: article.excerpt_en || article.excerpt_ar || '',
    image: heroImg.startsWith('/') ? `https://qatar-standard.com${heroImg}` : heroImg,
    datePublished: article.published_at,
    dateModified: article.published_at,
    author: { '@type': 'Organization', name: 'Qatar Standard' },
    publisher: {
      '@type': 'Organization',
      name: 'Qatar Standard',
      logo: { '@type': 'ImageObject', url: 'https://qatar-standard.com/qatar-standard-logo.png' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://qatar-standard.com/article/${article.slug}` },
    inLanguage: isAr ? 'ar' : 'en',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Article */}
        <article className="lg:col-span-3">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-gray-400 mb-4">
            <Link href="/" className="hover:text-maroon-800">{isAr ? 'الرئيسية' : 'Home'}</Link>
            <span>/</span>
            <Link href={`/category/${article.category}`} className="hover:text-maroon-800">{catLabel}</Link>
          </nav>

          {/* Category + Language toggle */}
          <div className="flex items-center justify-between mb-4">
            <Link
              href={`/category/${article.category}`}
              className="inline-block bg-maroon-800 text-white text-xs px-3 py-1 rounded font-medium hover:bg-maroon-700"
            >
              {catLabel}
            </Link>
            <button
              onClick={() => setLang(isAr ? 'en' : 'ar')}
              className="text-xs px-3 py-1 border border-maroon-800 text-maroon-800 rounded hover:bg-maroon-800 hover:text-white transition-colors font-medium"
            >
              {isAr ? 'Read in English' : 'اقرأ بالعربية'}
            </button>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4" dir={dir}>
            {title}
          </h1>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-6 border-b border-gray-200 pb-4">
            {article.speaker_name && (
              <span className="font-semibold text-gray-700">
                {article.speaker_name}
                {article.speaker_title && ` — ${article.speaker_title}`}
              </span>
            )}
            <span className="text-xs">{publishedDate}</span>
            {src && (
              <span className="text-xs text-gray-400">
                {isAr ? 'المصدر: ' : 'Source: '}
                {src.url ? (
                  <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-maroon-700 hover:underline">
                    {src.label}
                  </a>
                ) : (
                  <span className="text-maroon-700">{src.label}</span>
                )}
              </span>
            )}
          </div>

          {/* Hero media: video player if video_url exists, otherwise image */}
          {article.video_url ? (
            <div className="rounded-xl overflow-hidden mb-6 aspect-[16/9] bg-black">
              <video
                src={article.video_url}
                controls
                playsInline
                className="w-full h-full"
                poster={heroImg}
              />
            </div>
          ) : heroImg ? (
            <div className="rounded-xl overflow-hidden mb-6 aspect-[16/9] bg-gray-100">
              <img src={heroImg} alt={title} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.classList.add('hidden'); }} className="w-full h-full object-cover" />
            </div>
          ) : null}

          {/* Body */}
          <div
            className={isAr ? 'prose-ar mb-8' : 'prose-en mb-8'}
            dir={dir}
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />

          {/* Alternate language section */}
          {altParas.length > 0 && (
            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">
                  {isAr ? 'English Version' : 'النسخة العربية'}
                </h2>
                <button
                  onClick={() => setLang(isAr ? 'en' : 'ar')}
                  className="text-xs text-maroon-800 hover:underline"
                >
                  {isAr ? 'Switch to English' : 'التبديل إلى العربية'}
                </button>
              </div>
              {altTitle && (
                <h3 className="text-xl font-bold text-gray-700 mb-3" dir={altDir}>{cleanMd(altTitle)}</h3>
              )}
              {altParas.slice(0, 3).map((p, i) => (
                <p key={i} className="mb-4 text-gray-600 leading-relaxed" dir={altDir}>{p}</p>
              ))}
              {altParas.length > 3 && (
                <button
                  onClick={() => setLang(isAr ? 'en' : 'ar')}
                  className="text-sm text-maroon-800 hover:underline font-medium"
                >
                  {isAr ? 'Read full English version' : 'اقرأ النسخة العربية كاملة'} ...
                </button>
              )}
            </div>
          )}

          {/* Source tweet */}
          {(article.tweet_ar || article.tweet_en) && (
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">{isAr ? 'المصدر' : 'Source tweet'}</p>
              <p className="text-sm text-gray-700" dir={dir}>
                {isAr ? (article.tweet_ar || article.tweet_en) : (article.tweet_en || article.tweet_ar)}
              </p>
            </div>
          )}
        </article>

        {/* Sidebar */}
        <aside className="lg:col-span-1">
          {related.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-maroon-800 mb-3 border-b-2 border-maroon-800 pb-1">
                {isAr ? 'مقالات ذات صلة' : 'Related Stories'}
              </h3>
              {related.map(a => (
                <ArticleCard key={a.id} article={a} size="sm" />
              ))}
            </div>
          )}
        </aside>

      </div>
    </div>
  );
}
