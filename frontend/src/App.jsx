import { NavLink, Route, Routes } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import Problems from './pages/Problems';
import ProblemDetail from './pages/ProblemDetail';
import SystemDesign from './pages/SystemDesign';

function Nav() {
  const linkClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;
  return (
    <header className="nav">
      <div className="container nav-inner">
        <NavLink to="/" className="brand">
          <span className="brand-mark">◈</span> Interview&nbsp;Grind
        </NavLink>
        <nav className="nav-links">
          <NavLink to="/problems" className={linkClass}>Problems</NavLink>
          <NavLink to="/system-design" className={linkClass}>System Design</NavLink>
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/problems" element={<Problems />} />
          <Route path="/problems/:slug" element={<ProblemDetail />} />
          <Route path="/system-design" element={<SystemDesign />} />
          <Route path="*" element={<div className="container" style={{ paddingTop: 64 }}><h1>404</h1><p className="muted">Page not found.</p></div>} />
        </Routes>
      </main>
    </>
  );
}
