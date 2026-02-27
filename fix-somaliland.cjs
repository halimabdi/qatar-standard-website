const db = require('better-sqlite3')('/root/qatar-standard-website/data/articles.db');
const a = db.prepare('SELECT id, body_en FROM articles WHERE id=28').get();

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;

async function translate(text) {
  if (OPENAI_KEY) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o',
          temperature: 0.3,
          messages: [
            { role: 'system', content: 'أنت مترجم صحفي محترف. ترجم المقال التالي إلى العربية الفصحى السلسة كما يكتبها صحفي محترف. فقرات فقط بدون عناوين أو تنسيق. لا تذكر أنك ذكاء اصطناعي.' },
            { role: 'user', content: text }
          ]
        }),
        signal: AbortSignal.timeout(60000)
      });
      const data = await res.json();
      if (res.ok) return data.choices[0]?.message?.content?.trim();
    } catch (e) { console.log('OpenAI failed:', e.message); }
  }
  if (GROQ_KEY) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 2048,
        messages: [
          { role: 'system', content: 'أنت مترجم صحفي محترف. ترجم المقال التالي إلى العربية الفصحى السلسة. فقرات فقط بدون عناوين أو تنسيق.' },
          { role: 'user', content: text }
        ]
      }),
      signal: AbortSignal.timeout(60000)
    });
    const data = await res.json();
    if (res.ok) return data.choices[0]?.message?.content?.trim();
  }
  return null;
}

(async () => {
  console.log('Translating Somaliland article to Arabic...');
  const body_ar = await translate(a.body_en);
  if (body_ar) {
    const excerpt_ar = body_ar.split(/[.!؟]/)[0]?.trim().slice(0, 300) || '';
    db.prepare('UPDATE articles SET body_ar=?, excerpt_ar=? WHERE id=28').run(body_ar, excerpt_ar);
    console.log('Updated body_ar, length:', body_ar.length);
    console.log('Preview:', body_ar.slice(0, 150));
  } else {
    console.log('Translation failed');
  }
  db.close();
})();
