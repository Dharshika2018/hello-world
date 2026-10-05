import { useCallback, useEffect, useState } from 'react';
import AppShell from '../../components/AppShell.jsx';
import { adminLinks } from '../../components/navLinks.js';
import { adminApi } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Alert, Badge, EmptyState, Loading, Modal, Pagination, StatusBadge, formatDateTime } from '../../components/ui.jsx';

export default function AdminEmails() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ q: '', status: '' });
  const [preview, setPreview] = useState(null);

  const load = useCallback(() => {
    setData(null);
    adminApi
      .emails({ ...filters, page, limit: 20 })
      .then(setData)
      .catch((err) => setError(err.message));
  }, [filters, page]);

  useEffect(load, [load]);

  const openPreview = async (mail) => {
    setPreview({ loading: true });
    try {
      const result = await adminApi.email(mail._id);
      setPreview(result.email);
    } catch (err) {
      toast.error('Could not open the email', err.message);
      setPreview(null);
    }
  };

  const resend = async (mail) => {
    try {
      const result = await adminApi.resendEmail(mail._id);
      toast.success('Email re-queued', result.message);
      load();
    } catch (err) {
      toast.error('Could not resend the email', err.message);
    }
  };

  return (
    <AppShell
      links={adminLinks}
      homeLink="/admin"
      tone="admin"
      title="Email outbox"
      subtitle="Every notification the system generates - application decisions, volunteer confirmations and announcements"
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}

      {data && !data.smtpConfigured ? (
        <Alert tone="warning" title="SMTP is not configured - emails are stored in this outbox">
          This is the development mode so you can demonstrate the full approval workflow without a mail account. Add
          <code> SMTP_HOST</code>, <code>SMTP_USER</code> and <code>SMTP_PASS</code> to <code>server/.env</code> to
          deliver mail for real - every queued message will then be sent and marked as <em>sent</em>.
        </Alert>
      ) : null}

      <div className="filter-bar">
        <div className="field">
          <label className="field__label" htmlFor="mail-q">
            Search
          </label>
          <input
            id="mail-q"
            className="input"
            placeholder="Recipient, subject or template"
            value={filters.q}
            onChange={(event) => {
              setPage(1);
              setFilters((current) => ({ ...current, q: event.target.value }));
            }}
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="mail-status">
            Status
          </label>
          <select
            id="mail-status"
            className="select"
            value={filters.status}
            onChange={(event) => {
              setPage(1);
              setFilters((current) => ({ ...current, status: event.target.value }));
            }}
          >
            <option value="">All</option>
            <option value="queued">Queued (outbox)</option>
            <option value="sent">Sent via SMTP</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div className="filter-bar__actions">
          <button type="button" className="btn btn--ghost" onClick={() => setFilters({ q: '', status: '' })}>
            Reset
          </button>
          <button type="button" className="btn btn--outline" onClick={load}>
            ⟳ Refresh
          </button>
        </div>
      </div>

      {data === null ? (
        <Loading label="Loading outbox…" />
      ) : data.items.length === 0 ? (
        <EmptyState icon="✉️" title="No emails yet" description="Approve an application or confirm a volunteer and the email will appear here." />
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Sent at</th>
                  <th>To</th>
                  <th>Subject</th>
                  <th>Template</th>
                  <th>Transport</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((mail) => (
                  <tr key={mail._id}>
                    <td className="nowrap">{formatDateTime(mail.createdAt)}</td>
                    <td className="table__strong">{mail.to}</td>
                    <td>{mail.subject}</td>
                    <td>
                      <Badge tone="muted">{mail.template}</Badge>
                    </td>
                    <td>{mail.transport === 'smtp' ? 'SMTP' : 'Outbox'}</td>
                    <td>
                      <StatusBadge status={mail.status} />
                    </td>
                    <td>
                      <div className="table__actions">
                        <button type="button" className="btn btn--sm btn--outline" onClick={() => openPreview(mail)}>
                          Preview
                        </button>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => resend(mail)}>
                          {mail.transport === 'smtp' ? 'Resend' : 'Re-queue'}
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

      <Modal open={Boolean(preview)} title={preview?.subject || 'Email preview'} onClose={() => setPreview(null)} wide>
        {preview?.loading ? (
          <Loading label="Loading email…" />
        ) : (
          <div className="stack">
            <div className="pill-row">
              <Badge tone="brand">To: {preview?.to}</Badge>
              <StatusBadge status={preview?.status} />
              <Badge tone="muted">{formatDateTime(preview?.createdAt)}</Badge>
              <Badge tone="muted">{preview?.template}</Badge>
            </div>
            <div
              className="tile"
              style={{ maxHeight: 480, overflowY: 'auto', background: '#fff' }}
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: preview?.html || '<p>No content</p>' }}
            />
            {preview?.text ? <pre className="text-small text-muted">{preview.text}</pre> : null}
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
