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
  palestine:  '/curated/gaza_conflict.jpg',
  gulf:       '/curated/doha_skyline.jpg',
  diplomacy:  '/curated/un_diplomacy.jpg',
  economy:    '/curated/economy_finance.jpg',
  politics:   '/curated/emir_tamim.jpg',
  africa:     '/curated/african_union.jpg',
  turkey:     '/curated/turkey.jpg',
  media:      '/curated/aljazeera_hq.jpg',
  general:    '/curated/doha_skyline.jpg',
};

export function getDefaultImage(category: string, source: string): string {
  return CATEGORY_IMAGES[category] || (source === 'bot' ? '/qatar-breaking-news.png' : '/qatar-standard-logo.png');
}
