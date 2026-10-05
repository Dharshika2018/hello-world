import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/AppShell.jsx';
import { adminLinks } from '../../components/navLinks.js';
import { adminApi, applicationsApi, volunteersApi } from '../../api/client.js';
import {
  Alert,
  Badge,
  EmptyState,
  Loading,
  StatCard,
  StatusBadge,
  formatDate,
  formatDateTime,
  formatMoney,
} from '../../components/ui.jsx';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [today, setToday] = useState(null);
  const [pendingVolunteers, setPendingVolunteers] = useState([]);
  const [system, setSystem] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');

  const load = useCallback(() => {
    adminApi
      .stats()
      .then(setStats)
      .catch((err) => setError(err.message));
    applicationsApi
      .adminToday({ date })
      .then((data) => setToday(data))
      .catch((err) => setError(err.message));
    volunteersApi
      .adminList({ status: 'pending', limit: 5 })
      .then((data) => setPendingVolunteers(data.items))
      .catch(() => {});
    adminApi.system().then(setSystem).catch(() => {});
  }, [date]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [load]);

  const maxTrend = Math.max(1, ...(stats?.trend || []).map((item) => item.count));

  return (
    <AppShell
      links={adminLinks}
      homeLink="/admin"
      tone="admin"
      title="Admin dashboard"
      subtitle="Applications, verifications and volunteer activity at a glance"
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}

      {system?.database?.kind === 'memory' ? (
        <Alert tone="warning" title="Running on the built-in dev database">
          MongoDB is not reachable, so data is stored in <code>server/.data/memory-db.json</code>. Start your local
          MongoDB (<code>mongod</code>) and restart the API with <code>DB_MODE=mongo</code> to use MongoDB Compass.
        </Alert>
      ) : (
        <Alert tone="success" title="Connected to MongoDB">
          Data is stored in the <code>scholarship_portal</code> database - open MongoDB Compass and connect to{' '}
          <code>mongodb://127.0.0.1:27017</code> to inspect it.
        </Alert>
      )}

      {/* ------------------------------------------------------------ totals */}
      <div className="stat-grid page-section">
        <StatCard icon="📥" value={stats?.totals.applicationsToday ?? '—'} label="Applications received today" tone="accent" accent />
        <StatCard icon="⏳" value={stats?.totals.pending ?? '—'} label="Pending verification" tone="info" />
        <StatCard icon="✅" value={stats?.totals.approved ?? '—'} label="Approved scholarships" tone="success" />
        <StatCard icon="❌" value={stats?.totals.rejected ?? '—'} label="Rejected applications" tone="danger" />
        <StatCard icon="🤝" value={stats?.totals.pendingVolunteers ?? '—'} label="Volunteers awaiting approval" tone="accent" />
        <StatCard icon="📅" value={stats?.totals.upcomingEvents ?? '—'} label="Upcoming events" />
        <StatCard icon="🎓" value={stats?.totals.totalStudents ?? '—'} label="Registered students" />
        <StatCard icon="✉️" value={stats?.totals.emailsSent ?? '—'} label="Emails in outbox" />
      </div>

      {/* ------------------------------------------------- today's applications */}
      <div className="card page-section">
        <div className="card__head--row">
          <div>
            <h3 className="mb-0">📌 Scholarship applications received today</h3>
            <span className="text-small text-muted">Live list of students who submitted an application for the selected date</span>
          </div>
          <div className="btn-row">
            <input
              type="date"
              className="input"
              style={{ width: 170 }}
              value={date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(event) => setDate(event.target.value)}
            />
            <button type="button" className="btn btn--ghost btn--sm" onClick={load}>
              ⟳ Refresh
            </button>
            <Link to="/admin/applications" className="btn btn--sm">
              All applications
            </Link>
          </div>
        </div>

        {today === null ? (
          <Loading label="Loading today's applications…" />
        ) : today.items.length === 0 ? (
          <div className="card__body">
            <EmptyState
              icon="🗓️"
              title={`No applications were submitted on ${formatDate(date)}`}
              description="New submissions appear here instantly, and the total updates every minute."
            />
          </div>
        ) : (
          <>
            <div className="card__body" style={{ paddingBottom: 0 }}>
              <div className="pill-row">
                <Badge tone="brand">Total today: {today.total}</Badge>
                <Badge tone="warning">Pending: {today.pending}</Badge>
                <Badge tone="info">
                  Under review: {today.items.filter((item) => item.status === 'under_review').length}
                </Badge>
                <Badge tone="success">Approved: {today.items.filter((item) => item.status === 'approved').length}</Badge>
              </div>
            </div>
            <div className="table-wrap" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Received</th>
                    <th>Application no.</th>
                    <th>Applicant</th>
                    <th>Type</th>
                    <th>Scholarship</th>
                    <th>District</th>
                    <th>Requested</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {today.items.map((application) => (
                    <tr key={application._id}>
                      <td className="nowrap">{formatDateTime(application.createdAt).split(',')[1] || formatDate(application.createdAt)}</td>
                      <td className="table__strong nowrap">{application.applicationNo}</td>
                      <td>
                        <span className="table__strong">{application.personal?.fullName}</span>
                        <span className="table__sub">{application.personal?.email}</span>
                      </td>
                      <td>
                        <Badge tone={application.applicantType === 'school' ? 'info' : 'brand'}>
                          {application.applicantType === 'school' ? 'School' : 'University'}
                        </Badge>
                      </td>
                      <td>{application.scholarshipTitle}</td>
                      <td>{application.personal?.district}</td>
                      <td className="nowrap">{application.financial?.requestedAmount ? formatMoney(application.financial.requestedAmount) : '—'}</td>
                      <td>
                        <StatusBadge status={application.status} />
                      </td>
                      <td>
                        <Link to={`/admin/applications/${application._id}`} className="btn btn--sm btn--outline">
                          Verify
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ------------------------------------------------------- charts & lists */}
      <div className="grid grid--sidebar page-section">
        <div className="stack">
          <div className="card">
            <div className="card__head--row">
              <h3 className="mb-0">Applications in the last 6 months</h3>
            </div>
            <div className="card__body">
              {stats === null ? (
                <Loading label="Loading trend…" />
              ) : (
                <div className="bar-chart">
                  {stats.trend.map((item) => (
                    <div key={item.key} className="bar-chart__item">
                      <span className="bar-chart__value">{item.count}</span>
                      <div
                        className="bar-chart__bar"
                        style={{ height: `${Math.max(4, (item.count / maxTrend) * 100)}%` }}
                        title={`${item.count} application(s) in ${item.label}`}
                      />
                      <span className="bar-chart__label">{item.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card__head--row">
              <h3 className="mb-0">Latest applications</h3>
              <Link to="/admin/applications" className="btn btn--ghost btn--sm">
                View all
              </Link>
            </div>
            <div className="table-wrap" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Applicant</th>
                    <th>Scholarship</th>
                    <th>Submitted</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.recentApplications || []).map((application) => (
                    <tr key={application._id}>
                      <td className="table__strong">
                        <Link to={`/admin/applications/${application._id}`}>{application.applicationNo}</Link>
                      </td>
                      <td>{application.personal?.fullName}</td>
                      <td>{application.scholarshipTitle}</td>
                      <td className="nowrap">{formatDate(application.createdAt)}</td>
                      <td>
                        <StatusBadge status={application.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card__head--row">
              <h3 className="mb-0">Upcoming events</h3>
              <Link to="/admin/events" className="btn btn--ghost btn--sm">
                Manage events
              </Link>
            </div>
            <div className="card__body">
              <div className="stack stack--sm">
                {(stats?.upcomingEventsPreview || []).length === 0 ? (
                  <p className="text-muted text-small mb-0">No upcoming events. Create one from the Events screen.</p>
                ) : (
                  stats.upcomingEventsPreview.map((event) => (
                    <div key={event._id} className="tile flex flex--between flex--wrap">
                      <div style={{ minWidth: 0 }}>
                        <strong>{event.title}</strong>
                        <div className="text-small text-muted">
                          {formatDate(event.date)} · {event.venue} · {event.volunteersNeeded || 0} volunteers needed
                        </div>
                      </div>
                      <Link to={`/admin/events/${event._id}/edit`} className="btn btn--ghost btn--sm">
                        Edit
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <aside className="stack">
          <div className="card">
            <div className="card__body">
              <h3>Status breakdown</h3>
              {(stats?.statusBreakdown || []).map((item) => {
                const total = Math.max(1, stats?.totals.applications || 1);
                return (
                  <div key={item.key} className="mb-2">
                    <div className="flex flex--between">
                      <span className="text-small">{item.label}</span>
                      <strong className="text-small">{item.value}</strong>
                    </div>
                    <div className="meter">
                      <div className="meter__fill" style={{ width: `${(item.value / total) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="card__head--row">
              <h3 className="mb-0">Volunteers awaiting approval</h3>
              <Link to="/admin/volunteers" className="btn btn--ghost btn--sm">
                All
              </Link>
            </div>
            <div className="card__body">
              {pendingVolunteers.length === 0 ? (
                <p className="text-muted text-small mb-0">No pending volunteer registrations. 🎉</p>
              ) : (
                <div className="stack stack--sm">
                  {pendingVolunteers.map((record) => (
                    <div key={record._id} className="tile">
                      <strong className="text-small">{record.fullName}</strong>
                      <div className="text-small text-muted">
                        {record.role} · {record.eventTitle}
                      </div>
                      <div className="text-small text-muted">{formatDate(record.createdAt)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card__body">
              <h3>System</h3>
              <div className="kv-list">
                <div className="detail-row">
                  <span className="detail-row__label">Database</span>
                  <span className="detail-row__value">{system?.database?.kind === 'memory' ? 'Dev store' : 'MongoDB'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-row__label">Email mode</span>
                  <span className="detail-row__value">{system?.mail?.mode === 'smtp' ? 'SMTP (live)' : 'Outbox (dev)'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-row__label">Scholarships</span>
                  <span className="detail-row__value">{system?.counts?.scholarships ?? '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-row__label">Events</span>
                  <span className="detail-row__value">{system?.counts?.events ?? '—'}</span>
                </div>
              </div>
              <Link to="/admin/system" className="btn btn--outline btn--block mt-2">
                System details
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
