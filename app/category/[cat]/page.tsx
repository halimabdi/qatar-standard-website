import { getArticles, countArticles, CATEGORIES } from '@/lib/articles';
import type { Metadata } from 'next';

const SITE_URL = 'https://qatar-standard.com';

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
  const canonical = page === '1'
    ? `${SITE_URL}/category/${cat}`
    : `${SITE_URL}/category/${cat}?page=${page}`;
  return {
    alternates: { canonical },
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
