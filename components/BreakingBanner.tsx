'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLang } from '@/contexts/LanguageContext';

interface BreakingArticle {
  slug: string;
  title_en: string | null;
  title_ar: string | null;
}

export default function BreakingBanner() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [article, setArticle] = useState<BreakingArticle | null>(null);

  useEffect(() => {
    fetch('/api/articles?limit=1&breaking=true')
      .then(r => r.json())
      .then(data => {
        const a = data.articles?.[0];
        if (a) setArticle(a);
      })
      .catch(() => {});
  }, []);

  if (!article) return null;

  const title = isAr ? (article.title_ar || article.title_en) : (article.title_en || article.title_ar);

  return (
    <div className="bg-red-700 text-white py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center gap-3 text-sm">
        <span className="bg-white text-red-700 px-2 py-0.5 rounded text-xs font-black uppercase shrink-0">
          {isAr ? 'عاجل' : 'Breaking'}
        </span>
        <Link href={'/article/' + article.slug} className="truncate hover:underline font-medium" dir={isAr ? 'rtl' : 'ltr'}>
          {title}
        </Link>
      </div>
    </div>
  );
}
