import { getArticleBySlug, getArticles, CATEGORIES } from '@/lib/articles';
import ArticleDetail from '@/components/ArticleDetail';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const related = getArticles({ limit: 4, category: article.category })
    .filter(a => a.slug !== article.slug)
    .slice(0, 3);

  return <ArticleDetail article={article} related={related} />;
}
