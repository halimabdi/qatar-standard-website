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
      languages: { en: url, ar: url, 'x-default': url },
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
    headline: post.title,
    description: post.custom_excerpt || post.excerpt || '',
    image: [imageUrl],
    datePublished: post.published_at,
    dateModified: post.published_at,
    author: { '@type': 'Organization', name: 'Qatar Standard', url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'Qatar Standard',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/qatar-standard-logo.png`, width: 500, height: 500 },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/analysis/${slug}` },
    url: `${SITE_URL}/analysis/${slug}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <AnalysisDetail post={post} related={relatedPosts} />
    </>
  );
}
