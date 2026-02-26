// Standalone categories — no DB dependency, safe to import in client components

export const CATEGORIES_AR: Record<string, string> = {
  general:   'عام',
  diplomacy: 'دبلوماسية',
  palestine: 'فلسطين',
  economy:   'اقتصاد',
  politics:  'سياسة',
  gulf:      'خليج',
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
  media:     'Media',
  turkey:    'Turkey',
  africa:    'Africa',
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES_EN);

// Category-specific default images — client-safe (no Node.js imports)
export const CATEGORY_IMAGES: Record<string, string> = {
  palestine:  '/curated/palestine_protest.jpg',
  gulf:       '/curated/doha_skyline.jpg',
  diplomacy:  '/curated/qncc_doha_forum.jpg',
  economy:    '/curated/qatar_airways.jpg',
  politics:   '/curated/emir_tamim.jpg',
  africa:     '/curated/doha_skyline.jpg',
  turkey:     '/curated/doha_skyline.jpg',
  media:      '/curated/aljazeera_hq.jpg',
  general:    '/qatar-breaking-news.png',
};

export function getDefaultImage(category: string, source: string): string {
  return CATEGORY_IMAGES[category] || (source === 'bot' ? '/qatar-breaking-news.png' : '/qatar-standard-logo.png');
}
