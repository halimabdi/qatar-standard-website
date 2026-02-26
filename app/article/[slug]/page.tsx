import { getArticleBySlug, getArticles, CATEGORIES } from '@/lib/articles';
import ArticleDetail from '@/components/ArticleDetail';
import { notFound } from 'next/navigation';

export const revalidate = 300;

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = getArticleBySlug(params.slug);
  if (!article) notFound();

  const related = getArticles({ limit: 4, category: article.category })
    .filter(a => a.slug !== article.slug)
    .slice(0, 3);

  return <ArticleDetail article={article} related={related} />;
}
