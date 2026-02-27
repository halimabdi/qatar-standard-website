import { getArticleBySlug, getArticles, CATEGORIES } from '@/lib/articles';
import ArticleDetail from '@/components/ArticleDetail';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://qatar-standard.com';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};

  const title       = article.title_en || article.title_ar;
  const description = article.excerpt_en || article.excerpt_ar || '';
  const image       = article.image_url || '/qatar-standard-logo.png';
  const url         = `${SITE_URL}/article/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type:          'article',
      publishedTime: article.published_at,
      siteName:      'Qatar Standard',
      images: [{ url: image.startsWith('/') ? `${SITE_URL}${image}` : image, width: 1200, height: 630 }],
    },
    twitter: {
      card:        'summary_large_image',
      site:        '@QatarStandard',
      title,
      description,
      images:      [image.startsWith('/') ? `${SITE_URL}${image}` : image],
    },
    other: {
      'article:published_time': article.published_at,
      'article:section':        CATEGORIES[article.category] || article.category,
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const related = getArticles({ limit: 4, category: article.category })
    .filter(a => a.slug !== article.slug)
    .slice(0, 3);

  return <ArticleDetail article={article} related={related} />;
}
