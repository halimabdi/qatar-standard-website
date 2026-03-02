import { getArticles, countArticles, CATEGORIES } from '@/lib/articles';
import type { Metadata } from 'next';

const SITE_URL = 'https://qatar-standard.com';

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  palestine: 'Latest news on Palestine, Gaza, and the Israeli-Palestinian conflict from a Gulf perspective.',
  diplomacy: 'Qatar diplomacy, Gulf foreign policy, and Middle East international relations.',
  gulf: 'Gulf Cooperation Council news — Saudi Arabia, UAE, Qatar, Bahrain, Kuwait, and Oman.',
  economy: 'Qatar economy, LNG exports, Gulf financial markets, and economic development.',
  politics: 'Political analysis and news from Qatar and the broader Arab world.',
  africa: 'African politics and Qatar\'s engagement with the African continent.',
  media: 'Media freedom, journalism, and press coverage of the Arab world.',
};

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ cat: string }>;
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { cat } = await params;
  const sp = await searchParams;
  const page = sp.page || '1';
  const pageNum = parseInt(page);
  const categoryName = CATEGORIES[cat] || cat;
  const description = CATEGORY_DESCRIPTIONS[cat] || `Latest ${categoryName} news and analysis from Qatar Standard.`;
  const canonical = pageNum === 1
    ? `${SITE_URL}/category/${cat}`
    : `${SITE_URL}/category/${cat}?page=${page}`;

  return {
    title: pageNum === 1
      ? `${categoryName} News | Qatar Standard`
      : `${categoryName} News — Page ${pageNum} | Qatar Standard`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${categoryName} News | Qatar Standard`,
      description,
      url: canonical,
      type: 'website',
      siteName: 'Qatar Standard',
      locale: 'en_US',
      alternateLocale: 'ar_QA',
      images: [{ url: `${SITE_URL}/qatar-standard-logo.png`, width: 500, height: 500, alt: `Qatar Standard — ${categoryName}` }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@QatarStandard',
      title: `${categoryName} News | Qatar Standard`,
      description,
    },
    ...(pageNum > 3 ? { robots: { index: false, follow: true } } : {}),
  };
}
import CategoryPage from '@/components/CategoryPage';
import { notFound } from 'next/navigation';

export const revalidate = 30;

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ cat: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { cat } = await params;
  const sp = await searchParams;
  if (!CATEGORIES[cat]) notFound();

  const page     = Math.max(1, parseInt(sp.page || '1'));
  const limit    = 12;
  const offset   = (page - 1) * limit;
  const total    = countArticles(cat);
  const pages    = Math.ceil(total / limit);
  const articles = getArticles({ limit, offset, category: cat });

  return (
    <CategoryPage
      cat={cat}
      articles={articles}
      total={total}
      page={page}
      pages={pages}
    />
  );
}
