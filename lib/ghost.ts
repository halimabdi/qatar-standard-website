/**
 * Ghost CMS — Content API client (server-only)
 * Fetches editorial/long-form posts from cms.qatar-standard.com
 */

const GHOST_URL = process.env.GHOST_URL || '';
const GHOST_KEY = process.env.GHOST_CONTENT_KEY || '';

export interface GhostTag {
  id: string;
  name: string;
  slug: string;
}

export interface GhostPost {
  id: string;
  slug: string;
  title: string;
  html: string;
  excerpt: string | null;
  custom_excerpt: string | null;
  feature_image: string | null;
  published_at: string;
  reading_time: number;
  tags: GhostTag[];
  primary_tag: GhostTag | null;
}

async function ghostFetch(endpoint: string, params: Record<string, string> = {}): Promise<unknown> {
  if (!GHOST_URL || !GHOST_KEY) return null;
  const url = new URL(`${GHOST_URL}/ghost/api/content/${endpoint}/`);
  url.searchParams.set('key', GHOST_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 60 },
      headers: { 'Accept-Version': 'v5.0' },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getGhostPosts(limit = 10, tag?: string): Promise<GhostPost[]> {
  const params: Record<string, string> = {
    limit: String(limit),
    include: 'tags',
    fields: 'id,slug,title,excerpt,custom_excerpt,feature_image,published_at,reading_time',
  };
  if (tag) params.filter = `tag:${tag}`;
  const data = await ghostFetch('posts', params) as { posts?: GhostPost[] } | null;
  return data?.posts || [];
}

export async function getGhostPostBySlug(slug: string): Promise<GhostPost | null> {
  const data = await ghostFetch(`posts/slug/${slug}`, { include: 'tags' }) as { posts?: GhostPost[] } | null;
  return data?.posts?.[0] || null;
}
