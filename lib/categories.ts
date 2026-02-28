// Standalone categories — no DB dependency, safe to import in client components

export const CATEGORIES_AR: Record<string, string> = {
  general:   'عام',
  diplomacy: 'دبلوماسية',
  palestine: 'فلسطين',
  economy:   'اقتصاد',
  politics:  'سياسة',
  gulf:      'خليج',
  iran:      'إيران',
  media:     'إعلام',
  turkey:    'تركيا',
  africa:    'أفريقيا',
};

export const CATEGORIES_EN: Record<string, string> = {
  general:   'General',
  diplomacy: 'Diplomacy',
  palestine: 'Palestine',
  economy:   'Economy',
  politics:  'Politics',
  gulf:      'Gulf',
  iran:      'Iran',
  media:     'Media',
  turkey:    'Turkey',
  africa:    'Africa',
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES_EN);

// Multiple curated images per category — used in rotation to avoid repeats
export const CATEGORY_IMAGES: Record<string, string[]> = {
  palestine:  [
    '/curated/gaza_conflict.jpg',
    '/curated/palestine_crowd.jpg',
    '/curated/palestine_protest.jpg',
    '/curated/solidarity_protest.jpg',
  ],
  gulf: [
    '/curated/doha_skyline.jpg',
    '/curated/doha_night.jpg',
    '/curated/gcc_meeting.jpg',
    '/curated/lusail_stadium.jpg',
    '/curated/abu_dhabi.jpg',
    '/curated/ras_laffan.jpg',
  ],
  diplomacy: [
    '/curated/un_diplomacy.jpg',
    '/curated/un_general_assembly.jpg',
    '/curated/diplomacy_summit.jpg',
    '/curated/qncc_doha_forum.jpg',
    '/curated/gcc_meeting.jpg',
  ],
  economy: [
    '/curated/economy_finance.jpg',
    '/curated/qatar_energy.jpg',
    '/curated/lng_tanker.jpg',
    '/curated/ras_laffan.jpg',
    '/curated/qatar_airways.jpg',
    '/curated/stock_market.jpg',
  ],
  iran: [
    '/curated/parliament.jpg',
    '/curated/diplomacy_summit.jpg',
    '/curated/un_diplomacy.jpg',
  ],
  politics: [
    '/curated/emir_tamim.jpg',
    '/curated/qncc_doha_forum.jpg',
    '/curated/parliament.jpg',
    '/curated/diplomacy_summit.jpg',
    '/curated/doha_skyline.jpg',
  ],
  africa: [
    '/curated/african_union.jpg',
    '/curated/africa_city.jpg',
  ],
  turkey: [
    '/curated/turkey.jpg',
    '/curated/istanbul.jpg',
  ],
  media: [
    '/curated/aljazeera_hq.jpg',
    '/curated/press_conference.jpg',
  ],
  general: [
    '/curated/doha_skyline.jpg',
    '/curated/doha_night.jpg',
    '/curated/lusail_stadium.jpg',
    '/curated/qatar_airways.jpg',
    '/curated/qncc_doha_forum.jpg',
  ],
};

/**
 * Pick a curated image from the category pool.
 * Uses article ID as a stable seed so the same article always gets the same fallback.
 * Caller should prefer DB-aware selection in server context (see route.ts).
 */
export function getDefaultImage(category: string, source: string, seed?: number): string {
  const pool = CATEGORY_IMAGES[category];
  if (pool && pool.length > 0) {
    const idx = seed !== undefined
      ? Math.abs(seed) % pool.length
      : Math.floor(Math.random() * pool.length);
    return pool[idx];
  }
  return source === 'bot' ? '/qatar-breaking-news.png' : '/qatar-standard-logo.png';
}
