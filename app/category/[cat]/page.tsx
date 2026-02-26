import { getArticles, countArticles, CATEGORIES } from '@/lib/articles';
import CategoryPage from '@/components/CategoryPage';
import { notFound } from 'next/navigation';

export const revalidate = 120;

export default function Page({
  params,
  searchParams,
}: {
  params: { cat: string };
  searchParams: { page?: string };
}) {
  if (!CATEGORIES[params.cat]) notFound();

  const page     = Math.max(1, parseInt(searchParams.page || '1'));
  const limit    = 12;
  const offset   = (page - 1) * limit;
  const total    = countArticles(params.cat);
  const pages    = Math.ceil(total / limit);
  const articles = getArticles({ limit, offset, category: params.cat });

  return (
    <CategoryPage
      cat={params.cat}
      articles={articles}
      total={total}
      page={page}
      pages={pages}
    />
  );
}
