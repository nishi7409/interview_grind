import { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { api } from '../api';

// Python-only code editor. Run (free execution) + Submit (graded against test cases).
export default function CodeEditor({ slug, starterCode }) {
  const [code, setCode] = useState(starterCode || '');
  const [busy, setBusy] = useState(null); // 'run' | 'submit' | null
  const [runOut, setRunOut] = useState(null);
  const [submitOut, setSubmitOut] = useState(null);
  const [err, setErr] = useState(null);

  async function doRun() {
    setBusy('run'); setErr(null); setSubmitOut(null); setRunOut(null);
    try { setRunOut(await api.run(code)); }
    catch (e) { setErr(e); }
    finally { setBusy(null); }
  }

  async function doSubmit() {
    setBusy('submit'); setErr(null); setRunOut(null); setSubmitOut(null);
    try { setSubmitOut(await api.submit(slug, code)); }
    catch (e) { setErr(e); }
    finally { setBusy(null); }
  }

  return (
    <div>
      <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 'var(--r-panel)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 16px', borderBottom: '1px solid var(--hairline)', background: 'var(--surface-2)' }}>
          <span className="mono muted" style={{ fontSize: 12 }}>solution.py — Python</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={doRun} disabled={busy}>
              {busy === 'run' ? <span className="spinner" /> : '▶'} Run
            </button>
            <button className="btn btn-primary" onClick={doSubmit} disabled={busy}>
              {busy === 'submit' ? <span className="spinner" /> : '✓'} Submit
            </button>
          </div>
        </div>
        <CodeMirror
          value={code}
          height="360px"
          theme={oneDark}
          extensions={[python()]}
          onChange={setCode}
          basicSetup={{ lineNumbers: true, highlightActiveLine: true }}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        {err && <div className="card" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>{String(err.message)}</div>}
        {runOut && <RunOutput result={runOut} />}
        {submitOut && <SubmitOutput result={submitOut} />}
      </div>
    </div>
  );
}

function RunOutput({ result }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <strong style={{ color: result.ok ? 'var(--success)' : 'var(--danger)' }}>
          {result.ok ? 'Ran successfully' : 'Run failed'}
        </strong>
        <span className="tertiary" style={{ fontSize: 12 }}>{result.duration_ms} ms</span>
      </div>
      {result.stdout && <Block title="stdout" text={result.stdout} />}
      {result.stderr && <Block title="stderr" text={result.stderr} danger />}
      {result.error && <Block title="error" text={result.error} danger />}
    </div>
  );
}

function SubmitOutput({ result }) {
  const allPass = result.passed;
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ color: allPass ? 'var(--success)' : 'var(--danger)' }}>
          {allPass ? 'Accepted' : 'Wrong Answer'} — {result.passed_count}/{result.total} tests passed
        </strong>
        <span className="tertiary" style={{ fontSize: 12 }}>{result.duration_ms} ms</span>
      </div>
      {result.error && <Block title="error" text={result.error} danger />}
      <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
        {result.results.map((r) => (
          <div key={r.index} style={{
            border: '1px solid var(--hairline)', borderRadius: 8, padding: 12,
            borderLeft: `3px solid ${r.passed ? 'var(--success)' : 'var(--danger)'}`,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: r.passed ? 'var(--success)' : 'var(--danger)' }}>
              Test {r.index + 1}: {r.passed ? 'Passed' : 'Failed'}
            </div>
            {!r.passed && (
              <div className="mono" style={{ fontSize: 12, marginTop: 6, color: 'var(--ink-muted)' }}>
                <div>input: {JSON.stringify(r.input)}</div>
                <div>expected: {JSON.stringify(r.expected)}</div>
                <div>got: {r.error ? <span style={{ color: 'var(--danger)' }}>{r.error}</span> : JSON.stringify(r.got)}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Block({ title, text, danger }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div className="tertiary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>{title}</div>
      <pre className="mono" style={{
        margin: 0, padding: 12, background: 'var(--surface-3)', borderRadius: 8,
        color: danger ? 'var(--danger)' : 'var(--ink-muted)', whiteSpace: 'pre-wrap', overflowX: 'auto',
      }}>{text}</pre>
    </div>
  );
}
