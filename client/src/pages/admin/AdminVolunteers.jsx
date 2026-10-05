import { useCallback, useEffect, useState } from 'react';
import AppShell from '../../components/AppShell.jsx';
import { adminLinks } from '../../components/navLinks.js';
import { eventsApi, volunteersApi } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Alert,
  Badge,
  DetailRow,
  EmptyState,
  Loading,
  Modal,
  Pagination,
  StatusBadge,
  TextArea,
  formatDate,
  formatDateTime,
} from '../../components/ui.jsx';

export default function AdminVolunteers() {
  const toast = useToast();

  const [data, setData] = useState(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ q: '', status: 'pending', eventId: '' });
  const [detail, setDetail] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setData(null);
    volunteersApi
      .adminList({ ...filters, page, limit: 15 })
      .then(setData)
      .catch((err) => setError(err.message));
  }, [filters, page]);

  useEffect(load, [load]);

  useEffect(() => {
    eventsApi
      .list({ scope: 'all', limit: 100 })
      .then((result) => setEvents(result.items))
      .catch(() => {});
  }, []);

  const openDetail = async (record) => {
    setDetail({ record, full: null });
    setNote(record.admin?.note || '');
    try {
      const result = await volunteersApi.adminOne(record._id);
      setDetail({ record: result.volunteer, full: result });
    } catch (err) {
      toast.error('Could not load the registration', err.message);
    }
  };

  const decide = async (status) => {
    setBusy(true);
    try {
      const result = await volunteersApi.setStatus(detail.record._id, { status, adminNote: note, notify: true });
      toast.success(
        `Volunteer marked as ${result.volunteer.status}`,
        result.notified ? `Confirmation email queued to ${detail.record.email}` : 'Student was not notified.'
      );
      setDetail(null);
      load();
    } catch (err) {
      toast.error('Could not update the registration', err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (record) => {
    if (!window.confirm(`Delete volunteer registration ${record.registrationNo}?`)) return;
    try {
      await volunteersApi.remove(record._id);
      toast.success('Registration deleted', record.registrationNo);
      load();
    } catch (err) {
      toast.error('Could not delete the registration', err.message);
    }
  };

  return (
    <AppShell
      links={adminLinks}
      homeLink="/admin"
      tone="admin"
      title="Volunteers"
      subtitle="Approve or decline volunteer registrations for seminars, paper classes and community events"
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <div className="filter-bar">
        <div className="field">
          <label className="field__label" htmlFor="vol-q">
            Search
          </label>
          <input
            id="vol-q"
            className="input"
            placeholder="Name, email, phone or event"
            value={filters.q}
            onChange={(event) => {
              setPage(1);
              setFilters((current) => ({ ...current, q: event.target.value }));
            }}
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="vol-status">
            Status
          </label>
          <select
            id="vol-status"
            className="select"
            value={filters.status}
            onChange={(event) => {
              setPage(1);
              setFilters((current) => ({ ...current, status: event.target.value }));
            }}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Confirmed</option>
            <option value="rejected">Not confirmed</option>
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="vol-event">
            Event
          </label>
          <select
            id="vol-event"
            className="select"
            value={filters.eventId}
            onChange={(event) => {
              setPage(1);
              setFilters((current) => ({ ...current, eventId: event.target.value }));
            }}
          >
            <option value="">All events</option>
            {events.map((event) => (
              <option key={event._id} value={event._id}>
                {event.title}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-bar__actions">
          <button type="button" className="btn btn--ghost" onClick={() => setFilters({ q: '', status: '', eventId: '' })}>
            Reset
          </button>
        </div>
      </div>

      {data === null ? (
        <Loading label="Loading volunteer registrations…" />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon="🤝"
          title="No volunteer registrations found"
          description="Registrations appear here as soon as students sign up for an event."
        />
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Volunteer</th>
                  <th>Event</th>
                  <th>Role</th>
                  <th>Availability</th>
                  <th>Registered</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((record) => (
                  <tr key={record._id}>
                    <td className="table__strong nowrap">{record.registrationNo}</td>
                    <td>
                      <span className="table__strong">{record.fullName}</span>
                      <span className="table__sub">
                        {record.district} · {record.phone}
                      </span>
                    </td>
                    <td>
                      {record.eventTitle}
                      <span className="table__sub">{formatDate(record.eventDate)}</span>
                    </td>
                    <td>{record.role}</td>
                    <td>{record.availability}</td>
                    <td className="nowrap">{formatDate(record.createdAt)}</td>
                    <td>
                      <StatusBadge status={record.status} />
                    </td>
                    <td>
                      <div className="table__actions">
                        <button type="button" className="btn btn--sm" onClick={() => openDetail(record)}>
                          Review
                        </button>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => remove(record)}>
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

      <Modal
        open={Boolean(detail)}
        title={`Volunteer registration ${detail?.record?.registrationNo || ''}`}
        onClose={() => setDetail(null)}
        wide
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setDetail(null)}>
              Close
            </button>
            <button type="button" className="btn btn--danger" disabled={busy} onClick={() => decide('rejected')}>
              Decline
            </button>
            <button type="button" className="btn btn--success" disabled={busy} onClick={() => decide('approved')}>
              ✅ Confirm volunteer
            </button>
          </>
        }
      >
        {detail ? (
          <div className="stack">
            <div className="pill-row">
              <StatusBadge status={detail.record.status} />
              <Badge tone="brand">🤝 {detail.record.eventTitle}</Badge>
              <Badge tone="muted">📅 {formatDate(detail.record.eventDate)}</Badge>
              <Badge tone="muted">📍 {detail.record.eventVenue}</Badge>
            </div>

            <div className="detail-grid">
              <div>
                <DetailRow label="Full name" value={detail.record.fullName} />
                <DetailRow label="Email" value={detail.record.email} />
                <DetailRow label="Phone" value={detail.record.phone} />
                <DetailRow label="NIC" value={detail.record.nic} />
                <DetailRow label="District" value={detail.record.district} />
                <DetailRow label="School / occupation" value={detail.record.occupation} />
              </div>
              <div>
                <DetailRow label="Preferred role" value={detail.record.role} />
                <DetailRow label="Availability" value={detail.record.availability} />
                <DetailRow label="Emergency contact" value={`${detail.record.emergencyName || ''} ${detail.record.emergencyPhone || ''}`} />
                <DetailRow label="Relationship" value={detail.record.emergencyRelationship} />
                <DetailRow label="Registered at" value={formatDateTime(detail.record.createdAt)} />
                <DetailRow label="Declaration accepted" value={detail.record.declaration ? 'Yes' : 'No'} />
              </div>
            </div>

            <div>
              <h4>Why they want to volunteer</h4>
              <p className="text-small">{detail.record.motivation}</p>
              {detail.record.experience ? (
                <>
                  <h4>Previous experience</h4>
                  <p className="text-small">{detail.record.experience}</p>
                </>
              ) : null}
            </div>

            <TextArea
              label="Note to the volunteer (sent in the email)"
              rows={3}
              placeholder="e.g. Confirmed - report at 7:45am for the briefing and bring your NIC."
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
        ) : null}
      </Modal>
    </AppShell>
  );
}
