// Thin API client for the FastAPI backend.
// Base URL comes from Vite env (VITE_API_BASE), defaulting to the dev proxy path.
const BASE = import.meta.env.VITE_API_BASE ?? '/api';

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    let detail;
    try { detail = (await res.json()).detail; } catch { detail = res.statusText; }
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  health: () => req('/health'),
  listProblems: ({ difficulty, tag, q } = {}) => {
    const p = new URLSearchParams();
    if (difficulty) p.set('difficulty', difficulty);
    if (tag) p.set('tag', tag);
    if (q) p.set('q', q);
    const qs = p.toString();
    return req(`/problems${qs ? `?${qs}` : ''}`);
  },
  tags: () => req('/problems/tags'),
  getProblem: (slug) => req(`/problems/${slug}`),
  run: (code, stdin = '') =>
    req('/problems/run', { method: 'POST', body: JSON.stringify({ code, stdin }) }),
  submit: (slug, code) =>
    req(`/problems/${slug}/submit`, { method: 'POST', body: JSON.stringify({ code }) }),
  systemDesign: () => req('/system-design'),
};
