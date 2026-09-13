import { useEffect, useState } from 'react';
import { api } from '../api';
import { Spinner, ErrorBanner } from '../components/ui';

export default function SystemDesign() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { api.systemDesign().then(setData).catch(setError); }, []);

  if (error) return <div className="container" style={{ paddingTop: 32 }}><ErrorBanner error={error} /></div>;
  if (!data) return <div className="container" style={{ paddingTop: 32 }}><Spinner label="Loading…" /></div>;

  const diffCls = (d) => ({ Easy: 'diff-easy', Medium: 'diff-medium', Hard: 'diff-hard' }[d] || 'muted');

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      <h1>System Design</h1>
      <p className="muted" style={{ marginTop: -8 }}>
        Structure and practice prompts inspired by HelloInterview's “System Design in a Hurry”.
      </p>

      {/* Delivery framework */}
      <section style={{ marginTop: 24 }}>
        <h2>{data.delivery_framework.title}</h2>
        <p className="muted">{data.delivery_framework.note}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 12 }}>
          {data.delivery_framework.steps.map((s, i) => (
            <div key={i} className="card">
              <div className="tertiary mono" style={{ fontSize: 12 }}>Step {i + 1} · {s.duration}</div>
              <h3 style={{ margin: '6px 0 8px' }}>{s.name}</h3>
              <p className="muted" style={{ fontSize: 14, margin: 0 }}>{s.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Practice questions */}
      <section style={{ marginTop: 32 }}>
        <h2>Practice Questions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {data.questions.map((q) => (
            <div key={q.slug} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span className="pill">{q.type}</span>
                <span className={`badge ${diffCls(q.difficulty)}`}>{q.difficulty}</span>
              </div>
              <h3 style={{ margin: '10px 0 6px' }}>{q.title}</h3>
              <p className="muted" style={{ fontSize: 14 }}>{q.prompt}</p>
              {q.considerations?.length > 0 && (
                <details>
                  <summary style={{ cursor: 'pointer', color: 'var(--primary)', fontSize: 14 }}>Key considerations</summary>
                  <ul className="muted" style={{ fontSize: 14, marginTop: 8 }}>
                    {q.considerations.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </details>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Rubric + interview types */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginTop: 32 }}>
        <section>
          <h2>Interviewer Rubric</h2>
          {data.rubric.map((r, i) => (
            <div key={i} className="card" style={{ marginBottom: 12 }}>
              <h3 style={{ margin: '0 0 6px' }}>{r.dimension}</h3>
              <p className="muted" style={{ fontSize: 14, margin: '0 0 8px' }}>{r.detail}</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {r.failures.map((f, j) => <span key={j} className="pill" style={{ color: 'var(--danger)' }}>{f}</span>)}
              </div>
            </div>
          ))}
        </section>
        <section>
          <h2>Interview Types</h2>
          {data.interview_types.map((t, i) => (
            <div key={i} className="card" style={{ marginBottom: 12 }}>
              <h3 style={{ margin: '0 0 6px' }}>{t.name}</h3>
              <p className="muted" style={{ fontSize: 14, margin: 0 }}>{t.detail}</p>
            </div>
          ))}
        </section>
      </div>

      <p className="tertiary" style={{ fontSize: 12, marginTop: 32 }}>Source: {data.source}</p>
    </div>
  );
}
