'use client';
import Link from 'next/link';
import { useState } from 'react';

const NAV = [
  { href: '/',               label: 'الرئيسية',  en: 'Home' },
  { href: '/category/diplomacy',  label: 'دبلوماسية', en: 'Diplomacy' },
  { href: '/category/palestine',  label: 'فلسطين',    en: 'Palestine' },
  { href: '/category/economy',    label: 'اقتصاد',    en: 'Economy' },
  { href: '/category/gulf',       label: 'خليج',      en: 'Gulf' },
  { href: '/category/politics',   label: 'سياسة',     en: 'Politics' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const now = new Date().toLocaleDateString('ar-QA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      {/* Top bar */}
      <div className="bg-maroon-800 text-white text-xs py-1 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center" dir="rtl">
          <span>{now}</span>
          <span className="font-semibold tracking-wide">قطر ستاندرد | Qatar Standard</span>
        </div>
      </div>

      {/* Logo + Nav */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between py-3" dir="rtl">
          <Link href="/" className="flex flex-col leading-none">
            <span className="text-3xl font-black text-maroon-800 tracking-tight" style={{ fontFamily: 'serif' }}>
              قطر ستاندرد
            </span>
            <span className="text-xs text-gray-500 tracking-widest uppercase">Qatar Standard</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-1">
            {NAV.map(n => (
              <Link
                key={n.href}
                href={n.href}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-maroon-800 hover:bg-maroon-50 rounded transition-colors"
              >
                {n.label}
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

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="md:hidden border-t border-gray-100 py-2" dir="rtl">
            {NAV.map(n => (
              <Link
                key={n.href}
                href={n.href}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-maroon-50 hover:text-maroon-800"
                onClick={() => setMobileOpen(false)}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        )}
      </div>

      {/* Category strip */}
      <div className="border-t border-maroon-800 bg-maroon-800">
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto scrollbar-hide" dir="rtl">
          <div className="flex gap-0 text-xs text-white/90 whitespace-nowrap">
            {NAV.slice(1).map(n => (
              <Link
                key={n.href}
                href={n.href}
                className="px-4 py-1.5 hover:bg-maroon-700 hover:text-white transition-colors font-medium"
              >
                {n.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
