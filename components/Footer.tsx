'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useLang } from '@/contexts/LanguageContext';

export default function Footer() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const year = new Date().getFullYear();

  const categories = isAr
    ? [
        ['/', 'الرئيسية'],
        ['/category/diplomacy', 'دبلوماسية'],
        ['/category/palestine', 'فلسطين'],
        ['/category/economy', 'اقتصاد'],
        ['/category/gulf', 'خليج'],
        ['/category/politics', 'سياسة'],
        ['/category/africa', 'أفريقيا'],
        ['/analysis', 'تحليلات'],
      ]
    : [
        ['/', 'Home'],
        ['/category/diplomacy', 'Diplomacy'],
        ['/category/palestine', 'Palestine'],
        ['/category/economy', 'Economy'],
        ['/category/gulf', 'Gulf'],
        ['/category/politics', 'Politics'],
        ['/category/africa', 'Africa'],
        ['/analysis', 'Analysis'],
      ];

  return (
    <footer className="bg-maroon-900 text-white mt-12">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8" dir={isAr ? 'rtl' : 'ltr'}>
          {/* Brand */}
          <div>
            <Image
              src="/qatar-standard-logo.png"
              alt="Qatar Standard"
              width={140}
              height={52}
              className="h-12 w-auto object-contain brightness-0 invert mb-3"
            />
            <p className="text-sm text-white/60 leading-relaxed">
              {isAr
                ? 'موقع إخباري متخصص في الشأن القطري والخليجي والدبلوماسية الإقليمية.'
                : 'Qatar news, Gulf diplomacy, and Middle East analysis — in Arabic and English.'}
            </p>
            <p className="text-xs text-white/40 mt-2">newsdesk@qatar-standard.com</p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-3">
              {isAr ? 'الأقسام' : 'Sections'}
            </h3>
            <ul className="space-y-1.5 text-sm text-white/75">
              {categories.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-3">
              {isAr ? 'تواصل معنا' : 'Follow Us'}
            </h3>
            <a
              href="https://twitter.com/QatarStandard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-white/75 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              @QatarStandard
            </a>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-4 text-xs text-white/40 text-center flex items-center justify-center gap-4">
          <span>© {year} Qatar Standard</span>
          <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy Policy</Link>
          <span>{isAr ? 'جميع الحقوق محفوظة' : 'All rights reserved'}</span>
        </div>
      </div>
    </footer>
  );
}
