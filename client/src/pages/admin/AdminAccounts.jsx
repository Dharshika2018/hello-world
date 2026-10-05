import { useCallback, useEffect, useState } from 'react';
import AppShell from '../../components/AppShell.jsx';
import { adminLinks } from '../../components/navLinks.js';
import { adminApi } from '../../api/client.js';
import { useSite } from '../../context/SiteContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Alert, Badge, Loading, Modal, Select, StatusBadge, TextInput, formatDateTime } from '../../components/ui.jsx';

const blank = { name: '', email: '', password: '', role: 'admin', phone: '', district: '' };

export default function AdminAccounts() {
  const site = useSite();
  const toast = useToast();
  const { user: me } = useAuth();

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  const load = useCallback(() => {
    adminApi
      .users({ role: '', limit: 100 })
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(load, [load]);

  const create = async (event) => {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    setNotice('');
    try {
      const result = await adminApi.createUser(form);
      toast.success('Account created', `${result.user.name} can sign in as ${result.user.role}.`);
      setForm(blank);
      setOpen(false);
      load();
    } catch (err) {
      setErrors(err.errors || {});
      setNotice(err.message);
    } finally {
      setBusy(false);
    }
  };

  const update = async (user, patch) => {
    try {
      await adminApi.updateUser(user._id, patch);
      toast.success('Account updated', user.name);
      load();
    } catch (err) {
      toast.error('Could not update the account', err.message);
    }
  };

  const remove = async (user) => {
    if (!window.confirm(`Delete ${user.name}'s account?`)) return;
    try {
      await adminApi.deleteUser(user._id, { force: 1 });
      toast.success('Account deleted', user.email);
      load();
    } catch (err) {
      toast.error('Could not delete the account', err.message);
    }
  };

  const staff = (data?.items || []).filter((user) => user.role === 'admin');
  const students = (data?.items || []).filter((user) => user.role === 'student');

  return (
    <AppShell
      links={adminLinks}
      homeLink="/admin"
      tone="admin"
      title="Accounts &amp; roles"
      subtitle="Role based access control - administrators manage the system, students apply and volunteer"
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <div className="card mb-3">
        <div className="card__head--row">
          <div>
            <h3 className="mb-0">Administrator accounts</h3>
            <span className="text-small text-muted">
              Administrators can verify applications, manage scholarships and events, and email students.
            </span>
          </div>
          <button type="button" className="btn" onClick={() => setOpen(true)}>
            + Create account
          </button>
        </div>
        {data === null ? (
          <Loading label="Loading accounts…" />
        ) : (
          <div className="table-wrap" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Last sign in</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((user) => (
                  <tr key={user._id}>
                    <td className="table__strong">
                      {user.name} {String(user._id) === String(me?._id) ? <Badge tone="brand">you</Badge> : null}
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <Badge tone="brand">Administrator</Badge>
                    </td>
                    <td className="nowrap">{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'}</td>
                    <td>
                      <StatusBadge status={user.status} />
                    </td>
                    <td>
                      <div className="table__actions">
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => update(user, { status: user.status === 'active' ? 'inactive' : 'active' })}
                          disabled={String(user._id) === String(me?._id)}
                        >
                          {user.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => {
                            const password = window.prompt(`New password for ${user.name} (min 6 characters)`);
                            if (password) update(user, { password });
                          }}
                        >
                          Reset password
                        </button>
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => remove(user)}
                          disabled={String(user._id) === String(me?._id)}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card__head--row">
          <div>
            <h3 className="mb-0">Student accounts</h3>
            <span className="text-small text-muted">Students register themselves from the public website.</span>
          </div>
          <Badge tone="muted">{students.length} student account(s)</Badge>
        </div>
        <div className="table-wrap" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>District</th>
                <th>Applications</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((user) => (
                <tr key={user._id}>
                  <td className="table__strong">{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.district || '—'}</td>
                  <td>{user.applications}</td>
                  <td>
                    <StatusBadge status={user.status} />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => update(user, { status: user.status === 'active' ? 'inactive' : 'active' })}
                    >
                      {user.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={open}
        title="Create an account"
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="account-form" className="btn" disabled={busy}>
              {busy ? 'Creating…' : 'Create account'}
            </button>
          </>
        }
      >
        {notice ? <Alert tone="danger">{notice}</Alert> : null}
        <form id="account-form" onSubmit={create} className="form-grid">
          <TextInput
            label="Full name"
            required
            className="span-2"
            value={form.name}
            error={errors.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
          <TextInput
            label="Email address"
            required
            type="email"
            value={form.email}
            error={errors.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
          <TextInput
            label="Temporary password"
            required
            hint="At least 6 characters - share it securely and ask them to change it."
            value={form.password}
            error={errors.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          />
          <Select
            label="Role"
            required
            options={[
              { value: 'admin', label: 'Administrator (full access)' },
              { value: 'student', label: 'Student' },
            ]}
            value={form.role}
            onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
          />
          <TextInput
            label="Phone"
            placeholder="Optional"
            value={form.phone}
            error={errors.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
          />
          <Select
            label="District"
            className="span-2"
            placeholder="Optional"
            options={site.districts}
            value={form.district}
            onChange={(event) => setForm((current) => ({ ...current, district: event.target.value }))}
          />
        </form>
      </Modal>
    </AppShell>
  );
}
