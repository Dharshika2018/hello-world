import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/AppShell.jsx';
import { studentLinks } from '../../components/navLinks.js';
import { volunteersApi } from '../../api/client.js';
import { Alert, DetailRow, EmptyState, Loading, StatusBadge, StatCard, formatDate } from '../../components/ui.jsx';

export default function MyVolunteering() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    volunteersApi
      .mine()
      .then((data) => setItems(data.items))
      .catch((err) => setError(err.message));
  }, []);

  if (items === null && !error) {
    return (
      <AppShell links={studentLinks} homeLink="/dashboard" title="My volunteer records">
        <Loading label="Loading your volunteer registrations…" />
      </AppShell>
    );
  }

  return (
    <AppShell
      links={studentLinks}
      homeLink="/dashboard"
      title="My volunteer records"
      subtitle="Every event you registered for, with confirmation status from our coordinators"
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <div className="stat-grid page-section">
        <StatCard icon="🤝" value={items?.length || 0} label="Total registrations" />
        <StatCard icon="✅" value={(items || []).filter((item) => item.status === 'approved').length} label="Confirmed" tone="success" />
        <StatCard icon="⏳" value={(items || []).filter((item) => item.status === 'pending').length} label="Awaiting confirmation" tone="info" />
        <StatCard icon="📅" value={(items || []).filter((item) => item.eventDate >= new Date().toISOString().slice(0, 10)).length} label="Upcoming events" tone="accent" />
      </div>

      {(items || []).length === 0 ? (
        <EmptyState
          icon="🙋"
          title="You have not volunteered yet"
          description="Our seminars, paper classes and community programmes need volunteers for registration, logistics, teaching and mentoring."
          action={
            <Link to="/dashboard/volunteer" className="btn">
              Browse upcoming events
            </Link>
          }
        />
      ) : (
        <div className="stack">
          {items.map((record) => (
            <div key={record._id} className="card">
              <div className="card__body">
                <div className="flex flex--between flex--wrap mb-2">
                  <div>
                    <h3 style={{ marginBottom: 4 }}>{record.eventTitle}</h3>
                    <div className="text-small text-muted">
                      {formatDate(record.eventDate)} · {record.eventVenue} · reference <strong>{record.registrationNo}</strong>
                    </div>
                  </div>
                  <StatusBadge status={record.status} />
                </div>

                <div className="detail-grid">
                  <div>
                    <DetailRow label="Role" value={record.role} />
                    <DetailRow label="Availability" value={record.availability} />
                  </div>
                  <div>
                    <DetailRow label="Registered on" value={formatDate(record.createdAt)} />
                    <DetailRow label="Reviewed by" value={record.admin?.reviewedBy} />
                  </div>
                </div>

                {record.admin?.note ? (
                  <div className="alert alert--info mt-2" style={{ marginBottom: 0 }}>
                    <div>
                      <strong>Note from the coordinator:</strong> {record.admin.note}
                    </div>
                  </div>
                ) : null}

                {record.status === 'approved' ? (
                  <div className="alert alert--success mt-2" style={{ marginBottom: 0 }}>
                    <div>You are confirmed. Please arrive 30 minutes before the start time with your NIC.</div>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
