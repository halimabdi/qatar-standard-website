'use client';
import type { Article } from '@/lib/articles';
import { CATEGORIES_AR, CATEGORIES_EN } from '@/lib/categories';
import ArticleCard from './ArticleCard';
import Link from 'next/link';
import { useLang } from '@/contexts/LanguageContext';

interface Props {
  cat: string;
  articles: Article[];
  total: number;
  page: number;
  pages: number;
}

export default function CategoryPage({ cat, articles, total, page, pages }: Props) {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const catLabel = isAr ? (CATEGORIES_AR[cat] || cat) : (CATEGORIES_EN[cat] || cat);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="border-b-4 border-maroon-800 pb-3 mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">
            {isAr ? 'قسم' : 'Category'}
          </p>
          <h1 className="text-3xl font-black text-gray-900">{catLabel}</h1>
        </div>
        <span className="text-sm text-gray-400">
          {total} {isAr ? 'مقال' : 'articles'}
        </span>
      </div>

      {articles.length === 0 ? (
        <p className="text-center text-gray-500 py-20">
          {isAr ? 'لا توجد مقالات في هذا القسم بعد.' : 'No articles in this category yet.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {articles.map(a => (
            <ArticleCard key={a.id} article={a} size="md" />
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: pages }).map((_, i) => (
            <Link
              key={i}
              href={`/category/${cat}?page=${i + 1}`}
              className={`w-9 h-9 flex items-center justify-center rounded text-sm font-medium transition-colors ${
                page === i + 1
                  ? 'bg-maroon-800 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-maroon-800 hover:text-maroon-800'
              }`}
            >
              {i + 1}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
