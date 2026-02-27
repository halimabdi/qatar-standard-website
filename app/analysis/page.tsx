import { getGhostPosts } from '@/lib/ghost';
import AnalysisPage from '@/components/AnalysisPage';
import type { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Analysis | Qatar Standard',
  description: 'In-depth analysis of Qatar diplomacy, Gulf geopolitics, and Middle East affairs.',
  openGraph: {
    title: 'Analysis | Qatar Standard',
    description: 'In-depth analysis of Qatar diplomacy, Gulf geopolitics, and Middle East affairs.',
    siteName: 'Qatar Standard',
    type: 'website',
  },
};

export default async function Page() {
  const posts = await getGhostPosts(20);
  return <AnalysisPage posts={posts} />;
}
