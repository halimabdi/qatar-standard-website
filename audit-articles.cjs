const db = require('better-sqlite3')('/root/qatar-standard-website/data/articles.db');
const all = db.prepare('SELECT id,slug,title_en,body_en,body_ar,image_url,source,category FROM articles ORDER BY id').all();

console.log('=== ARTICLE AUDIT ===');
let issues = 0;

for (const a of all) {
  const problems = [];
  const enLen = (a.body_en || '').trim().split(/\s+/).length;
  const arLen = (a.body_ar || '').trim().split(/\s+/).length;

  if (!a.body_en || enLen < 50) problems.push(`EN body too short (${enLen} words)`);
  if (!a.body_ar || arLen < 20) problems.push(`AR body missing/short (${arLen} words)`);
  if (!a.image_url) problems.push('no image');
  if ((a.image_url || '').includes('/curated/')) problems.push('curated image');
  if ((a.body_en || '').includes('**')) problems.push('** markdown in EN');
  if ((a.body_en || '').match(/^Introduction\b/m)) problems.push('has Introduction header');
  if ((a.body_en || '') === (a.title_en || '') || enLen < 30) problems.push('body = title (not generated)');
  if ((a.body_en || '').toLowerCase().includes('i cannot') || (a.body_en || '').toLowerCase().includes("i'm sorry")) problems.push('LLM refusal in body');

  const status = problems.length ? '⚠' : '✓';
  if (problems.length) {
    console.log(`${status} [${a.id}] ${a.title_en?.slice(0,55)} | ${a.source}`);
    problems.forEach(p => console.log(`    - ${p}`));
    issues++;
  } else {
    console.log(`${status} [${a.id}] ${a.title_en?.slice(0,55)}`);
  }
}

console.log(`\n=== ${issues} articles with issues / ${all.length} total ===`);
db.close();
