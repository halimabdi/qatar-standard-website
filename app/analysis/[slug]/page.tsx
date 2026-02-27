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
  const url = `${SITE_URL}/analysis/${slug}`;

  return {
    title: post.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description,
      url,
      type: 'article',
      publishedTime: post.published_at,
      siteName: 'Qatar Standard',
      images: [{ url: image.startsWith('/') ? `${SITE_URL}${image}` : image, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@QatarStandard',
      title: post.title,
      description,
      images: [image.startsWith('/') ? `${SITE_URL}${image}` : image],
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
  return <AnalysisDetail post={post} related={relatedPosts} />;
}
