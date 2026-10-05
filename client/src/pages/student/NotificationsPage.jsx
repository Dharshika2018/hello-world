import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/AppShell.jsx';
import { studentLinks } from '../../components/navLinks.js';
import { notificationsApi } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Alert, EmptyState, Loading, formatDateTime } from '../../components/ui.jsx';

export default function NotificationsPage() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  const load = () =>
    notificationsApi
      .list({ limit: 80 })
      .then((data) => setItems(data.items))
      .catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  const markAll = async () => {
    try {
      const result = await notificationsApi.markAllRead();
      toast.success('All caught up', result.message);
      load();
    } catch (err) {
      toast.error('Could not update notifications', err.message);
    }
  };

  const markOne = async (id) => {
    await notificationsApi.markRead(id);
    load();
  };

  const remove = async (id) => {
    await notificationsApi.remove(id);
    load();
  };

  return (
    <AppShell
      links={studentLinks}
      homeLink="/dashboard"
      title="Notifications"
      subtitle="Application decisions, volunteer confirmations and announcements"
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <div className="flex flex--between flex--wrap mb-2">
        <span className="badge badge--muted">{(items || []).filter((item) => !item.read).length} unread</span>
        <div className="btn-row">
          <button type="button" className="btn btn--outline btn--sm" onClick={markAll} disabled={!items?.some((item) => !item.read)}>
            Mark all as read
          </button>
          <Link to="/dashboard" className="btn btn--ghost btn--sm">
            Back to dashboard
          </Link>
        </div>
      </div>

      {items === null ? (
        <Loading label="Loading notifications…" />
      ) : items.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="No notifications yet"
          description="You will be notified here and by email whenever your application status changes or a new event is announced."
        />
      ) : (
        <div className="stack stack--sm">
          {items.map((note) => (
            <div key={note._id} className={`tile ${note.read ? '' : 'card--hover'}`} style={note.read ? {} : { borderLeft: '4px solid var(--brand-500)' }}>
              <div className="flex flex--between flex--wrap">
                <div style={{ minWidth: 0 }}>
                  <div className="pill-row mb-1">
                    <span className={`badge badge--${note.type === 'success' ? 'success' : note.type === 'danger' ? 'danger' : note.type === 'warning' ? 'warning' : 'info'}`}>
                      {note.type}
                    </span>
                    {!note.read ? <span className="badge badge--brand">New</span> : null}
                  </div>
                  <strong>{note.title}</strong>
                  <div className="text-small text-muted">{note.message}</div>
                  <div className="text-small text-muted">{formatDateTime(note.createdAt)}</div>
                </div>
                <div className="btn-row">
                  {note.link ? (
                    <Link to={note.link} className="btn btn--sm btn--outline" onClick={() => markOne(note._id)}>
                      Open
                    </Link>
                  ) : null}
                  {!note.read ? (
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => markOne(note._id)}>
                      Mark read
                    </button>
                  ) : null}
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => remove(note._id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
