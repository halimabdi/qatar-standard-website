'use client';
import type { GhostPost } from '@/lib/ghost';
import Link from 'next/link';
import { useLang } from '@/contexts/LanguageContext';

function formatDate(dateStr: string, lang: 'en' | 'ar'): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(lang === 'ar' ? 'ar-QA' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

interface Props {
  posts: GhostPost[];
}

export default function AnalysisPage({ posts }: Props) {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const heading    = isAr ? 'تحليلات' : 'Analysis';
  const subheading = isAr
    ? 'تحليلات معمّقة في السياسة القطرية والدبلوماسية الخليجية وشؤون الشرق الأوسط'
    : 'In-depth analysis of Qatar diplomacy, Gulf geopolitics, and Middle East affairs';
  const readMore   = isAr ? 'اقرأ التحليل' : 'Read Analysis';
  const minRead    = isAr ? 'د قراءة' : 'min read';
  const noContent  = isAr ? 'لا توجد تحليلات بعد.' : 'No analysis pieces published yet.';
  const byLabel    = isAr ? 'بقلم تحرير قطر ستاندرد' : 'Qatar Standard Editorial';

  return (
    <div className="min-h-screen bg-gray-50" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Page header */}
      <div className="bg-maroon-800 text-white py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 bg-gold rounded" />
            <h1 className="text-3xl font-bold tracking-tight">{heading}</h1>
          </div>
          <p className="text-white/75 text-sm mt-2 max-w-2xl">{subheading}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {posts.length === 0 ? (
          <p className="text-gray-500 text-center py-20">{noContent}</p>
        ) : (
          <div className="space-y-8">
            {/* Featured first post */}
            {posts[0] && (
              <article className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 md:flex">
                {posts[0].feature_image && (
                  <div className="md:w-2/5 flex-shrink-0">
                    <img
                      src={posts[0].feature_image}
                      alt={posts[0].title}
                      className="w-full h-56 md:h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                )}
                <div className="p-6 flex flex-col justify-between flex-1">
                  <div>
                    {posts[0].primary_tag && (
                      <span className="inline-block bg-maroon-800 text-white text-xs font-bold px-2 py-0.5 rounded mb-3">
                        {posts[0].primary_tag.name}
                      </span>
                    )}
                    <h2 className="text-2xl font-bold text-gray-900 leading-snug mb-3">
                      <Link href={`/analysis/${posts[0].slug}`} className="hover:text-maroon-800 transition-colors">
                        {posts[0].title}
                      </Link>
                    </h2>
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                      {posts[0].custom_excerpt || posts[0].excerpt || ''}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-5">
                    <div className="text-xs text-gray-400">
                      <span>{byLabel}</span>
                      <span className="mx-2">·</span>
                      <span>{formatDate(posts[0].published_at, lang)}</span>
                      {posts[0].reading_time > 0 && (
                        <>
                          <span className="mx-2">·</span>
                          <span>{posts[0].reading_time} {minRead}</span>
                        </>
                      )}
                    </div>
                    <Link
                      href={`/analysis/${posts[0].slug}`}
                      className="text-xs font-semibold text-maroon-800 hover:underline"
                    >
                      {readMore} →
                    </Link>
                  </div>
                </div>
              </article>
            )}

            {/* Remaining posts grid */}
            {posts.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {posts.slice(1).map(post => (
                  <article key={post.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                    {post.feature_image && (
                      <img
                        src={post.feature_image}
                        alt={post.title}
                        className="w-full h-44 object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    <div className="p-5">
                      {post.primary_tag && (
                        <span className="inline-block bg-maroon-50 text-maroon-800 text-xs font-bold px-2 py-0.5 rounded mb-2">
                          {post.primary_tag.name}
                        </span>
                      )}
                      <h2 className="text-lg font-bold text-gray-900 leading-snug mb-2">
                        <Link href={`/analysis/${post.slug}`} className="hover:text-maroon-800 transition-colors">
                          {post.title}
                        </Link>
                      </h2>
                      <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
                        {post.custom_excerpt || post.excerpt || ''}
                      </p>
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-xs text-gray-400">
                          {formatDate(post.published_at, lang)}
                          {post.reading_time > 0 && (
                            <> · {post.reading_time} {minRead}</>
                          )}
                        </div>
                        <Link
                          href={`/analysis/${post.slug}`}
                          className="text-xs font-semibold text-maroon-800 hover:underline"
                        >
                          {readMore} →
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
