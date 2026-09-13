import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { api } from '../api';
import { DifficultyBadge, Spinner, ErrorBanner } from '../components/ui';
import CodeEditor from '../components/CodeEditor';

export default function ProblemDetail() {
  const { slug } = useParams();
  const [problem, setProblem] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setProblem(null); setError(null);
    api.getProblem(slug).then(setProblem).catch(setError);
  }, [slug]);

  if (error) return <div className="container" style={{ paddingTop: 32 }}><ErrorBanner error={error} /></div>;
  if (!problem) return <div className="container" style={{ paddingTop: 32 }}><Spinner label="Loading problem…" /></div>;

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 64 }}>
      <Link to="/problems" className="btn btn-ghost" style={{ marginBottom: 12 }}>← All problems</Link>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 24, alignItems: 'start' }} className="detail-grid">
        {/* Description panel */}
        <div className="card" style={{ maxHeight: '78vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0 }}>{problem.id}. {problem.title}</h2>
            <DifficultyBadge level={problem.difficulty} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '12px 0' }}>
            {problem.tags.map((t) => <span key={t} className="pill">{t}</span>)}
          </div>
          <div className="md">
            <ReactMarkdown>{problem.description}</ReactMarkdown>
          </div>

          {problem.examples?.length > 0 && (
            <section style={{ marginTop: 16 }}>
              <h3>Examples</h3>
              {problem.examples.map((ex, i) => (
                <div key={i} style={{ background: 'var(--surface-3)', borderRadius: 8, padding: 12, marginBottom: 10 }} className="mono" >
                  <div style={{ fontSize: 12 }}><span className="tertiary">Input:</span> {ex.input}</div>
                  <div style={{ fontSize: 12 }}><span className="tertiary">Output:</span> {ex.output}</div>
                  {ex.explanation && <div style={{ fontSize: 12 }}><span className="tertiary">Explanation:</span> {ex.explanation}</div>}
                </div>
              ))}
            </section>
          )}

          {problem.constraints?.length > 0 && (
            <section style={{ marginTop: 16 }}>
              <h3>Constraints</h3>
              <ul className="mono" style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                {problem.constraints.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </section>
          )}

          {problem.hints?.length > 0 && (
            <section style={{ marginTop: 16 }}>
              <h3>Hints</h3>
              {problem.hints.map((h, i) => (
                <details key={i} style={{ marginBottom: 6 }}>
                  <summary style={{ cursor: 'pointer', color: 'var(--primary)' }}>Hint {i + 1}</summary>
                  <p className="muted" style={{ margin: '6px 0 0' }}>{h}</p>
                </details>
              ))}
            </section>
          )}
        </div>

        {/* Code editor panel */}
        <div style={{ position: 'sticky', top: 16 }}>
          <CodeEditor slug={problem.slug} starterCode={problem.starter_code} />
        </div>
      </div>
    </div>
  );
}
