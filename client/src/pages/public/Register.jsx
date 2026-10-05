import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Alert, Checkbox, Logo, Select, TextInput } from '../../components/ui.jsx';

export default function Register() {
  const { register } = useAuth();
  const site = useSite();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    phone: '',
    nic: '',
    district: '',
    agree: false,
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setErrors({});

    if (form.password !== form.confirm) {
      setErrors({ confirm: 'Passwords do not match' });
      return;
    }
    if (!form.agree) {
      setErrors({ agree: 'Please accept the declaration to continue' });
      return;
    }

    setBusy(true);
    try {
      const user = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        nic: form.nic,
        district: form.district,
      });
      toast.success('Account created', `Welcome ${user.name.split(' ')[0]}! You can now apply for scholarships.`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
      setErrors(err.errors || {});
    } finally {
      setBusy(false);
    }
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
        <h2 style={{ color: '#fff', fontSize: '1.9rem' }}>Create your student account</h2>
        <ul className="check-list check-list--light">
          <li>Submit scholarship applications online in six guided steps</li>
          <li>Upload your NIC, results sheet and income certificate</li>
          <li>Track verification status and receive email decisions</li>
          <li>Register as a volunteer for our seminars and paper classes</li>
        </ul>
        <div className="alert" style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.25)', color: '#fff' }}>
          Your details are used only for scholarship verification and event coordination.
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-card auth-card--wide">
          <div className="auth-brand">
            <Logo size={38} />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Student registration</h2>
              <p className="text-muted text-small" style={{ margin: 0 }}>
                All fields marked with * are required
              </p>
            </div>
          </div>

          {error ? <Alert tone="danger" title="Registration failed">{error}</Alert> : null}

          <form onSubmit={submit} className="stack">
            <div className="form-grid">
              <TextInput
                label="Full name"
                required
                className="span-2"
                placeholder="e.g. Nimali Perera"
                value={form.name}
                error={errors.name}
                onChange={update('name')}
              />
              <TextInput
                label="Email address"
                type="email"
                required
                placeholder="you@example.com"
                hint="Scholarship decisions are emailed to this address"
                value={form.email}
                error={errors.email}
                onChange={update('email')}
              />
              <TextInput
                label="Mobile number"
                required
                placeholder="0771234567"
                value={form.phone}
                error={errors.phone}
                onChange={update('phone')}
              />
              <TextInput
                label="NIC number"
                required
                placeholder="200312345678 or 991234567V"
                value={form.nic}
                error={errors.nic}
                onChange={update('nic')}
              />
              <Select
                label="District"
                required
                placeholder="Select your district"
                options={site.districts}
                value={form.district}
                error={errors.district}
                onChange={update('district')}
              />
              <TextInput
                label="Password"
                type="password"
                required
                placeholder="At least 6 characters"
                value={form.password}
                error={errors.password}
                onChange={update('password')}
              />
              <TextInput
                label="Confirm password"
                type="password"
                required
                placeholder="Repeat your password"
                value={form.confirm}
                error={errors.confirm}
                onChange={update('confirm')}
              />
            </div>

            <Checkbox
              label="I declare that the information I provide is true and correct, and I consent to the foundation verifying it with my school, university or Grama Niladhari."
              checked={form.agree}
              onChange={update('agree')}
            />
            {errors.agree ? <span className="field__error">{errors.agree}</span> : null}

            <button type="submit" className="btn btn--lg btn--block" disabled={busy}>
              {busy ? 'Creating your account…' : 'Create my account'}
            </button>
          </form>

          <p className="text-center mt-3">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
