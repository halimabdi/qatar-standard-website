import { getArticles } from '@/lib/articles';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://qatar-standard.com';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const articles = getArticles({ limit: 20 });

  const items = articles.map(article => {
    const title  = escapeXml(article.title_en || article.title_ar || '');
    const desc   = escapeXml(article.excerpt_en || article.excerpt_ar || '');
    const link   = `${SITE_URL}/article/${article.slug}`;
    const pubDate = new Date(article.published_at).toUTCString();
    const imageUrl = article.image_url
      ? (article.image_url.startsWith('/') ? `${SITE_URL}${article.image_url}` : article.image_url)
      : null;

    const mediaTag = imageUrl
      ? `<media:content url="${escapeXml(imageUrl)}" medium="image" />`
      : '';

    return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${desc}</description>
      <pubDate>${pubDate}</pubDate>
      ${mediaTag}
    </item>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Qatar Standard | قطر ستاندرد</title>
    <link>${SITE_URL}</link>
    <description>Qatar news, Gulf diplomacy, and Middle East analysis — in Arabic and English</description>
    <language>en-us</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE_URL}/qatar-standard-logo.png</url>
      <title>Qatar Standard</title>
      <link>${SITE_URL}</link>
    </image>
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800',
    },
  });
}
