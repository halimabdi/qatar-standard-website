'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useLang } from '@/contexts/LanguageContext';

interface SearchResult {
  slug: string;
  title_en: string | null;
  title_ar: string | null;
  category: string;
  published_at: string;
}

export default function SearchBar() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSearch(q: string) {
    setQuery(q);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (q.length < 2) { setResults([]); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/search?q=' + encodeURIComponent(q));
        const data = await res.json();
        setResults(data.articles || []);
      } catch { setResults([]); }
      setLoading(false);
    }, 300);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-gray-600 hover:text-maroon-800"
        aria-label={isAr ? 'بحث' : 'Search'}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="p-3">
            <input
              type="text"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              placeholder={isAr ? 'ابحث في الأخبار...' : 'Search articles...'}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-maroon-800"
              autoFocus
              dir={isAr ? 'rtl' : 'ltr'}
            />
          </div>
          {loading && <p className="px-3 pb-3 text-xs text-gray-400">{isAr ? 'جاري البحث...' : 'Searching...'}</p>}
          {!loading && results.length > 0 && (
            <ul className="max-h-64 overflow-y-auto border-t border-gray-100">
              {results.map(r => (
                <li key={r.slug}>
                  <Link
                    href={'/article/' + r.slug}
                    onClick={() => { setOpen(false); setQuery(''); setResults([]); }}
                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-maroon-50 hover:text-maroon-800"
                    dir={isAr ? 'rtl' : 'ltr'}
                  >
                    {isAr ? (r.title_ar || r.title_en) : (r.title_en || r.title_ar)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {!loading && query.length >= 2 && results.length === 0 && (
            <p className="px-3 pb-3 text-xs text-gray-400">{isAr ? 'لا توجد نتائج' : 'No results found'}</p>
          )}
        </div>
      )}
    </div>
  );
}
