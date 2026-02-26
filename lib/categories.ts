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
