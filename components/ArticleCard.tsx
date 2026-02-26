import Link from 'next/link';
import { Article, CATEGORIES } from '@/lib/articles';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);

  if (mins < 60)  return `منذ ${mins || 1} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days < 7)   return `منذ ${days} يوم`;
  return new Date(dateStr).toLocaleDateString('ar-QA', { year: 'numeric', month: 'short', day: 'numeric' });
}

interface Props {
  article: Article;
  size?: 'sm' | 'md' | 'lg';
}

export default function ArticleCard({ article, size = 'md' }: Props) {
  const catLabel = CATEGORIES[article.category] || article.category;

  if (size === 'lg') {
    return (
      <Link href={`/article/${article.slug}`} className="group block">
        <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-[16/9] mb-4">
          {article.image_url ? (
            <img
              src={article.image_url}
              alt={article.title_ar}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-maroon-800 to-maroon-600 flex items-center justify-center">
              <span className="text-white/30 text-6xl font-black">ق</span>
            </div>
          )}
          <span className="absolute top-3 right-3 bg-maroon-800 text-white text-xs px-2 py-1 rounded font-medium">
            {catLabel}
          </span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 leading-tight group-hover:text-maroon-800 transition-colors mb-2 line-clamp-2" dir="rtl">
          {article.title_ar}
        </h2>
        {article.excerpt_ar && (
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-3" dir="rtl">
            {article.excerpt_ar}
          </p>
        )}
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-400" dir="rtl">
          {article.speaker_name && (
            <>
              <span className="font-medium text-gray-600">{article.speaker_name}</span>
              <span>·</span>
            </>
          )}
          <span>{timeAgo(article.published_at)}</span>
        </div>
      </Link>
    );
  }

  if (size === 'sm') {
    return (
      <Link href={`/article/${article.slug}`} className="group flex gap-3 py-3 border-b border-gray-100 last:border-0">
        {article.image_url && (
          <div className="relative overflow-hidden rounded w-20 h-16 shrink-0 bg-gray-100">
            <img src={article.image_url} alt={article.title_ar} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span className="text-xs text-maroon-700 font-medium">{catLabel}</span>
          <h3 className="text-sm font-bold text-gray-900 leading-snug group-hover:text-maroon-800 transition-colors line-clamp-2 mt-0.5" dir="rtl">
            {article.title_ar}
          </h3>
          <span className="text-xs text-gray-400">{timeAgo(article.published_at)}</span>
        </div>
      </Link>
    );
  }

  // md (default)
  return (
    <Link href={`/article/${article.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-[16/9] mb-3">
        {article.image_url ? (
          <img
            src={article.image_url}
            alt={article.title_ar}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-maroon-700 to-maroon-500 flex items-center justify-center">
            <span className="text-white/30 text-4xl font-black">ق</span>
          </div>
        )}
        <span className="absolute top-2 right-2 bg-maroon-800 text-white text-xs px-2 py-0.5 rounded font-medium">
          {catLabel}
        </span>
      </div>
      <h3 className="text-base font-bold text-gray-900 leading-snug group-hover:text-maroon-800 transition-colors line-clamp-2" dir="rtl">
        {article.title_ar}
      </h3>
      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400" dir="rtl">
        {article.speaker_name && (
          <>
            <span className="text-gray-500">{article.speaker_name}</span>
            <span>·</span>
          </>
        )}
        <span>{timeAgo(article.published_at)}</span>
      </div>
    </Link>
  );
}
