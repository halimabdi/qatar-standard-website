'use client';
import type { GhostPost } from '@/lib/ghost';
import Link from 'next/link';
import { useLang } from '@/contexts/LanguageContext';

function formatDate(dateStr: string, lang: 'en' | 'ar'): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(lang === 'ar' ? 'ar-QA' : 'en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

interface Props {
  post: GhostPost;
  related: GhostPost[];
}

export default function AnalysisDetail({ post, related }: Props) {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const byLabel    = isAr ? 'بقلم تحرير قطر ستاندرد' : 'Qatar Standard Editorial';
  const minRead    = isAr ? 'د قراءة' : 'min read';
  const backLabel  = isAr ? '← تحليلات' : '← Analysis';
  const relatedLabel = isAr ? 'تحليلات ذات صلة' : 'More Analysis';

  const siteUrl = 'https://qatar-standard.com';
  const postUrl = `${siteUrl}/analysis/${post.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.custom_excerpt || post.excerpt || '',
    image: post.feature_image || `${siteUrl}/qatar-standard-logo.png`,
    datePublished: post.published_at,
    author: { '@type': 'Organization', name: 'Qatar Standard' },
    publisher: {
      '@type': 'Organization',
      name: 'Qatar Standard',
      logo: { '@type': 'ImageObject', url: `${siteUrl}/qatar-standard-logo.png` },
    },
    url: postUrl,
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={isAr ? 'rtl' : 'ltr'}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero image */}
      {post.feature_image && (
        <div className="w-full h-72 md:h-96 overflow-hidden bg-gray-200">
          <img
            src={post.feature_image}
            alt={post.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Back link */}
        <Link href="/analysis" className="text-sm text-maroon-800 font-semibold hover:underline">
          {backLabel}
        </Link>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.tags.map(tag => (
              <span key={tag.id} className="bg-maroon-800 text-white text-xs font-bold px-2 py-0.5 rounded">
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mt-4 mb-4">
          {post.title}
        </h1>

        {/* Excerpt */}
        {(post.custom_excerpt || post.excerpt) && (
          <p className="text-lg text-gray-600 leading-relaxed border-l-4 border-gold pl-4 mb-6 italic">
            {post.custom_excerpt || post.excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 text-sm text-gray-500 pb-6 border-b border-gray-200 mb-8">
          <span className="font-semibold text-gray-700">{byLabel}</span>
          <span>·</span>
          <span>{formatDate(post.published_at, lang)}</span>
          {post.reading_time > 0 && (
            <>
              <span>·</span>
              <span>{post.reading_time} {minRead}</span>
            </>
          )}
        </div>

        {/* Ghost HTML content */}
        <div
          className="prose prose-lg max-w-none
            prose-headings:font-bold prose-headings:text-gray-900
            prose-p:text-gray-700 prose-p:leading-relaxed
            prose-a:text-maroon-800 prose-a:no-underline hover:prose-a:underline
            prose-blockquote:border-l-4 prose-blockquote:border-gold prose-blockquote:text-gray-600
            prose-img:rounded-lg prose-img:shadow-sm
            prose-strong:text-gray-900"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />

        {/* Share */}
        <div className="mt-10 pt-6 border-t border-gray-200 flex items-center gap-4">
          <span className="text-sm text-gray-500 font-medium">{isAr ? 'شارك:' : 'Share:'}</span>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(post.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-maroon-800 hover:underline"
          >
            X / Twitter
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-maroon-800 hover:underline"
          >
            LinkedIn
          </a>
        </div>
      </div>

      {/* Related analysis */}
      {related.length > 0 && (
        <div className="bg-white border-t border-gray-200 py-10 mt-6">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{relatedLabel}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map(p => (
                <article key={p.id} className="group">
                  {p.feature_image && (
                    <img
                      src={p.feature_image}
                      alt={p.title}
                      className="w-full h-40 object-cover rounded-lg mb-3"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                  <h3 className="font-bold text-gray-900 leading-snug group-hover:text-maroon-800 transition-colors">
                    <Link href={`/analysis/${p.slug}`}>{p.title}</Link>
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {p.reading_time > 0 ? `${p.reading_time} ${minRead}` : ''}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
