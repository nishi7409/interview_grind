export function DifficultyBadge({ level }) {
  const cls = { Easy: 'diff-easy', Medium: 'diff-medium', Hard: 'diff-hard' }[level] || 'muted';
  return <span className={`badge ${cls}`}>{level}</span>;
}

export function Pill({ children }) {
  return <span className="pill">{children}</span>;
}

export function Spinner({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ink-subtle)', padding: 24 }}>
      <span className="spinner" /> {label || 'Loading…'}
    </div>
  );
}

export function ErrorBanner({ error }) {
  if (!error) return null;
  return (
    <div className="card" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
      {String(error.message || error)}
    </div>
  );
}
