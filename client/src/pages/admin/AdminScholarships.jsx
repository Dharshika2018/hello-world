import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/AppShell.jsx';
import { adminLinks } from '../../components/navLinks.js';
import { scholarshipsApi } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Alert, Badge, EmptyState, Loading, StatusBadge, daysUntil, formatDate, formatMoney } from '../../components/ui.jsx';

export default function AdminScholarships() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ q: '', category: '', status: '' });

  const load = useCallback(() => {
    setData(null);
    scholarshipsApi
      .list({ ...filters, includeDrafts: 1, limit: 100 })
      .then(setData)
      .catch((err) => setError(err.message));
  }, [filters]);

  useEffect(load, [load]);

  const toggleStatus = async (scholarship) => {
    const next = scholarship.status === 'open' ? 'closed' : 'open';
    try {
      await scholarshipsApi.update(scholarship._id, { status: next });
      toast.success(`Scholarship ${next === 'open' ? 'reopened' : 'closed'}`, scholarship.title);
      load();
    } catch (err) {
      toast.error('Could not update the scholarship', err.message);
    }
  };

  const remove = async (scholarship) => {
    if (!window.confirm(`Delete "${scholarship.title}"? Applications already submitted will keep their records.`)) return;
    try {
      await scholarshipsApi.remove(scholarship._id, { force: 1 });
      toast.success('Scholarship deleted', scholarship.title);
      load();
    } catch (err) {
      toast.error('Could not delete the scholarship', err.message);
    }
  };

  return (
    <AppShell
      links={adminLinks}
      homeLink="/admin"
      tone="admin"
      title="Scholarships"
      subtitle="Create, update, close and delete the scholarship programmes students can apply for"
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <div className="flex flex--between flex--wrap mb-2">
        <div className="filter-bar" style={{ margin: 0, flex: 1, minWidth: 280 }}>
          <div className="field">
            <label className="field__label" htmlFor="sch-q">
              Search
            </label>
            <input
              id="sch-q"
              className="input"
              placeholder="Scholarship title"
              value={filters.q}
              onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="sch-cat">
              Category
            </label>
            <select
              id="sch-cat"
              className="select"
              value={filters.category}
              onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
            >
              <option value="">All</option>
              <option value="school">School</option>
              <option value="university">University</option>
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="sch-status">
              Status
            </label>
            <select
              id="sch-status"
              className="select"
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
        <Link to="/admin/scholarships/new" className="btn">
          + New scholarship
        </Link>
      </div>

      {data === null ? (
        <Loading label="Loading scholarships…" />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon="🏅"
          title="No scholarships yet"
          description="Create your first programme - students will see it immediately on the public website."
          action={
            <Link to="/admin/scholarships/new" className="btn">
              Create a scholarship
            </Link>
          }
        />
      ) : (
        <div className="stack">
          {data.items.map((scholarship) => {
            const left = daysUntil(scholarship.deadline);
            return (
              <div key={scholarship._id} className="card">
                <div className="card__body">
                  <div className="flex flex--between flex--wrap mb-2">
                    <div style={{ minWidth: 0 }}>
                      <div className="pill-row mb-1">
                        <Badge tone={scholarship.category === 'school' ? 'info' : 'brand'}>
                          {scholarship.category === 'school' ? 'School students' : 'University students'}
                        </Badge>
                        <StatusBadge status={scholarship.status} />
                        {scholarship.code ? <Badge tone="muted">{scholarship.code}</Badge> : null}
                        {scholarship.featured ? <Badge tone="warning">Featured</Badge> : null}
                        {left !== null ? (
                          <Badge tone={left < 0 ? 'danger' : left <= 7 ? 'warning' : 'success'}>
                            {left < 0 ? 'Deadline passed' : `${left} day(s) to deadline`}
                          </Badge>
                        ) : null}
                      </div>
                      <h3 style={{ marginBottom: 4 }}>{scholarship.title}</h3>
                      <p className="text-small text-muted mb-0">{scholarship.shortDescription}</p>
                    </div>
                  </div>

                  <div className="detail-grid">
                    <div>
                      <div className="detail-row">
                        <span className="detail-row__label">Award</span>
                        <span className="detail-row__value">{scholarship.awardAmount || '—'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-row__label">Seats</span>
                        <span className="detail-row__value">{scholarship.seats || '—'}</span>
                      </div>
                    </div>
                    <div>
                      <div className="detail-row">
                        <span className="detail-row__label">Opens</span>
                        <span className="detail-row__value">{formatDate(scholarship.applicationOpenDate)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-row__label">Deadline</span>
                        <span className="detail-row__value">{formatDate(scholarship.deadline)}</span>
                      </div>
                    </div>
                    <div>
                      <div className="detail-row">
                        <span className="detail-row__label">Academic year</span>
                        <span className="detail-row__value">{scholarship.academicYear || '—'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-row__label">Contact</span>
                        <span className="detail-row__value">{scholarship.contactPerson || '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="btn-row mt-2">
                    <Link to={`/admin/scholarships/${scholarship._id}/edit`} className="btn btn--sm">
                      ✏️ Edit
                    </Link>
                    <button type="button" className="btn btn--outline btn--sm" onClick={() => toggleStatus(scholarship)}>
                      {scholarship.status === 'open' ? '🔒 Close applications' : '🔓 Reopen applications'}
                    </button>
                    <Link to={`/scholarships/${scholarship._id}`} className="btn btn--ghost btn--sm" target="_blank">
                      👁 View public page
                    </Link>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => remove(scholarship)}>
                      🗑 Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
