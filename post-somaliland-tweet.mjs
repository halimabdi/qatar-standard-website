import { playwrightPostTweet } from './playwright-poster.js';

const ARTICLE_URL = 'https://qatar-standard.com/article/israel-and-somaliland-the-red-sea-gambit-cvfj';
const tweetText = 'Israel\'s recognition of Somaliland is not humanitarian. It\'s a calculated Red Sea strategy — securing a military foothold near Bab al-Mandab, the chokepoint controlling 30% of global container traffic.';

console.log('[TWEET] Posting corrected Somaliland article tweet...');
const ok = await playwrightPostTweet(tweetText + '\n\n' + ARTICLE_URL, null);
console.log('[TWEET]', ok ? 'Posted OK' : 'Failed');
process.exit(ok ? 0 : 1);
