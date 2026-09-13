import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { DifficultyBadge, Spinner, ErrorBanner } from '../components/ui';

export default function Problems() {
  const [problems, setProblems] = useState([]);
  const [tags, setTags] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [difficulty, setDifficulty] = useState('');
  const [tag, setTag] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => { api.tags().then(setTags).catch(() => {}); }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.listProblems({ difficulty, tag, q })
      .then((d) => { if (active) { setProblems(d.problems); setTotal(d.total); setError(null); } })
      .catch((e) => active && setError(e))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [difficulty, tag, q]);

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      <h1>Problems</h1>
      <p className="muted" style={{ marginTop: -8 }}>
        Practice classic interview problems in Python. Run and submit against test cases in the sandbox.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '20px 0' }}>
        <input className="input" placeholder="Search title…" value={q}
               onChange={(e) => setQ(e.target.value)} style={{ minWidth: 220 }} />
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="">All difficulties</option>
          <option>Easy</option><option>Medium</option><option>Hard</option>
        </select>
        <select value={tag} onChange={(e) => setTag(e.target.value)}>
          <option value="">All tags</option>
          {tags.map((t) => <option key={t}>{t}</option>)}
        </select>
        {(difficulty || tag || q) && (
          <button className="btn btn-ghost" onClick={() => { setDifficulty(''); setTag(''); setQ(''); }}>Clear</button>
        )}
      </div>

      <ErrorBanner error={error} />
      {loading ? <Spinner /> : (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--hairline)', textAlign: 'left' }}>
                <th style={th}>#</th><th style={th}>Title</th><th style={th}>Difficulty</th><th style={th}>Tags</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((p) => (
                <tr key={p.slug} style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <td style={td} className="tertiary mono">{p.id}</td>
                  <td style={td}><Link to={`/problems/${p.slug}`} style={{ fontWeight: 500 }}>{p.title}</Link></td>
                  <td style={td}><DifficultyBadge level={p.difficulty} /></td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {p.tags.slice(0, 3).map((t) => <span key={t} className="pill">{t}</span>)}
                    </div>
                  </td>
                </tr>
              ))}
              {problems.length === 0 && (
                <tr><td style={td} colSpan={4}><span className="muted">No problems match these filters.</span></td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <p className="tertiary" style={{ fontSize: 12, marginTop: 12 }}>
        Showing {problems.length} of {total} problems.
      </p>
    </div>
  );
}

const th = { padding: '12px 16px', fontSize: 12, color: 'var(--ink-subtle)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.4 };
const td = { padding: '12px 16px', verticalAlign: 'middle' };
