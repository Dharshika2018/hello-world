import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth as authApi } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Alert, Logo, TextInput } from '../../components/ui.jsx';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [demo, setDemo] = useState(null);

  useEffect(() => {
    authApi
      .demoAccounts()
      .then((data) => setDemo(data.accounts))
      .catch(() => {});
  }, []);

  // Already signed in? Go to the right home.
  useEffect(() => {
    if (user) navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
  }, [user, navigate]);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setErrors({});
    try {
      const account = await login({ email: form.email, password: form.password });
      toast.success(`Welcome back, ${account.name.split(' ')[0]}!`, account.role === 'admin' ? 'Signed in to the admin panel.' : 'Signed in to your student dashboard.');

      const requested = location.state?.from;
      if (account.role === 'admin') {
        navigate(requested?.startsWith('/admin') ? requested : '/admin', { replace: true });
      } else {
        navigate(requested && !requested.startsWith('/admin') ? requested : '/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message);
      setErrors(err.errors || {});
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = (account) => {
    setRole(account.role);
    setForm({ email: account.email, password: account.password });
    setError('');
  };

  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <Link to="/" className="brand" style={{ color: '#fff' }}>
          <Logo size={44} className="brand__logo" />
          <span className="brand__text" style={{ color: '#fff' }}>
            Scholarship Foundation
            <small style={{ color: 'rgba(255,255,255,.75)' }}>Empowering Students. Shaping Futures.</small>
          </span>
        </Link>
        <h2 style={{ color: '#fff', fontSize: '1.9rem' }}>One portal for students, volunteers and administrators.</h2>
        <ul className="check-list check-list--light">
          <li>Students apply for scholarships and track verification status</li>
          <li>Volunteers register for seminars and paper classes</li>
          <li>Administrators review, approve and email decisions instantly</li>
        </ul>
        <div className="alert" style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.25)', color: '#fff' }}>
          This is a demonstration build. Use the demo accounts on the right to explore both portals.
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-brand">
            <Logo size={38} />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Sign in</h2>
              <p className="text-muted text-small" style={{ margin: 0 }}>
                Choose your portal and enter your credentials
              </p>
            </div>
          </div>

          <div className="role-toggle">
            <button type="button" className={role === 'student' ? 'active' : ''} onClick={() => setRole('student')}>
              🎓 Student / Volunteer
              <small>Apply &amp; volunteer</small>
            </button>
            <button type="button" className={role === 'admin' ? 'active' : ''} onClick={() => setRole('admin')}>
              🛡️ Administrator
              <small>Verify &amp; manage</small>
            </button>
          </div>

          {location.state?.message ? <Alert tone="info">{location.state.message}</Alert> : null}
          {error ? <Alert tone="danger" title="Could not sign you in">{error}</Alert> : null}

          <form onSubmit={submit} className="stack">
            <TextInput
              label="Email address"
              type="email"
              required
              autoComplete="email"
              placeholder={role === 'admin' ? 'admin@scholarship.org' : 'you@example.com'}
              value={form.email}
              error={errors.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
            <TextInput
              label="Password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              error={errors.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            />
            <button type="submit" className="btn btn--lg btn--block" disabled={busy}>
              {busy ? 'Signing in…' : `Sign in as ${role === 'admin' ? 'administrator' : 'student'}`}
            </button>
          </form>

          {role === 'admin' ? (
            <p className="hint-note mt-2">
              Administrator accounts are created by the board in <strong>Admin → Accounts</strong>. Student self
              registration is not available for admin accounts.
            </p>
          ) : null}

          {demo?.length ? (
            <div className="demo-creds mt-3">
              <strong>Demo accounts (created by the seed script)</strong>
              <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                {demo.map((account) => (
                  <li key={account.role}>
                    {account.label}: <code>{account.email}</code> / <code>{account.password}</code>{' '}
                    <button type="button" onClick={() => fillDemo(account)}>
                      use
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="text-center mt-3">
            New student? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
