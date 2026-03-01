import { getArticleBySlug, getArticles, CATEGORIES, incrementViewCount, getMostRead } from '@/lib/articles';
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
  const imageUrl    = image.startsWith('/') ? `${SITE_URL}${image}` : image;
  const url         = `${SITE_URL}/article/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: { en: url, ar: url, 'x-default': url },
    },
    openGraph: {
      title,
      description,
      url,
      type:             'article',
      publishedTime:    article.published_at,
      siteName:         'Qatar Standard',
      locale:           'en_US',
      alternateLocale:  'ar_QA',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title || 'Qatar Standard' }],
    },
    twitter: {
      card:        'summary_large_image',
      site:        '@QatarStandard',
      title,
      description,
      images:      [imageUrl],
    },
    other: {
      'article:published_time': article.published_at,
      'article:section':        CATEGORIES[article.category] || article.category,
      ...(article.speaker_name ? { 'article:author': article.speaker_name } : {}),
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  incrementViewCount(slug);

  const mostRead = getMostRead(5);
  const related = getArticles({ limit: 4, category: article.category })
    .filter(a => a.slug !== article.slug)
    .slice(0, 3);

  const imageUrl = article.image_url
    ? (article.image_url.startsWith('/') ? `${SITE_URL}${article.image_url}` : article.image_url)
    : `${SITE_URL}/qatar-standard-logo.png`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: (article.title_en || article.title_ar || '').trim(),
    description: article.excerpt_en || article.excerpt_ar || '',
    image: [imageUrl],
    datePublished: article.published_at,
    dateModified: article.published_at,
    author: article.speaker_name
      ? { '@type': 'Person', name: article.speaker_name, jobTitle: article.speaker_title || undefined }
      : { '@type': 'Organization', name: 'Qatar Standard', url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'Qatar Standard',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/qatar-standard-logo.png`, width: 500, height: 500 },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/article/${article.slug}` },
    inLanguage: article.title_en ? ['ar', 'en'] : ['ar'],
    url: `${SITE_URL}/article/${article.slug}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ArticleDetail article={article} related={related} mostRead={mostRead} />
    </>
  );
}
