import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/AppShell.jsx';
import { adminLinks } from '../../components/navLinks.js';
import { eventsApi } from '../../api/client.js';
import { useSite } from '../../context/SiteContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Alert, Badge, EmptyState, Loading, Modal, StatusBadge, formatDate } from '../../components/ui.jsx';

export default function AdminEvents() {
  const site = useSite();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ scope: 'all', type: '', status: '', q: '' });
  const [volunteers, setVolunteers] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setData(null);
    eventsApi
      .list({ ...filters, limit: 100 })
      .then((result) => setData(result.items))
      .catch((err) => setError(err.message));
  }, [filters]);

  useEffect(load, [load]);

  const remove = async (event) => {
    if (!window.confirm(`Delete "${event.title}"? Volunteer registrations will also be removed.`)) return;
    try {
      await eventsApi.remove(event._id, { force: 1 });
      toast.success('Event deleted', event.title);
      load();
    } catch (err) {
      toast.error('Could not delete the event', err.message);
    }
  };

  const notifyStudents = async (event) => {
    setBusy(true);
    try {
      const result = await eventsApi.notify(event._id);
      toast.success('Announcement queued', result.message);
    } catch (err) {
      toast.error('Could not send the announcement', err.message);
    } finally {
      setBusy(false);
    }
  };

  const openVolunteers = async (event) => {
    setVolunteers({ event, items: null });
    try {
      const result = await eventsApi.volunteers(event._id);
      setVolunteers({ event, items: result.volunteers });
    } catch (err) {
      toast.error('Could not load volunteers', err.message);
      setVolunteers(null);
    }
  };

  return (
    <AppShell
      links={adminLinks}
      homeLink="/admin"
      tone="admin"
      title="Events"
      subtitle="Create and manage seminars, O/L and A/L paper classes, workshops and community programmes"
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <div className="flex flex--between flex--wrap mb-2">
        <div className="filter-bar" style={{ margin: 0, flex: 1, minWidth: 280 }}>
          <div className="field">
            <label className="field__label" htmlFor="ev-q">
              Search
            </label>
            <input
              id="ev-q"
              className="input"
              placeholder="Event title"
              value={filters.q}
              onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="ev-type">
              Type
            </label>
            <select id="ev-type" className="select" value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}>
              <option value="">All types</option>
              {site.eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="ev-status">
              Status
            </label>
            <select id="ev-status" className="select" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
              <option value="">All</option>
              {site.eventStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="ev-scope">
              Timeline
            </label>
            <select id="ev-scope" className="select" value={filters.scope} onChange={(event) => setFilters((current) => ({ ...current, scope: event.target.value }))}>
              <option value="all">All events</option>
              <option value="upcoming">Upcoming only</option>
              <option value="past">Past only</option>
            </select>
          </div>
        </div>
        <Link to="/admin/events/new" className="btn">
          + New event
        </Link>
      </div>

      {data === null ? (
        <Loading label="Loading events…" />
      ) : data.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No events found"
          description="Create an event and students can register to attend or volunteer for it."
          action={
            <Link to="/admin/events/new" className="btn">
              Create an event
            </Link>
          }
        />
      ) : (
        <div className="stack">
          {data.map((event) => (
            <div key={event._id} className="card">
              <div className="card__body">
                <div className="flex flex--between flex--wrap mb-2">
                  <div style={{ minWidth: 0 }}>
                    <div className="pill-row mb-1">
                      <Badge tone="brand">{event.type}</Badge>
                      <StatusBadge status={event.status} />
                      <Badge tone="muted">📅 {formatDate(event.date)}</Badge>
                      <Badge tone="muted">📍 {event.district}</Badge>
                      <Badge tone={event.volunteerCount > 0 ? 'success' : 'warning'}>
                        🤝 {event.volunteerCount || 0} / {event.volunteersNeeded || '∞'} volunteers
                      </Badge>
                    </div>
                    <h3 style={{ marginBottom: 4 }}>{event.title}</h3>
                    <p className="text-small text-muted mb-0">
                      {event.venue} {event.startTime ? `· ${event.startTime}${event.endTime ? ` – ${event.endTime}` : ''}` : ''}
                    </p>
                  </div>
                </div>

                <p className="text-small">{String(event.description || '').slice(0, 220)}{String(event.description || '').length > 220 ? '…' : ''}</p>

                <div className="btn-row">
                  <Link to={`/admin/events/${event._id}/edit`} className="btn btn--sm">
                    ✏️ Edit
                  </Link>
                  <button type="button" className="btn btn--outline btn--sm" onClick={() => openVolunteers(event)}>
                    🤝 View volunteers
                  </button>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => notifyStudents(event)} disabled={busy}>
                    📢 Email students
                  </button>
                  <Link to={`/events/${event._id}`} className="btn btn--ghost btn--sm" target="_blank">
                    👁 Public page
                  </Link>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => remove(event)}>
                    🗑 Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(volunteers)}
        title={`Volunteers · ${volunteers?.event?.title || ''}`}
        onClose={() => setVolunteers(null)}
        wide
      >
        {volunteers?.items === null ? (
          <Loading label="Loading volunteers…" />
        ) : (volunteers?.items || []).length === 0 ? (
          <p className="text-muted">No volunteers have registered for this event yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Availability</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {volunteers.items.map((record) => (
                  <tr key={record._id}>
                    <td className="table__strong nowrap">{record.registrationNo}</td>
                    <td>
                      {record.fullName}
                      <span className="table__sub">{record.district}</span>
                    </td>
                    <td>
                      {record.phone}
                      <span className="table__sub">{record.email}</span>
                    </td>
                    <td>{record.role}</td>
                    <td>{record.availability}</td>
                    <td>
                      <StatusBadge status={record.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="modal__foot" style={{ border: 'none', background: 'none', padding: '16px 0 0' }}>
          <Link to="/admin/volunteers" className="btn btn--outline btn--sm">
            Manage all volunteers
          </Link>
        </div>
      </Modal>
    </AppShell>
  );
}
