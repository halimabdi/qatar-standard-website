import { getArticles, countArticles, CATEGORIES } from '@/lib/articles';
import ArticleCard from '@/components/ArticleCard';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const revalidate = 120;

export default function CategoryPage({
  params,
  searchParams,
}: {
  params: { cat: string };
  searchParams: { page?: string };
}) {
  if (!CATEGORIES[params.cat]) notFound();

  const page    = Math.max(1, parseInt(searchParams.page || '1'));
  const limit   = 12;
  const offset  = (page - 1) * limit;
  const total   = countArticles(params.cat);
  const pages   = Math.ceil(total / limit);
  const articles = getArticles({ limit, offset, category: params.cat });

  const catLabel = CATEGORIES[params.cat];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="border-b-4 border-maroon-800 pb-3 mb-8 flex items-end justify-between" dir="rtl">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">قسم</p>
          <h1 className="text-3xl font-black text-gray-900">{catLabel}</h1>
        </div>
        <span className="text-sm text-gray-400">{total} مقال</span>
      </div>

      {articles.length === 0 ? (
        <p className="text-center text-gray-500 py-20">لا توجد مقالات في هذا القسم بعد.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {articles.map(a => (
            <ArticleCard key={a.id} article={a} size="md" />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-10" dir="rtl">
          {Array.from({ length: pages }).map((_, i) => (
            <Link
              key={i}
              href={`/category/${params.cat}?page=${i + 1}`}
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
