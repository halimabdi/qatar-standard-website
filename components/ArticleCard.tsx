'use client';
import Link from 'next/link';
import type { Article } from '@/lib/articles';
import { CATEGORIES_AR, CATEGORIES_EN } from '@/lib/categories';
import { useLang } from '@/contexts/LanguageContext';

function timeAgo(dateStr: string, lang: 'en' | 'ar'): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);

  if (lang === 'ar') {
    if (mins < 60)  return `منذ ${mins || 1} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7)   return `منذ ${days} يوم`;
    return new Date(dateStr).toLocaleDateString('ar-QA', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  if (mins < 60)  return `${mins || 1}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface Props {
  article: Article;
  size?: 'sm' | 'md' | 'lg';
}

export default function ArticleCard({ article, size = 'md' }: Props) {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const title   = isAr ? (article.title_ar || article.title_en || '') : (article.title_en || article.title_ar || '');
  const excerpt = isAr ? (article.excerpt_ar || article.excerpt_en || '') : (article.excerpt_en || article.excerpt_ar || '');
  const catLabel = isAr ? (CATEGORIES_AR[article.category] || article.category) : (CATEGORIES_EN[article.category] || article.category);
  const timeStr = timeAgo(article.published_at, lang);
  const dir = isAr ? 'rtl' : 'ltr';

  if (size === 'lg') {
    return (
      <Link href={`/article/${article.slug}`} className="group block">
        <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-[16/9] mb-4">
          {article.image_url ? (
            <img
              src={article.image_url}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-maroon-800 to-maroon-600 flex items-center justify-center">
              <span className="text-white/20 text-6xl font-black select-none">QS</span>
            </div>
          )}
          <span className="absolute top-3 left-3 bg-maroon-800 text-white text-xs px-2 py-1 rounded font-medium">
            {catLabel}
          </span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 leading-tight group-hover:text-maroon-800 transition-colors mb-2 line-clamp-2" dir={dir}>
          {title}
        </h2>
        {excerpt && (
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-3" dir={dir}>
            {excerpt}
          </p>
        )}
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
          {article.speaker_name && (
            <>
              <span className="font-medium text-gray-600">{article.speaker_name}</span>
              <span>·</span>
            </>
          )}
          <span>{timeStr}</span>
        </div>
      </Link>
    );
  }

  if (size === 'sm') {
    return (
      <Link href={`/article/${article.slug}`} className="group flex gap-3 py-3 border-b border-gray-100 last:border-0">
        {article.image_url && (
          <div className="relative overflow-hidden rounded w-20 h-16 shrink-0 bg-gray-100">
            <img src={article.image_url} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span className="text-xs text-maroon-700 font-medium">{catLabel}</span>
          <h3 className="text-sm font-bold text-gray-900 leading-snug group-hover:text-maroon-800 transition-colors line-clamp-2 mt-0.5" dir={dir}>
            {title}
          </h3>
          <span className="text-xs text-gray-400">{timeStr}</span>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/article/${article.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-[16/9] mb-3">
        {article.image_url ? (
          <img
            src={article.image_url}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-maroon-700 to-maroon-500 flex items-center justify-center">
            <span className="text-white/20 text-4xl font-black select-none">QS</span>
          </div>
        )}
        <span className="absolute top-2 left-2 bg-maroon-800 text-white text-xs px-2 py-0.5 rounded font-medium">
          {catLabel}
        </span>
      </div>
      <h3 className="text-base font-bold text-gray-900 leading-snug group-hover:text-maroon-800 transition-colors line-clamp-2" dir={dir}>
        {title}
      </h3>
      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
        {article.speaker_name && (
          <>
            <span className="text-gray-500">{article.speaker_name}</span>
            <span>·</span>
          </>
        )}
        <span>{timeStr}</span>
      </div>
    </Link>
  );
}
