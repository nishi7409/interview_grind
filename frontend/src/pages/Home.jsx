import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="container" style={{ paddingTop: 64, paddingBottom: 64 }}>
      <div style={{ maxWidth: 720 }}>
        <span className="pill">Python · Sandbox · System Design</span>
        <h1 style={{ fontSize: 44, letterSpacing: '-1.4px', margin: '20px 0 12px', lineHeight: 1.1 }}>
          Grind interviews.<br />Ship the offer.
        </h1>
        <p className="muted" style={{ fontSize: 18 }}>
          A focused practice platform: classic coding problems with an in-browser Python sandbox,
          plus a structured system-design curriculum inspired by HelloInterview.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <Link to="/problems" className="btn btn-primary">Browse problems</Link>
          <Link to="/system-design" className="btn btn-secondary">System design</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 48 }}>
        <Feature title="Run & Submit" body="Write Python, run it, and grade against real test cases in a sandboxed subprocess with time and memory limits." />
        <Feature title="Filter & focus" body="Browse by difficulty and topic tag, or search by title — built for deliberate, targeted practice." />
        <Feature title="System design" body="A repeatable delivery framework, the interviewer rubric, and practice prompts for common questions." />
      </div>
    </div>
  );
}

function Feature({ title, body }) {
  return (
    <div className="card">
      <h3 style={{ marginBottom: 8 }}>{title}</h3>
      <p className="muted" style={{ fontSize: 14, margin: 0 }}>{body}</p>
    </div>
  );
}
