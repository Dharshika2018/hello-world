import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/AppShell.jsx';
import { adminLinks } from '../../components/navLinks.js';
import { adminApi, applicationsApi, scholarshipsApi } from '../../api/client.js';
import { useSite } from '../../context/SiteContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Alert,
  Badge,
  EmptyState,
  Loading,
  Modal,
  Pagination,
  Select,
  StatusBadge,
  TextArea,
  formatDate,
  formatDateTime,
  formatMoney,
} from '../../components/ui.jsx';

export default function AdminApplications() {
  const site = useSite();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [scholarships, setScholarships] = useState([]);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    q: '',
    status: '',
    applicantType: '',
    scholarshipId: '',
    district: '',
    date: '',
  });
  const [decision, setDecision] = useState(null);
  const [decisionForm, setDecisionForm] = useState({ status: '', adminNote: '', notify: true });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setData(null);
    applicationsApi
      .adminList({ ...filters, page, limit: 15 })
      .then(setData)
      .catch((err) => setError(err.message));
  }, [filters, page]);

  useEffect(load, [load]);

  useEffect(() => {
    scholarshipsApi
      .list({ includeDrafts: 1, limit: 100 })
      .then((result) => setScholarships(result.items))
      .catch(() => {});
    adminApi.system().catch(() => {});
  }, []);

  const submitDecision = async () => {
    if (!decisionForm.status) {
      toast.warning('Choose a status', 'Select the new status for this application.');
      return;
    }
    setBusy(true);
    try {
      const result = await applicationsApi.setStatus(decision._id, decisionForm);
      toast.success(
        `Application ${decision.applicationNo} marked as ${result.application.statusLabel}`,
        result.notified ? `Email queued to ${result.email?.to}` : 'No email was sent (notifications disabled).'
      );
      setDecision(null);
      load();
    } catch (err) {
      toast.error('Could not update the application', err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (application) => {
    if (!window.confirm(`Delete application ${application.applicationNo}? This cannot be undone.`)) return;
    try {
      await applicationsApi.remove(application._id);
      toast.success('Application deleted', `${application.applicationNo} was removed.`);
      load();
    } catch (err) {
      toast.error('Could not delete', err.message);
    }
  };

  const exportCsv = () => {
    window.open(applicationsApi.exportUrl({ ...filters }), '_blank');
  };

  return (
    <AppShell
      links={adminLinks}
      homeLink="/admin"
      tone="admin"
      title="Scholarship applications"
      subtitle="Verify documents, approve or reject applications - students are notified by email automatically"
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <div className="filter-bar">
        <div className="field">
          <label className="field__label" htmlFor="apps-q">
            Search
          </label>
          <input
            id="apps-q"
            className="input"
            placeholder="Reference, name, NIC, email or phone"
            value={filters.q}
            onChange={(event) => {
              setPage(1);
              setFilters((current) => ({ ...current, q: event.target.value }));
            }}
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="apps-status">
            Status
          </label>
          <select
            id="apps-status"
            className="select"
            value={filters.status}
            onChange={(event) => {
              setPage(1);
              setFilters((current) => ({ ...current, status: event.target.value }));
            }}
          >
            <option value="">Any status</option>
            <option value="pending">Pending review</option>
            <option value="under_review">Under review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="apps-type">
            Applicant type
          </label>
          <select
            id="apps-type"
            className="select"
            value={filters.applicantType}
            onChange={(event) => {
              setPage(1);
              setFilters((current) => ({ ...current, applicantType: event.target.value }));
            }}
          >
            <option value="">All students</option>
            <option value="school">School students</option>
            <option value="university">University students</option>
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="apps-scholarship">
            Scholarship
          </label>
          <select
            id="apps-scholarship"
            className="select"
            value={filters.scholarshipId}
            onChange={(event) => {
              setPage(1);
              setFilters((current) => ({ ...current, scholarshipId: event.target.value }));
            }}
          >
            <option value="">All programmes</option>
            {scholarships.map((scholarship) => (
              <option key={scholarship._id} value={scholarship._id}>
                {scholarship.title}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="apps-date">
            Submitted on
          </label>
          <input
            id="apps-date"
            type="date"
            className="input"
            value={filters.date}
            onChange={(event) => {
              setPage(1);
              setFilters((current) => ({ ...current, date: event.target.value }));
            }}
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="apps-district">
            District
          </label>
          <select
            id="apps-district"
            className="select"
            value={filters.district}
            onChange={(event) => {
              setPage(1);
              setFilters((current) => ({ ...current, district: event.target.value }));
            }}
          >
            <option value="">All districts</option>
            {site.districts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-bar__actions">
          <button type="button" className="btn btn--ghost" onClick={() => setFilters({ q: '', status: '', applicantType: '', scholarshipId: '', district: '', date: '' })}>
            Reset
          </button>
          <button type="button" className="btn btn--outline" onClick={exportCsv}>
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {data === null ? (
        <Loading label="Loading applications…" />
      ) : data.items.length === 0 ? (
        <EmptyState icon="📥" title="No applications match your filters" description="Adjust the filters above or wait for new submissions." />
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Applicant</th>
                  <th>Type</th>
                  <th>Scholarship</th>
                  <th>Requested</th>
                  <th>Submitted</th>
                  <th>Documents</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((application) => (
                  <tr key={application._id}>
                    <td className="table__strong nowrap">
                      <Link to={`/admin/applications/${application._id}`}>{application.applicationNo}</Link>
                    </td>
                    <td>
                      <span className="table__strong">{application.personal?.fullName}</span>
                      <span className="table__sub">
                        {application.personal?.district} · {application.personal?.phone}
                      </span>
                    </td>
                    <td>
                      <Badge tone={application.applicantType === 'school' ? 'info' : 'brand'}>
                        {application.applicantType === 'school' ? 'School' : 'University'}
                      </Badge>
                    </td>
                    <td>{application.scholarshipTitle}</td>
                    <td className="nowrap">{application.financial?.requestedAmount ? formatMoney(application.financial.requestedAmount) : '—'}</td>
                    <td className="nowrap">{formatDate(application.createdAt)}</td>
                    <td>
                      <Badge tone={Object.keys(application.documents || {}).length >= 2 ? 'success' : 'warning'}>
                        {Object.keys(application.documents || {}).length} file(s)
                      </Badge>
                    </td>
                    <td>
                      <StatusBadge status={application.status} />
                    </td>
                    <td>
                      <div className="table__actions">
                        <Link to={`/admin/applications/${application._id}`} className="btn btn--ghost btn--sm">
                          View
                        </Link>
                        <button
                          type="button"
                          className="btn btn--sm"
                          onClick={() => {
                            setDecision(application);
                            setDecisionForm({ status: application.status === 'pending' ? 'approved' : 'under_review', adminNote: '', notify: true });
                          }}
                        >
                          Update
                        </button>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => remove(application)}>
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
        open={Boolean(decision)}
        title={`Verify application ${decision?.applicationNo || ''}`}
        onClose={() => setDecision(null)}
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setDecision(null)}>
              Cancel
            </button>
            <button type="button" className="btn" onClick={submitDecision} disabled={busy}>
              {busy ? 'Saving…' : 'Save & notify student'}
            </button>
          </>
        }
      >
        {decision ? (
          <div className="stack">
            <div className="tile">
              <strong>{decision.personal?.fullName}</strong>
              <div className="text-small text-muted">
                {decision.scholarshipTitle} · {decision.applicantType} · submitted {formatDateTime(decision.createdAt)}
              </div>
              <div className="text-small text-muted">
                Requested: {formatMoney(decision.financial?.requestedAmount)} · Household income:{' '}
                {formatMoney(decision.household?.monthlyIncome)}
              </div>
            </div>

            <Select
              label="New status"
              required
              value={decisionForm.status}
              onChange={(event) => setDecisionForm((current) => ({ ...current, status: event.target.value }))}
              options={[
                { value: 'pending', label: 'Pending review' },
                { value: 'under_review', label: 'Under review' },
                { value: 'approved', label: '✅ Approved' },
                { value: 'rejected', label: '❌ Rejected' },
              ]}
            />

            <TextArea
              label="Note to the student (included in the email)"
              rows={4}
              placeholder={
                decisionForm.status === 'approved'
                  ? 'Documents verified with the Grama Niladhari. Approved for the monthly grant.'
                  : decisionForm.status === 'rejected'
                    ? 'Household income exceeds the programme ceiling for this intake.'
                    : 'Documents received, verification in progress.'
              }
              value={decisionForm.adminNote}
              onChange={(event) => setDecisionForm((current) => ({ ...current, adminNote: event.target.value }))}
            />

            <label className="checkbox">
              <input
                type="checkbox"
                checked={decisionForm.notify}
                onChange={(event) => setDecisionForm((current) => ({ ...current, notify: event.target.checked }))}
              />
              <span>
                Notify the student by email and in-app notification
                <span className="field__hint" style={{ display: 'block' }}>
                  Recommended - this is how students learn about the decision.
                </span>
              </span>
            </label>

            {decisionForm.status === 'approved' ? (
              <Alert tone="success" title="Approval email">
                The student receives a congratulations email that includes the award details and next steps.
              </Alert>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </AppShell>
  );
}
