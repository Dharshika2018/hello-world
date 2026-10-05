import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSite } from '../context/SiteContext.jsx';
import { initialOf, Logo } from './ui.jsx';

/**
 * Shared shell for both portals (student dashboard + admin panel).
 * `links` is a flat array of { to, label, icon } or { group: 'Label' } separators.
 */
export default function AppShell({ links, homeLink, title, subtitle, children, tone = 'student' }) {
  const { user, logout } = useAuth();
  const site = useSite();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="app-shell">
      <aside className={`sidebar${open ? ' sidebar--open' : ''}`}>
        <Link to={homeLink} className="sidebar__brand">
          <Logo size={38} className="brand__logo" />
          <span>
            {site.organisation.name}
            <small style={{ display: 'block', fontWeight: 600, opacity: 0.7, fontSize: '0.7rem', letterSpacing: '0.1em' }}>
              {tone === 'admin' ? 'ADMIN PANEL' : 'STUDENT PORTAL'}
            </small>
          </span>
        </Link>

        <nav>
          {links.map((link, index) =>
            link.group ? (
              <div key={`group-${index}`} className="sidebar__group">
                {link.group}
              </div>
            ) : (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
              >
                <span className="sidebar__link-icon">{link.icon}</span>
                {link.label}
                {link.badge ? <span className="badge badge--warning" style={{ marginLeft: 'auto' }}>{link.badge}</span> : null}
              </NavLink>
            )
          )}
        </nav>

        <div className="sidebar__foot">
          <div className="sidebar__user">
            <span className="avatar avatar--light">{initialOf(user?.name)}</span>
            <span style={{ minWidth: 0 }}>
              <strong style={{ display: 'block', color: '#fff', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name}
              </strong>
              <small style={{ opacity: 0.75 }}>{user?.role === 'admin' ? 'Administrator' : 'Student'}</small>
            </span>
          </div>
          <button type="button" className="btn btn--light btn--sm btn--block" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="main-panel">
        <div className="topbar">
          <button type="button" className="sidebar-toggle" onClick={() => setOpen((value) => !value)} aria-label="Toggle menu">
            ☰
          </button>
          <div>
            <h1>{title}</h1>
            {subtitle ? <div className="topbar__sub">{subtitle}</div> : null}
          </div>
          <div className="spacer" />
          <Link to="/" className="btn btn--ghost btn--sm">
            ← Public website
          </Link>
        </div>
        <div className="page">{children || <Outlet />}</div>
      </div>
    </div>
  );
}
