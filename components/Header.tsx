'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';

const NAV = [
  { href: '/',                   en: 'Home',       ar: 'الرئيسية' },
  { href: '/category/diplomacy', en: 'Diplomacy',  ar: 'دبلوماسية' },
  { href: '/category/palestine', en: 'Palestine',  ar: 'فلسطين' },
  { href: '/category/economy',   en: 'Economy',    ar: 'اقتصاد' },
  { href: '/category/gulf',      en: 'Gulf',       ar: 'خليج' },
  { href: '/category/politics',  en: 'Politics',   ar: 'سياسة' },
  { href: '/category/africa',    en: 'Africa',     ar: 'أفريقيا' },
  { href: '/analysis',           en: 'Analysis',   ar: 'تحليلات' },
];

export default function Header() {
  const { lang, setLang } = useLang();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAr = lang === 'ar';

  const dateStr = new Date().toLocaleDateString(isAr ? 'ar-QA' : 'en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      {/* Top bar */}
      <div className="bg-maroon-800 text-white text-xs py-1 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span>{dateStr}</span>
          <span className="font-semibold tracking-wide">
            {isAr ? 'قطر ستاندرد | Qatar Standard' : 'Qatar Standard | قطر ستاندرد'}
          </span>
        </div>
      </div>

      {/* Logo + Nav */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/qatar-standard-logo.png"
              alt="Qatar Standard"
              width={180}
              height={68}
              className="h-14 w-auto object-contain"
              priority
            />
          </Link>

          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <button
              onClick={() => setLang(isAr ? 'en' : 'ar')}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-maroon-800 text-maroon-800 rounded text-xs font-bold hover:bg-maroon-800 hover:text-white transition-colors"
              title={isAr ? 'Switch to English' : 'التبديل إلى العربية'}
            >
              {isAr ? 'EN' : 'عربي'}
            </button>

            {/* Desktop nav */}
            <nav className="hidden md:flex gap-1">
              {NAV.map(n => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-maroon-800 hover:bg-maroon-50 rounded transition-colors"
                >
                  {isAr ? n.ar : n.en}
                </Link>
              ))}
            </nav>

            {/* Mobile burger */}
            <button
              className="md:hidden p-2 rounded text-gray-600"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="md:hidden border-t border-gray-100 py-2">
            {NAV.map(n => (
              <Link
                key={n.href}
                href={n.href}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-maroon-50 hover:text-maroon-800"
                onClick={() => setMobileOpen(false)}
              >
                {isAr ? n.ar : n.en}
              </Link>
            ))}
          </nav>
        )}
      </div>

      {/* Category strip */}
      <div className="border-t border-maroon-800 bg-maroon-800">
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-0 text-xs text-white/90 whitespace-nowrap">
            {NAV.slice(1).map(n => (
              <Link
                key={n.href}
                href={n.href}
                className="px-4 py-1.5 hover:bg-maroon-700 hover:text-white transition-colors font-medium"
              >
                {isAr ? n.ar : n.en}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
