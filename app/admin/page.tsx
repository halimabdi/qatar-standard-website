'use client';
import { useState, useEffect, useCallback } from 'react';

interface Article {
  id: number;
  slug: string;
  title_en: string | null;
  title_ar: string | null;
  source: string;
  published_at: string;
}

export default function AdminPage() {
  const [authed, setAuthed]     = useState(false);
  const [password, setPassword] = useState('');
  const [authErr, setAuthErr]   = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal]       = useState(0);
  const [offset, setOffset]     = useState(0);
  const [q, setQ]               = useState('');
  const [loading, setLoading]   = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [msg, setMsg]           = useState('');
  const LIMIT = 50;

  const load = useCallback(async (off: number, query: string) => {
    setLoading(true);
    const res = await fetch(`/api/admin/articles?offset=${off}&limit=${LIMIT}&q=${encodeURIComponent(query)}`);
    if (res.status === 401) { setAuthed(false); setLoading(false); return; }
    const data = await res.json();
    setArticles(data.articles || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, []);

  useEffect(() => { if (authed) load(offset, q); }, [authed, load]); // eslint-disable-line

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setAuthErr('');
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) { setAuthed(true); }
    else { setAuthErr('Wrong password'); }
  }

  async function deleteArticle(slug: string, title: string) {
    if (!confirm(`Delete:\n"${title}"?\n\nThis cannot be undone.`)) return;
    setDeleting(slug);
    const res = await fetch('/api/admin/articles', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    });
    setDeleting(null);
    if (res.ok) {
      setMsg(`Deleted: ${title}`);
      setArticles(prev => prev.filter(a => a.slug !== slug));
      setTotal(prev => prev - 1);
      setTimeout(() => setMsg(''), 4000);
    } else {
      setMsg('Delete failed');
    }
  }

  function search(e: React.FormEvent) {
    e.preventDefault();
    setOffset(0);
    load(0, q);
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <form onSubmit={login} className="bg-white p-8 rounded-xl shadow-md w-80">
          <h1 className="text-xl font-bold text-gray-800 mb-6">Admin Login</h1>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 mb-3 text-sm focus:outline-none focus:border-red-800"
            autoFocus
          />
          {authErr && <p className="text-red-600 text-xs mb-3">{authErr}</p>}
          <button type="submit" className="w-full bg-red-900 text-white py-2 rounded text-sm font-semibold hover:bg-red-800">
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Article Manager</h1>
        <button
          onClick={async () => { await fetch('/api/admin/auth', { method: 'DELETE' }); setAuthed(false); }}
          className="text-xs text-gray-400 hover:text-gray-700"
        >
          Logout
        </button>
      </div>

      {msg && (
        <div className="mb-4 px-4 py-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded">
          {msg}
        </div>
      )}

      <form onSubmit={search} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Search title or slug..."
          value={q}
          onChange={e => setQ(e.target.value)}
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-red-800"
        />
        <button type="submit" className="bg-red-900 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-red-800">
          Search
        </button>
        {q && (
          <button type="button" onClick={() => { setQ(''); setOffset(0); load(0, ''); }}
            className="text-sm text-gray-500 hover:text-gray-800 px-2">
            Clear
          </button>
        )}
      </form>

      <p className="text-xs text-gray-400 mb-4">{total} article{total !== 1 ? 's' : ''} total</p>

      {loading ? (
        <p className="text-sm text-gray-400 py-8 text-center">Loading...</p>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-1/2">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Source</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Date</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a, i) => (
                <tr key={a.slug} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3">
                    <a
                      href={`/article/${a.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-900 hover:underline font-medium line-clamp-2"
                    >
                      {a.title_en || a.title_ar || a.slug}
                    </a>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{a.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{a.source}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(a.published_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteArticle(a.slug, a.title_en || a.title_ar || a.slug)}
                      disabled={deleting === a.slug}
                      className="text-xs text-red-600 hover:text-red-800 font-semibold disabled:opacity-40"
                    >
                      {deleting === a.slug ? '...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
              {articles.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">No articles found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {total > LIMIT && (
        <div className="flex items-center justify-between mt-4">
          <button
            disabled={offset === 0}
            onClick={() => { const o = Math.max(0, offset - LIMIT); setOffset(o); load(o, q); }}
            className="text-sm text-red-900 hover:underline disabled:text-gray-300"
          >
            ← Previous
          </button>
          <span className="text-xs text-gray-400">
            {offset + 1}–{Math.min(offset + LIMIT, total)} of {total}
          </span>
          <button
            disabled={offset + LIMIT >= total}
            onClick={() => { const o = offset + LIMIT; setOffset(o); load(o, q); }}
            className="text-sm text-red-900 hover:underline disabled:text-gray-300"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
