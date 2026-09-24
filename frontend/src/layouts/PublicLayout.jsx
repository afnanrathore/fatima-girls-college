import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

export default function PublicLayout() {
  const { college, admissionsOpen } = useSettings();
  const [open, setOpen] = useState(false);
  const year = new Date().getFullYear();

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/" onClick={() => setOpen(false)}>
            <img src="/images/logo.svg" alt={`${college.name} logo`} width="44" height="44" />
            <span className="brand-text">
              <strong>{college.name}</strong>
              <small>{college.location}</small>
            </span>
          </Link>
          <button
            className="nav-toggle"
            type="button"
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>
          <div className={`header-collapse${open ? ' is-open' : ''}`} id="site-menu">
            <nav className="site-nav" aria-label="Main" onClick={() => setOpen(false)}>
              <NavLink end to="/">Home</NavLink>
              <NavLink to="/about">About</NavLink>
              <NavLink to="/programs">Programs</NavLink>
              <NavLink to="/admission">Admissions</NavLink>
              <NavLink to="/contact">Contact</NavLink>
            </nav>
            <div className="header-actions" onClick={() => setOpen(false)}>
              <Link className="btn btn-ghost" to="/status">Check Status</Link>
              {admissionsOpen ? (
                <Link className="btn btn-primary" to="/apply">Apply Online</Link>
              ) : (
                <Link className="btn btn-primary" to="/admission">Admissions Info</Link>
              )}
            </div>
          </div>
        </div>
      </header>
      <main id="main"><Outlet /></main>
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <h3>{college.name}</h3>
              <p>{college.tagline}. Education enriched with Islamic values and 21st-century skills.</p>
            </div>
            <div>
              <h3>Quick Links</h3>
              <ul className="footer-links">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/about">About</Link></li>
                <li><Link to="/programs">Programs</Link></li>
                <li><Link to="/admission">Admissions</Link></li>
                <li><Link to="/apply">Apply Online</Link></li>
                <li><Link to="/status">Application Status</Link></li>
                <li><Link to="/contact">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3>Contact</h3>
              <p>
                {college.address}<br />
                Phone: <a href={`tel:${college.phone}`}>{college.phone_display}</a><br />
                Email: <a href={`mailto:${college.email}`}>{college.email}</a>
              </p>
            </div>
          </div>
          <p className="footer-copy">&copy; {year} {college.name}, {college.location}. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
