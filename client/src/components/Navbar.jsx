import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSite } from '../context/SiteContext.jsx';
import { notificationsApi } from '../api/client.js';
import { Logo } from './ui.jsx';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/scholarships', label: 'Scholarships' },
  { to: '/events', label: 'Events & Volunteering' },
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const site = useSite();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!isAuthenticated || isAdmin) {
      setUnread(0);
      return undefined;
    }
    let active = true;
    const load = () =>
      notificationsApi
        .unread()
        .then((data) => active && setUnread(data.unread))
        .catch(() => {});
    load();
    const timer = setInterval(load, 45000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [isAuthenticated, isAdmin, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="brand">
          <Logo />
          <span className="brand__text">
            {site.organisation.name}
            <small>{site.organisation.tagline}</small>
          </span>
        </Link>

        <nav className="nav-links">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-actions">
          {isAuthenticated ? (
            <>
              {!isAdmin ? (
                <Link to="/dashboard/notifications" className="notif-bell" title="Notifications">
                  🔔
                  {unread > 0 ? <span className="notif-bell__count">{unread > 9 ? '9+' : unread}</span> : null}
                </Link>
              ) : null}
              <Link to={isAdmin ? '/admin' : '/dashboard'} className="btn btn--ghost btn--sm">
                {isAdmin ? 'Admin panel' : 'My dashboard'}
              </Link>
              <button type="button" className="btn btn--outline btn--sm" onClick={handleLogout}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn--ghost btn--sm">
                Sign in
              </Link>
              <Link to="/register" className="btn btn--sm">
                Create account
              </Link>
            </>
          )}
        </div>

        <button type="button" className="nav-toggle" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">
          {open ? '✕' : '☰'}
        </button>
      </div>

      <div className={`mobile-drawer${open ? ' mobile-drawer--open' : ''}`}>
        {LINKS.map((link) => (
          <Link key={link.to} to={link.to}>
            {link.label}
          </Link>
        ))}
        {isAuthenticated ? (
          <>
            <Link to={isAdmin ? '/admin' : '/dashboard'}>{isAdmin ? 'Admin panel' : 'My dashboard'}</Link>
            {user?.role === 'student' ? <Link to="/dashboard/applications">My applications</Link> : null}
            <button type="button" className="btn btn--outline btn--block" onClick={handleLogout}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Sign in</Link>
            <Link to="/register" className="btn btn--block">
              Create account
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
