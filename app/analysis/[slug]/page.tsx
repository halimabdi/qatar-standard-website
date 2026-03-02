import { getGhostPostBySlug, getGhostPosts } from '@/lib/ghost';
import AnalysisDetail from '@/components/AnalysisDetail';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const revalidate = 60;

const SITE_URL = 'https://qatar-standard.com';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const post = await getGhostPostBySlug(slug);
  if (!post) return {};

  const description = post.custom_excerpt || post.excerpt || '';
  const image = post.feature_image || '/qatar-standard-logo.png';
  const imageUrl = image.startsWith('/') ? `${SITE_URL}${image}` : image;
  const url = `${SITE_URL}/analysis/${slug}`;

  return {
    title: post.title,
    description,
    alternates: {
      canonical: url,
      languages: { en: url, 'x-default': url },
    },
    openGraph: {
      title: post.title,
      description,
      url,
      type:             'article',
      publishedTime:    post.published_at,
      siteName:         'Qatar Standard',
      locale:           'en_US',
      alternateLocale:  'ar_QA',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@QatarStandard',
      title: post.title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, related] = await Promise.all([
    getGhostPostBySlug(slug),
    getGhostPosts(4),
  ]);
  if (!post) notFound();

  const relatedPosts = related.filter(p => p.slug !== slug).slice(0, 3);

  const imageUrl = post.feature_image
    ? (post.feature_image.startsWith('/') ? `${SITE_URL}${post.feature_image}` : post.feature_image)
    : `${SITE_URL}/qatar-standard-logo.png`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    '@id': `${SITE_URL}/analysis/${slug}#article`,
    headline: post.title,
    description: post.custom_excerpt || post.excerpt || '',
    image: [imageUrl],
    thumbnailUrl: imageUrl,
    datePublished: post.published_at,
    dateModified: post.published_at,
    author: { '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: 'Qatar Standard' },
    publisher: {
      '@type': 'NewsMediaOrganization',
      '@id': `${SITE_URL}/#organization`,
      name: 'Qatar Standard',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/qatar-standard-logo.png`, width: 500, height: 500 },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/analysis/${slug}` },
    url: `${SITE_URL}/analysis/${slug}`,
    isAccessibleForFree: true,
    inLanguage: 'en',
    articleSection: post.primary_tag?.name || 'Analysis',
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Analysis & Editorials', item: `${SITE_URL}/analysis` },
      { '@type': 'ListItem', position: 3, name: post.title, item: `${SITE_URL}/analysis/${slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd).replace(/</g, '\\u003c') }} />
      <AnalysisDetail post={post} related={relatedPosts} />
    </>
  );
}
