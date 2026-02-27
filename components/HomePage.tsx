'use client';
import type { Article } from '@/lib/articles';
import type { GhostPost } from '@/lib/ghost';
import { CATEGORIES_AR, CATEGORIES_EN, CATEGORY_KEYS } from '@/lib/categories';
import ArticleCard from './ArticleCard';
import Link from 'next/link';
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
          <img src="/qatar-standard-logo.png" alt="Qatar Standard" className="h-24 w-auto" />
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

      {/* HERO */}
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

      {/* FEATURED ANALYSIS — shows latest Ghost post when published */}
      {featuredAnalysis && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-gold rounded" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-maroon-800">
              {isAr ? 'تحليل معمّق' : 'Featured Analysis'}
            </h2>
            <Link href="/analysis" className="text-xs text-gray-400 hover:text-maroon-800 transition-colors ml-auto">
              {isAr ? 'عرض الكل ←' : 'View all →'}
            </Link>
          </div>
          <Link href={`/analysis/${featuredAnalysis.slug}`} className="group block bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 md:flex hover:shadow-md transition-shadow">
            {featuredAnalysis.feature_image && (
              <div className="md:w-2/5 flex-shrink-0 h-52 md:h-auto overflow-hidden">
                <img
                  src={featuredAnalysis.feature_image}
                  alt={featuredAnalysis.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            )}
            <div className="p-6 flex flex-col justify-center">
              <span className="inline-block bg-maroon-800 text-white text-xs font-bold px-2 py-0.5 rounded mb-3 w-fit">
                {isAr ? 'تحليل' : 'Analysis'}
              </span>
              <h3 className="text-xl font-bold text-gray-900 leading-snug mb-2 group-hover:text-maroon-800 transition-colors">
                {featuredAnalysis.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
                {featuredAnalysis.custom_excerpt || featuredAnalysis.excerpt || ''}
              </p>
              <span className="mt-4 text-xs font-semibold text-maroon-800">
                {isAr ? 'اقرأ التحليل ←' : 'Read Analysis →'}
              </span>
            </div>
          </Link>
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
