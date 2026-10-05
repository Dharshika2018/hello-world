import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell.jsx';
import { studentLinks } from '../../components/navLinks.js';
import { applicationsApi, eventsApi, notificationsApi, volunteersApi } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Alert, EmptyState, Loading, StatCard, StatusBadge, formatDate } from '../../components/ui.jsx';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState(null);
  const [volunteering, setVolunteering] = useState(null);
  const [notifications, setNotifications] = useState(null);

  useEffect(() => {
    Promise.all([
      applicationsApi.mine().catch(() => ({ items: [] })),
      volunteersApi.mine().catch(() => ({ items: [] })),
      notificationsApi.list({ limit: 6 }).catch(() => ({ items: [] })),
    ]).then(([apps, vols, notes]) => {
      setApplications(apps.items);
      setVolunteering(vols.items);
      setNotifications(notes.items);
    });
  }, []);

  const loading = applications === null;
  const counts = (applications || []).reduce(
    (acc, application) => ({ ...acc, [application.status]: (acc[application.status] || 0) + 1 }),
    { pending: 0, under_review: 0, approved: 0, rejected: 0 }
  );
  const firstName = user?.name?.split(' ')[0] || 'student';

  return (
    <AppShell
      links={studentLinks}
      homeLink="/dashboard"
      title={`Welcome back, ${firstName} 👋`}
      subtitle="Your scholarship applications and volunteer activity at a glance"
    >
      <div className="stat-grid page-section">
        <StatCard icon="📄" value={(applications || []).length} label="Total applications" />
        <StatCard icon="⏳" value={counts.pending + counts.under_review} label="Awaiting decision" tone="info" />
        <StatCard icon="✅" value={counts.approved} label="Approved awards" tone="success" />
        <StatCard icon="🤝" value={(volunteering || []).length} label="Volunteer registrations" tone="accent" />
      </div>

      <div className="grid grid--sidebar page-section">
        <div className="stack">
          <div className="card">
            <div className="card__head--row">
              <h3 className="mb-0">My scholarship applications</h3>
              <Link to="/dashboard/applications" className="btn btn--ghost btn--sm">
                View all
              </Link>
            </div>
            {loading ? (
              <Loading label="Loading your applications…" />
            ) : applications.length === 0 ? (
              <div className="card__body">
                <EmptyState
                  icon="📝"
                  title="You have not applied yet"
                  description="Browse the scholarships that are open and complete the online application in six guided steps."
                  action={
                    <div className="btn-row" style={{ justifyContent: 'center' }}>
                      <Link to="/dashboard/apply" className="btn">
                        Start an application
                      </Link>
                      <Link to="/scholarships" className="btn btn--outline">
                        See programmes
                      </Link>
                    </div>
                  }
                />
              </div>
            ) : (
              <div className="card__body">
                <div className="stack stack--sm">
                  {applications.slice(0, 4).map((application) => (
                    <div key={application._id} className="tile flex flex--between flex--wrap">
                      <div style={{ minWidth: 0 }}>
                        <strong>{application.scholarshipTitle}</strong>
                        <div className="text-small text-muted">
                          {application.applicationNo} · submitted {formatDate(application.createdAt)} ·{' '}
                          {application.applicantType === 'school' ? 'School student' : 'University student'}
                        </div>
                      </div>
                      <div className="flex">
                        <StatusBadge status={application.status} />
                        <Link to={`/dashboard/applications/${application._id}`} className="btn btn--ghost btn--sm">
                          Open
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card__head--row">
              <h3 className="mb-0">Upcoming events you can join</h3>
              <Link to="/dashboard/volunteer" className="btn btn--ghost btn--sm">
                Volunteer now
              </Link>
            </div>
            <div className="card__body">
              <div className="stack stack--sm">
                <UpcomingEvents />
              </div>
            </div>
          </div>
        </div>

        <aside className="stack">
          <div className="card">
            <div className="card__body">
              <h3>Profile completeness</h3>
              <p className="text-small text-muted">
                Keep your contact details up to date so we can reach you about verification.
              </p>
              <div className="meter mb-2">
                <div className="meter__fill" style={{ width: user?.phone && user?.nic && user?.district ? '100%' : '65%' }} />
              </div>
              <div className="kv-list">
                <div className="detail-row">
                  <span className="detail-row__label">Email</span>
                  <span className="detail-row__value">{user?.email}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-row__label">Phone</span>
                  <span className="detail-row__value">{user?.phone || 'Not set'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-row__label">NIC</span>
                  <span className="detail-row__value">{user?.nic || 'Not set'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-row__label">District</span>
                  <span className="detail-row__value">{user?.district || 'Not set'}</span>
                </div>
              </div>
              <Link to="/dashboard/profile" className="btn btn--outline btn--block mt-2">
                Update profile
              </Link>
            </div>
          </div>

          <div className="card">
            <div className="card__head--row">
              <h3 className="mb-0">Notifications</h3>
              <Link to="/dashboard/notifications" className="btn btn--ghost btn--sm">
                All
              </Link>
            </div>
            <div className="card__body">
              {notifications === null ? (
                <Loading label="Loading…" />
              ) : notifications.length === 0 ? (
                <p className="text-muted text-small mb-0">No notifications yet.</p>
              ) : (
                <div className="stack stack--sm">
                  {notifications.slice(0, 4).map((note) => (
                    <div key={note._id} className="tile">
                      <strong className="text-small">{note.title}</strong>
                      <div className="text-small text-muted">{note.message?.slice(0, 110)}</div>
                      <div className="text-small text-muted">{formatDate(note.createdAt)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {counts.approved > 0 ? (
            <Alert tone="success" title="You have an approved scholarship">
              Our finance team will contact you about the disbursement schedule. Keep your bank details updated in your
              application.
            </Alert>
          ) : null}
        </aside>
      </div>
    </AppShell>
  );
}

/** Small helper that loads a few upcoming events for the dashboard. */
function UpcomingEvents() {
  const [events, setEvents] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    eventsApi
      .list({ scope: 'upcoming', limit: 3 })
      .then((data) => setEvents(data.items))
      .catch(() => setEvents([]));
  }, []);

  if (events === null) return <Loading label="Loading events…" />;
  if (events.length === 0) return <p className="text-muted text-small mb-0">No upcoming events published.</p>;

  return (
    <>
      {events.map((event) => (
        <div key={event._id} className="tile flex flex--between flex--wrap">
          <div style={{ minWidth: 0 }}>
            <strong>{event.title}</strong>
            <div className="text-small text-muted">
              {formatDate(event.date)} · {event.venue}, {event.district}
            </div>
          </div>
          <button type="button" className="btn btn--sm" onClick={() => navigate(`/dashboard/volunteer?event=${event._id}`)}>
            Volunteer
          </button>
        </div>
      ))}
    </>
  );
}
