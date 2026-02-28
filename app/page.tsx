import { getArticles, getLatestArticle } from '@/lib/articles';
import { getGhostPosts } from '@/lib/ghost';
import HomePage from '@/components/HomePage';

export const revalidate = 30;

export default async function Page() {
  const [hero, recent, latest5, sidebar, ghostPosts] = await Promise.all([
    Promise.resolve(getLatestArticle()),
    Promise.resolve(getArticles({ limit: 9, offset: 1 })),
    Promise.resolve(getArticles({ limit: 5, offset: 1 })),
    Promise.resolve(getArticles({ limit: 6, offset: 10 })),
    getGhostPosts(1),
  ]);

  // Only show Ghost analysis in hero if published within the last 24 hours
  const latestGhost = ghostPosts[0] || null;
  const ghostAge = latestGhost ? Date.now() - new Date(latestGhost.published_at).getTime() : Infinity;
  const featuredAnalysis = ghostAge < 24 * 60 * 60 * 1000 ? latestGhost : null;

  return <HomePage hero={hero} recent={recent} latest5={latest5} sidebar={sidebar} featuredAnalysis={featuredAnalysis} />;
}
