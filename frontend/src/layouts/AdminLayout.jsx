import { useEffect } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import './admin.css';

function useAdminAssets() {
  useEffect(() => {
    const links = [
      ['bootstrap', 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css'],
      ['fa', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'],
    ].map(([id, href]) => {
      if (document.getElementById(id)) return null;
      const el = document.createElement('link');
      el.id = id;
      el.rel = 'stylesheet';
      el.href = href;
      document.head.appendChild(el);
      return el;
    });
    return () => links.forEach((el) => el?.remove());
  }, []);
}

function pageMeta(pathname) {
  if (pathname.startsWith('/admin/programs')) return 'Programs Management';
  if (pathname.startsWith('/admin/applicants')) return 'Applicants Management';
  if (pathname.startsWith('/admin/interviews')) return 'Interview Candidates';
  if (pathname.startsWith('/admin/announcements')) return 'Announcements Management';
  if (pathname.startsWith('/admin/gallery')) return 'Gallery Management';
  return 'Dashboard';
}

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const { college } = useSettings();
  const location = useLocation();
  useAdminAssets();

  if (loading) return <div className="p-5">Loading…</div>;
  if (!user || user.role !== 'admin') return <Navigate to="/signin" replace />;

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="admin-body">
      <aside className="admin-sidebar">
        <Link className="admin-brand" to="/admin">
          <img src="/images/logo.svg" alt="" />
          <span>
            <strong>FGC Admin</strong>
            <small>{college.name}</small>
          </span>
        </Link>
        <nav className="admin-nav">
          <NavLink className="nav-link" end to="/admin"><i className="fa fa-gauge-high" /> Dashboard</NavLink>
          <NavLink className="nav-link" to="/admin/programs"><i className="fa fa-graduation-cap" /> Programs</NavLink>
          <NavLink className="nav-link" to="/admin/applicants"><i className="fa fa-users" /> Applicants</NavLink>
          <NavLink className="nav-link" to="/admin/interviews"><i className="fa fa-calendar-check" /> Interviews</NavLink>
          <NavLink className="nav-link" to="/admin/announcements"><i className="fa fa-bullhorn" /> Announcements</NavLink>
          <NavLink className="nav-link" to="/admin/gallery"><i className="fa fa-images" /> Gallery</NavLink>
        </nav>
      </aside>
      <div className="admin-shell">
        <header className="admin-topbar">
          <div>
            <p className="admin-topbar-title">{pageMeta(location.pathname)}</p>
            <p className="admin-topbar-date">{today}</p>
          </div>
          <div className="admin-topbar-actions">
            <span className="admin-topbar-user">{user.name || 'Admin User'}</span>
            <Link className="admin-btn-ghost" to="/" target="_blank" rel="noreferrer">View website</Link>
            <button type="button" className="admin-btn-logout" onClick={logout}>Logout</button>
          </div>
        </header>
        <main className="admin-main"><Outlet /></main>
      </div>
    </div>
  );
}
