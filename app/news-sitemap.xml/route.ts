import { getArticles } from '@/lib/articles';
import { NextResponse } from 'next/server';

export const revalidate = 300; // 5 minutes — news needs fast refresh

const SITE_URL = 'https://qatar-standard.com';

function escapeXml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function GET() {
  // Google News sitemap: only articles from past 48 hours
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const articles = getArticles({ limit: 1000 })
    .filter(a => new Date(a.published_at) > cutoff);

  const items = articles.map(a => {
    const title = escapeXml(a.title_en || a.title_ar || '');
    const lang = a.title_en ? 'en' : 'ar';
    const pubDate = new Date(a.published_at).toISOString();
    return `  <url>
    <loc>${SITE_URL}/article/${a.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>Qatar Standard</news:name>
        <news:language>${lang}</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${title}</news:title>
    </news:news>
  </url>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
    },
  });
}
