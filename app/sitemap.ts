import { getArticles } from '@/lib/articles';
import { getGhostPosts } from '@/lib/ghost';
import type { MetadataRoute } from 'next';

const SITE_URL = 'https://qatar-standard.com';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, ghostPosts] = await Promise.all([
    Promise.resolve(getArticles({ limit: 2000 })),
    getGhostPosts(50),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL,                           lastModified: new Date(), changeFrequency: 'hourly',  priority: 1.0 },
    { url: `${SITE_URL}/analysis`,             lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${SITE_URL}/category/palestine`,   lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${SITE_URL}/category/diplomacy`,   lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${SITE_URL}/category/gulf`,        lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${SITE_URL}/category/economy`,     lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${SITE_URL}/category/politics`,    lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${SITE_URL}/category/africa`,      lastModified: new Date(), changeFrequency: 'daily',   priority: 0.7 },
    { url: `${SITE_URL}/category/media`,       lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
  ];

  const articlePages: MetadataRoute.Sitemap = articles.map(a => ({
    url:             `${SITE_URL}/article/${a.slug}`,
    lastModified:    new Date(a.published_at),
    changeFrequency: 'weekly' as const,
    priority:        0.8,
  }));

  const analysisPages: MetadataRoute.Sitemap = ghostPosts.map(p => ({
    url:             `${SITE_URL}/analysis/${p.slug}`,
    lastModified:    new Date(p.published_at),
    changeFrequency: 'weekly' as const,
    priority:        0.9,
  }));

  return [...staticPages, ...articlePages, ...analysisPages];
}
