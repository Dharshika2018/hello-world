import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/AppShell.jsx';
import { studentLinks } from '../../components/navLinks.js';
import { applicationsApi } from '../../api/client.js';
import { Alert, EmptyState, Loading, StatusBadge, formatDate } from '../../components/ui.jsx';

export default function MyApplications() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    applicationsApi
      .mine()
      .then((data) => setItems(data.items))
      .catch((err) => setError(err.message));
  }, []);

  const loading = items === null;

  return (
    <AppShell
      links={studentLinks}
      homeLink="/dashboard"
      title="My applications"
      subtitle="Track the verification progress of every scholarship application you have submitted"
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <div className="flex flex--between flex--wrap mb-2">
        <div className="pill-row">
          <span className="badge badge--muted">Total: {items?.length || 0}</span>
          <span className="badge badge--success">Approved: {(items || []).filter((item) => item.status === 'approved').length}</span>
          <span className="badge badge--warning">Pending: {(items || []).filter((item) => item.status === 'pending').length}</span>
        </div>
        <Link to="/dashboard/apply" className="btn btn--sm">
          + New application
        </Link>
      </div>

      {loading ? (
        <Loading label="Loading your applications…" />
      ) : items.length === 0 ? (
        <EmptyState
          icon="📄"
          title="No applications yet"
          description="Once you submit a scholarship application it will appear here with its live verification status."
          action={
            <Link to="/dashboard/apply" className="btn">
              Start an application
            </Link>
          }
        />
      ) : (
        <div className="stack">
          {items.map((application) => (
            <div key={application._id} className="card">
              <div className="card__body">
                <div className="flex flex--between flex--wrap mb-2">
                  <div>
                    <h3 style={{ marginBottom: 4 }}>{application.scholarshipTitle}</h3>
                    <div className="text-small text-muted">
                      Reference <strong>{application.applicationNo}</strong> · submitted {formatDate(application.createdAt)} ·{' '}
                      {application.applicantType === 'school' ? 'School student' : 'University student'}
                    </div>
                  </div>
                  <StatusBadge status={application.status} />
                </div>

                <div className="grid grid--4">
                  <MiniStat label="Amount requested" value={application.financial?.requestedAmount ? `LKR ${Number(application.financial.requestedAmount).toLocaleString()}` : '—'} />
                  <MiniStat label="School / Institute" value={application.education?.schoolName || application.education?.universityName || '—'} />
                  <MiniStat label="Documents" value={`${Object.keys(application.documents || {}).length} uploaded`} />
                  <MiniStat label="Last update" value={formatDate(application.updatedAt)} />
                </div>

                {application.admin?.note ? (
                  <div className="alert alert--info mt-2" style={{ marginBottom: 0 }}>
                    <div>
                      <strong>Note from our team:</strong> {application.admin.note}
                    </div>
                  </div>
                ) : null}

                <div className="btn-row mt-2">
                  <Link to={`/dashboard/applications/${application._id}`} className="btn btn--sm">
                    View full application
                  </Link>
                  {application.status === 'rejected' ? (
                    <Link to="/dashboard/apply" className="btn btn--outline btn--sm">
                      Apply again
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="tile">
      <div className="text-small text-muted">{label}</div>
      <strong>{value}</strong>
    </div>
  );
}
