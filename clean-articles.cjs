const db = require('better-sqlite3')('/root/qatar-standard-website/data/articles.db');
const all = db.prepare('SELECT id,body_en,body_ar,title_en,title_ar,excerpt_en,excerpt_ar FROM articles').all();

function clean(s) {
  if (!s) return s;
  return s
    .replace(/\*\*/g, '')
    .replace(/^#+\s*/gm, '')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^(Introduction|Conclusion|Background|Context|Overview|Summary)[:\s]*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

let updated = 0;
for (const a of all) {
  const ne = clean(a.body_en);
  const na = clean(a.body_ar);
  const nte = clean(a.title_en);
  const nta = clean(a.title_ar);
  const nexe = clean(a.excerpt_en);
  const nexa = clean(a.excerpt_ar);
  if (ne !== a.body_en || na !== a.body_ar || nte !== a.title_en) {
    db.prepare('UPDATE articles SET body_en=?,body_ar=?,title_en=?,title_ar=?,excerpt_en=?,excerpt_ar=? WHERE id=?')
      .run(ne, na, nte, nta, nexe, nexa, a.id);
    updated++;
    console.log('Cleaned:', a.id, nte && nte.slice(0, 50));
  }
}
console.log('Updated:', updated, 'articles');
db.close();
