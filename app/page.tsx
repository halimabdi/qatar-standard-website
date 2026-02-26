import { getArticles, getLatestArticle, CATEGORIES } from '@/lib/articles';
import ArticleCard from '@/components/ArticleCard';
import Link from 'next/link';

export const revalidate = 60;

export default function HomePage() {
  const hero    = getLatestArticle();
  const recent  = getArticles({ limit: 9, offset: hero ? 1 : 0 });
  const sidebar = getArticles({ limit: 6, offset: 10 });

  if (!hero) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center" dir="rtl">
        <div className="text-6xl font-black text-maroon-800 mb-4" style={{ fontFamily: 'serif' }}>قطر ستاندرد</div>
        <p className="text-gray-500">لم يتم نشر أي مقالات بعد. تابع معنا قريباً.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      {/* HERO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 border-b border-gray-200 pb-8">
        <div className="lg:col-span-2">
          <ArticleCard article={hero} size="lg" />
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-maroon-800 mb-3 border-b-2 border-maroon-800 pb-1 text-right">
            آخر الأخبار
          </h3>
          {getArticles({ limit: 5, offset: 1 }).map(a => (
            <ArticleCard key={a.id} article={a} size="sm" />
          ))}
        </div>
      </div>

      {/* GRID + SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 border-b border-gray-200 pb-2 text-right">
            المقالات
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {recent.map(a => (
              <ArticleCard key={a.id} article={a} size="md" />
            ))}
          </div>
        </div>

        <aside className="lg:col-span-1">
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-maroon-800 mb-3 border-b-2 border-maroon-800 pb-1 text-right">
              الأقسام
            </h3>
            <div className="flex flex-wrap gap-2 justify-end">
              {Object.entries(CATEGORIES).map(([key, label]) => (
                <Link
                  key={key}
                  href={`/category/${key}`}
                  className="text-xs px-3 py-1.5 bg-maroon-50 text-maroon-800 rounded-full hover:bg-maroon-800 hover:text-white transition-colors font-medium"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-maroon-800 mb-3 border-b-2 border-maroon-800 pb-1 text-right">
              مزيد من الأخبار
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
