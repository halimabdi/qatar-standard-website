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
  const [articles, setArticles] = useState<BreakingArticle[]>([]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    fetch('/api/articles?limit=5&breaking=true')
      .then(r => r.json())
      .then(data => {
        if (data.articles?.length) {
          setArticles(data.articles);
          const latest = data.articles[0];
          const lastSeen = localStorage.getItem('qs-last-breaking-slug');
          if (latest.slug !== lastSeen) {
            localStorage.setItem('qs-last-breaking-slug', latest.slug);
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (articles.length <= 1) return;
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % articles.length);
        setVisible(true);
      }, 400);
    }, 5000);
    return () => clearInterval(id);
  }, [articles.length]);

  if (!articles.length) return null;

  const article = articles[index];
  const title = isAr
    ? (article.title_ar || article.title_en)
    : (article.title_en || article.title_ar);

  return (
    <div className="bg-red-700 text-white py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center gap-3 text-sm">
        <span className="bg-white text-red-700 px-2 py-0.5 rounded text-xs font-black uppercase shrink-0">
          {isAr ? 'عاجل' : 'Breaking'}
        </span>
        {articles.length > 1 && (
          <span className="text-red-200 text-xs shrink-0 font-mono">{index + 1}/{articles.length}</span>
        )}
        <div className="overflow-hidden flex-1">
          <Link
            href={'/article/' + article.slug}
            className="block truncate hover:underline font-medium transition-opacity duration-300"
            style={{ opacity: visible ? 1 : 0 }}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            {title}
          </Link>
        </div>
      </div>
    </div>
  );
}
