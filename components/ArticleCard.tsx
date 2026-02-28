'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
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

// Category gradient backgrounds — shown when no real image is available
const CATEGORY_GRADIENTS: Record<string, string> = {
  palestine:  'from-red-900 to-red-950',
  diplomacy:  'from-blue-800 to-blue-950',
  gulf:       'from-teal-700 to-teal-950',
  economy:    'from-emerald-700 to-emerald-950',
  politics:   'from-amber-700 to-amber-950',
  turkey:     'from-red-700 to-rose-950',
  africa:     'from-green-700 to-green-950',
  media:      'from-gray-700 to-gray-900',
  general:    'from-slate-600 to-slate-900',
};

function ImagePlaceholder({ category, catLabel }: { category: string; catLabel: string }) {
  const gradient = CATEGORY_GRADIENTS[category] || 'from-slate-700 to-slate-900';
  return (
    <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
      <span className="text-white/40 text-xs font-medium uppercase tracking-widest">{catLabel}</span>
    </div>
  );
}

interface Props {
  article: Article;
  size?: 'sm' | 'md' | 'lg';
}

export default function ArticleCard({ article, size = 'md' }: Props) {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [imgFailed, setImgFailed] = useState(false);

  const cleanMd  = (s: string) => s.replace(/\*\*/g, '').replace(/^#+\s*/gm, '').trim();
  const title    = cleanMd(isAr ? (article.title_ar || article.title_en || '') : (article.title_en || article.title_ar || ''));
  const excerpt  = cleanMd(isAr ? (article.excerpt_ar || article.excerpt_en || '') : (article.excerpt_en || article.excerpt_ar || ''));
  const catLabel = isAr ? (CATEGORIES_AR[article.category] || article.category) : (CATEGORIES_EN[article.category] || article.category);
  const timeStr  = timeAgo(article.published_at, lang);
  const dir      = isAr ? 'rtl' : 'ltr';

  const hasImg = !!article.image_url && !imgFailed;

  if (size === 'lg') {
    return (
      <Link href={`/article/${article.slug}`} className="group block">
        <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-[16/9] mb-4">
          {hasImg ? (
            <Image
              src={article.image_url!}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 66vw"
              onError={() => setImgFailed(true)}
              className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
              priority
              unoptimized
            />
          ) : (
            <ImagePlaceholder category={article.category} catLabel={catLabel} />
          )}
          <span className="absolute top-3 start-3 bg-maroon-800 text-white text-xs px-2 py-1 rounded font-medium">
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
        <div className="relative overflow-hidden rounded w-20 h-16 shrink-0 bg-gray-100">
          {hasImg ? (
            <Image
              src={article.image_url!}
              alt={title}
              fill
              sizes="80px"
              onError={() => setImgFailed(true)}
              className="object-cover group-hover:scale-105 transition-transform"
              loading="lazy"
              unoptimized
            />
          ) : (
            <ImagePlaceholder category={article.category} catLabel={catLabel} />
          )}
        </div>
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
        {hasImg ? (
          <Image
            src={article.image_url!}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            onError={() => setImgFailed(true)}
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            unoptimized
          />
        ) : (
          <ImagePlaceholder category={article.category} catLabel={catLabel} />
        )}
        <span className="absolute top-2 start-2 bg-maroon-800 text-white text-xs px-2 py-0.5 rounded font-medium">
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
