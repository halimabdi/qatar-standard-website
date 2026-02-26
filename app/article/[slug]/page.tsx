import { getArticleBySlug, getArticles, CATEGORIES } from '@/lib/articles';
import ArticleCard from '@/components/ArticleCard';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const revalidate = 300;

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = getArticleBySlug(params.slug);
  if (!article) notFound();

  const related = getArticles({ limit: 4, category: article.category })
    .filter(a => a.slug !== article.slug)
    .slice(0, 3);

  const catLabel = CATEGORIES[article.category] || article.category;

  const publishedDate = new Date(article.published_at).toLocaleDateString('ar-QA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const paragraphsAr = article.body_ar.split('\n').filter(Boolean);
  const paragraphsEn = article.body_en?.split('\n').filter(Boolean) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Article */}
        <article className="lg:col-span-3">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-gray-400 mb-4" dir="rtl">
            <Link href="/" className="hover:text-maroon-800">الرئيسية</Link>
            <span>/</span>
            <Link href={`/category/${article.category}`} className="hover:text-maroon-800">{catLabel}</Link>
          </nav>

          {/* Category tag */}
          <Link
            href={`/category/${article.category}`}
            className="inline-block bg-maroon-800 text-white text-xs px-3 py-1 rounded mb-4 font-medium hover:bg-maroon-700"
          >
            {catLabel}
          </Link>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-4" dir="rtl">
            {article.title_ar}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-6 border-b border-gray-200 pb-4" dir="rtl">
            {article.speaker_name && (
              <span className="font-semibold text-gray-700">
                {article.speaker_name}
                {article.speaker_title && ` — ${article.speaker_title}`}
              </span>
            )}
            <span>{publishedDate}</span>
            <span className="capitalize text-gray-400">{article.source}</span>
          </div>

          {/* Hero image */}
          {article.image_url && (
            <div className="rounded-xl overflow-hidden mb-6 aspect-[16/9] bg-gray-100">
              <img
                src={article.image_url}
                alt={article.title_ar}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Arabic body */}
          <div className="prose-ar mb-8">
            {paragraphsAr.map((p, i) => (
              <p key={i} className="mb-5 text-gray-800 leading-loose text-lg" dir="rtl">
                {p}
              </p>
            ))}
          </div>

          {/* English body */}
          {paragraphsEn.length > 0 && (
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">English Version</h2>
              {article.title_en && (
                <h3 className="text-2xl font-bold text-gray-800 mb-4">{article.title_en}</h3>
              )}
              {paragraphsEn.map((p, i) => (
                <p key={i} className="mb-4 text-gray-700 leading-relaxed">
                  {p}
                </p>
              ))}
            </div>
          )}

          {/* Tweet source */}
          {(article.tweet_ar || article.tweet_en) && (
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg" dir="rtl">
              <p className="text-xs text-gray-400 mb-1">المصدر / التغريدة الأصلية</p>
              <p className="text-sm text-gray-700">{article.tweet_ar || article.tweet_en}</p>
            </div>
          )}
        </article>

        {/* Sidebar */}
        <aside className="lg:col-span-1">
          {related.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-maroon-800 mb-3 border-b-2 border-maroon-800 pb-1 text-right">
                مقالات ذات صلة
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
