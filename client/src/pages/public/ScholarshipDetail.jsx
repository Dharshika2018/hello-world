import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { scholarshipsApi } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Alert, Badge, DetailRow, Loading, StatusBadge, daysUntil, formatDate } from '../../components/ui.jsx';

export default function ScholarshipDetail() {
  const { id } = useParams();
  const { isAuthenticated, isStudent } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    scholarshipsApi
      .get(id)
      .then((result) => active && setData(result))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [id]);

  if (error) {
    return (
      <section className="section">
        <div className="container">
          <Alert tone="danger" title="Scholarship not available">
            {error}
          </Alert>
          <Link to="/scholarships" className="btn btn--outline">
            ← Back to scholarships
          </Link>
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="section">
        <Loading label="Loading scholarship…" />
      </section>
    );
  }

  const { scholarship, stats } = data;
  const left = daysUntil(scholarship.deadline);
  const open = scholarship.status === 'open' && (left === null || left >= 0);

  const handleApply = () => {
    if (!isAuthenticated) {
      toast.info('Create an account first', 'Sign in or register to apply for scholarships.');
      navigate('/login', { state: { from: `/dashboard/apply/${scholarship._id}` } });
      return;
    }
    if (!isStudent) {
      toast.warning('Administrator account', 'Admin accounts cannot submit student applications.');
      return;
    }
    navigate(`/dashboard/apply/${scholarship._id}`);
  };

  return (
    <>
      <section className="section--brand" style={{ padding: '42px 0 52px' }}>
        <div className="container">
          <div className="breadcrumb" style={{ color: 'rgba(255,255,255,.7)' }}>
            <Link to="/" style={{ color: 'rgba(255,255,255,.85)' }}>
              Home
            </Link>
            <span>/</span>
            <Link to="/scholarships" style={{ color: 'rgba(255,255,255,.85)' }}>
              Scholarships
            </Link>
            <span>/</span>
            <span>{scholarship.title}</span>
          </div>
          <div className="pill-row mb-2">
            <Badge tone="brand">{scholarship.category === 'school' ? 'School students' : 'University students'}</Badge>
            <StatusBadge status={scholarship.status} />
            {scholarship.code ? <Badge tone="muted">{scholarship.code}</Badge> : null}
            {left !== null && open ? (
              <Badge tone={left <= 7 ? 'danger' : 'success'}>{left === 0 ? 'Closes today' : `${left} days left to apply`}</Badge>
            ) : null}
          </div>
          <h1 style={{ maxWidth: '24ch' }}>{scholarship.title}</h1>
          <p className="lead">{scholarship.shortDescription}</p>
        </div>
      </section>

      <section className="section">
        <div className="container grid grid--form">
          <div className="stack">
            <div className="card">
              <div className="card__head--row">
                <h3 className="mb-0">About this scholarship</h3>
              </div>
              <div className="card__body">
                <p style={{ whiteSpace: 'pre-line' }}>{scholarship.description}</p>

                {scholarship.eligibility ? (
                  <>
                    <h4 className="mt-3">Eligibility criteria</h4>
                    <ul>
                      {String(scholarship.eligibility)
                        .split('\n')
                        .filter(Boolean)
                        .map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                    </ul>
                  </>
                ) : null}

                {scholarship.benefits?.length ? (
                  <>
                    <h4 className="mt-3">What the award covers</h4>
                    <ul className="check-list">
                      {scholarship.benefits.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </>
                ) : null}

                {scholarship.requirements?.length ? (
                  <>
                    <h4 className="mt-3">Documents &amp; requirements</h4>
                    <ul>
                      {scholarship.requirements.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </>
                ) : null}

                {scholarship.eligibleDistricts?.length ? (
                  <>
                    <h4 className="mt-3">Eligible districts</h4>
                    <div className="chips">
                      {scholarship.eligibleDistricts.map((district) => (
                        <span key={district} className="chip">
                          {district}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="hint-note mt-3 mb-0">Open to applicants from all 25 districts of Sri Lanka.</p>
                )}
              </div>
            </div>

            {scholarship.requiredDocuments?.length ? (
              <div className="card">
                <div className="card__head--row">
                  <h3 className="mb-0">Required documents</h3>
                </div>
                <div className="card__body">
                  <ul className="check-list">
                    {scholarship.requiredDocuments.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </div>

          <aside className="stack">
            <div className="card">
              <div className="card__body">
                <h3>Award at a glance</h3>
                <div className="kv-list">
                  <DetailRow label="Award value" value={scholarship.awardAmount} />
                  <DetailRow label="Frequency" value={scholarship.awardFrequency} />
                  <DetailRow label="Duration" value={scholarship.awardDuration} />
                  <DetailRow label="Academic year" value={scholarship.academicYear} />
                  <DetailRow label="Number of awards" value={scholarship.seats} />
                  <DetailRow label="Minimum requirement" value={scholarship.minimumGpa} />
                  <DetailRow label="Applications open" value={formatDate(scholarship.applicationOpenDate)} />
                  <DetailRow label="Closing date" value={formatDate(scholarship.deadline)} />
                </div>

                <button type="button" className="btn btn--block mt-2" disabled={!open} onClick={handleApply}>
                  {open ? 'Apply for this scholarship' : 'Applications closed'}
                </button>
                {!isAuthenticated ? (
                  <p className="field__hint text-center mt-1 mb-0">
                    You will be asked to <Link to="/login">sign in</Link> or <Link to="/register">create an account</Link>.
                  </p>
                ) : null}
                {!open ? <p className="field__hint text-center mt-1 mb-0">This programme is not accepting applications at the moment.</p> : null}
              </div>
            </div>

            <div className="card">
              <div className="card__body">
                <h3>Current interest</h3>
                <div className="kv-list">
                  <DetailRow label="Applications received" value={stats?.totalApplications ?? 0} />
                  <DetailRow label="Already approved" value={stats?.approved ?? 0} />
                  <DetailRow label="Status" value={scholarship.status === 'open' ? 'Accepting applications' : 'Closed'} />
                </div>
                {scholarship.contactPerson ? (
                  <p className="hint-note mt-2 mb-0">
                    Questions? Contact {scholarship.contactPerson}
                    {scholarship.contactEmail ? ` · ${scholarship.contactEmail}` : ''}
                    {scholarship.contactPhone ? ` · ${scholarship.contactPhone}` : ''}
                  </p>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
