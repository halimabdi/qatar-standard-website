'use client';
import type { Article } from '@/lib/articles';
import type { GhostPost } from '@/lib/ghost';
import { CATEGORIES_AR, CATEGORIES_EN, CATEGORY_KEYS } from '@/lib/categories';
import ArticleCard from './ArticleCard';
import Link from 'next/link';
import Image from 'next/image';
import { useLang } from '@/contexts/LanguageContext';

interface Props {
  hero: Article | null;
  recent: Article[];
  latest5: Article[];
  sidebar: Article[];
  featuredAnalysis?: GhostPost | null;
}

export default function HomePage({ hero, recent, latest5, sidebar, featuredAnalysis }: Props) {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  if (!hero) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="flex justify-center mb-6">
          <Image src="/qatar-standard-logo.png" alt="Qatar Standard" width={200} height={96} className="h-24 w-auto" />
        </div>
        <p className="text-gray-500 text-lg">
          {isAr ? 'لم يتم نشر أي مقالات بعد. تابع معنا قريباً.' : 'No articles published yet. Check back soon.'}
        </p>
      </div>
    );
  }

  const catKeys = CATEGORY_KEYS;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      {/* HERO — analysis takes top slot when published, otherwise news hero */}
      {featuredAnalysis ? (
        <div className="mb-8 border-b border-gray-200 pb-8">
          {/* Analysis hero — full width with image overlay */}
          <Link
            href={`/analysis/${featuredAnalysis.slug}`}
            className="group block relative rounded-xl overflow-hidden mb-6 shadow-md"
            style={{ minHeight: '420px' }}
          >
            {/* Background image */}
            {featuredAnalysis.feature_image ? (
              <Image
                src={featuredAnalysis.feature_image}
                alt={featuredAnalysis.title}
                fill
                sizes="100vw"
                className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 bg-maroon-900" />
            )}
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-end h-full p-6 md:p-10" style={{ minHeight: '420px' }}>
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-gold text-maroon-900 text-xs font-black px-3 py-1 rounded uppercase tracking-widest">
                  {isAr ? 'تحليل معمّق' : 'Analysis'}
                </span>
                {featuredAnalysis.reading_time > 0 && (
                  <span className="text-white/70 text-xs">
                    {featuredAnalysis.reading_time} {isAr ? 'د قراءة' : 'min read'}
                  </span>
                )}
                <Link
                  href="/analysis"
                  onClick={e => e.stopPropagation()}
                  className="ml-auto text-white/60 text-xs hover:text-white transition-colors"
                >
                  {isAr ? 'كل التحليلات →' : 'All Analysis →'}
                </Link>
              </div>
              <h1 className="text-2xl md:text-4xl font-black text-white leading-tight mb-3 max-w-3xl group-hover:text-gold transition-colors">
                {featuredAnalysis.title}
              </h1>
              {(featuredAnalysis.custom_excerpt || featuredAnalysis.excerpt) && (
                <p className="text-white/80 text-sm md:text-base leading-relaxed max-w-2xl line-clamp-2">
                  {featuredAnalysis.custom_excerpt || featuredAnalysis.excerpt}
                </p>
              )}
              <span className="mt-5 inline-flex items-center gap-2 text-gold text-sm font-bold">
                {isAr ? 'اقرأ التحليل' : 'Read Full Analysis'}
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </div>
          </Link>

          {/* News row below analysis hero */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {hero && <ArticleCard article={hero} size="lg" />}
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-maroon-800 mb-3 border-b-2 border-maroon-800 pb-1">
                {isAr ? 'آخر الأخبار' : 'Latest News'}
              </h3>
              {latest5.map(a => (
                <ArticleCard key={a.id} article={a} size="sm" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* No analysis — regular news hero */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 border-b border-gray-200 pb-8">
          <div className="lg:col-span-2">
            <ArticleCard article={hero} size="lg" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-maroon-800 mb-3 border-b-2 border-maroon-800 pb-1">
              {isAr ? 'آخر الأخبار' : 'Latest News'}
            </h3>
            {latest5.map(a => (
              <ArticleCard key={a.id} article={a} size="sm" />
            ))}
          </div>
        </div>
      )}

      {/* GRID + SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 border-b border-gray-200 pb-2">
            {isAr ? 'المقالات' : 'Articles'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {recent.map(a => (
              <ArticleCard key={a.id} article={a} size="md" />
            ))}
          </div>
        </div>

        <aside className="lg:col-span-1">
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-maroon-800 mb-3 border-b-2 border-maroon-800 pb-1">
              {isAr ? 'الأقسام' : 'Categories'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {catKeys.map(key => (
                <Link
                  key={key}
                  href={`/category/${key}`}
                  className="text-xs px-3 py-1.5 bg-maroon-50 text-maroon-800 rounded-full hover:bg-maroon-800 hover:text-white transition-colors font-medium"
                >
                  {isAr ? CATEGORIES_AR[key] : CATEGORIES_EN[key]}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-maroon-800 mb-3 border-b-2 border-maroon-800 pb-1">
              {isAr ? 'مزيد من الأخبار' : 'More Stories'}
            </h3>
            {sidebar.map(a => (
              <ArticleCard key={a.id} article={a} size="sm" />
            ))}
          </div>
        </aside>
      </div>

    </div>
  );
}
