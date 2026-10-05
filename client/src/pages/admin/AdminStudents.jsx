import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/AppShell.jsx';
import { adminLinks } from '../../components/navLinks.js';
import { adminApi } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Alert, Badge, EmptyState, Loading, Pagination, StatusBadge, formatDate, formatDateTime } from '../../components/ui.jsx';

export default function AdminStudents() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ q: '', role: 'student', status: '' });

  const load = useCallback(() => {
    setData(null);
    adminApi
      .users({ ...filters, page, limit: 15 })
      .then(setData)
      .catch((err) => setError(err.message));
  }, [filters, page]);

  useEffect(load, [load]);

  const toggleStatus = async (user) => {
    try {
      await adminApi.updateUser(user._id, { status: user.status === 'active' ? 'inactive' : 'active' });
      toast.success(`Account ${user.status === 'active' ? 'deactivated' : 'activated'}`, user.name);
      load();
    } catch (err) {
      toast.error('Could not update the account', err.message);
    }
  };

  const remove = async (user) => {
    if (!window.confirm(`Delete ${user.name}'s account? Applications already submitted are kept for reporting.`)) return;
    try {
      await adminApi.deleteUser(user._id, { force: 1 });
      toast.success('Account deleted', user.email);
      load();
    } catch (err) {
      toast.error('Could not delete the account', err.message);
    }
  };

  return (
    <AppShell
      links={adminLinks}
      homeLink="/admin"
      tone="admin"
      title="Student accounts"
      subtitle="Every registered student, their contact details and application history"
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <div className="filter-bar">
        <div className="field">
          <label className="field__label" htmlFor="stu-q">
            Search
          </label>
          <input
            id="stu-q"
            className="input"
            placeholder="Name, email or NIC"
            value={filters.q}
            onChange={(event) => {
              setPage(1);
              setFilters((current) => ({ ...current, q: event.target.value }));
            }}
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="stu-role">
            Account type
          </label>
          <select
            id="stu-role"
            className="select"
            value={filters.role}
            onChange={(event) => {
              setPage(1);
              setFilters((current) => ({ ...current, role: event.target.value }));
            }}
          >
            <option value="student">Students</option>
            <option value="admin">Administrators</option>
            <option value="">All accounts</option>
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="stu-status">
            Status
          </label>
          <select
            id="stu-status"
            className="select"
            value={filters.status}
            onChange={(event) => {
              setPage(1);
              setFilters((current) => ({ ...current, status: event.target.value }));
            }}
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="filter-bar__actions">
          <button type="button" className="btn btn--ghost" onClick={() => setFilters({ q: '', role: 'student', status: '' })}>
            Reset
          </button>
          <Link to="/admin/accounts" className="btn btn--outline">
            Manage staff accounts
          </Link>
        </div>
      </div>

      {data === null ? (
        <Loading label="Loading accounts…" />
      ) : data.items.length === 0 ? (
        <EmptyState icon="🎓" title="No accounts found" description="Students appear here as soon as they register on the website." />
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>NIC</th>
                  <th>District</th>
                  <th>Applications</th>
                  <th>Registered</th>
                  <th>Last sign in</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <span className="table__strong">{user.name}</span>
                      <span className="table__sub">{user.role === 'admin' ? 'Administrator' : 'Student'}</span>
                    </td>
                    <td>
                      {user.email}
                      <span className="table__sub">{user.phone || '—'}</span>
                    </td>
                    <td className="nowrap">{user.nic || '—'}</td>
                    <td>{user.district || '—'}</td>
                    <td>
                      <Badge tone={user.applications > 0 ? 'brand' : 'muted'}>{user.applications} application(s)</Badge>
                    </td>
                    <td className="nowrap">{formatDate(user.createdAt)}</td>
                    <td className="nowrap">{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'}</td>
                    <td>
                      <StatusBadge status={user.status} />
                    </td>
                    <td>
                      <div className="table__actions">
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => toggleStatus(user)}>
                          {user.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => remove(user)}>
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} total={data.total} limit={data.limit} onChange={setPage} />
        </>
      )}
    </AppShell>
  );
}
