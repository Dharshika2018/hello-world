import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { scholarshipsApi } from '../../api/client.js';
import ScholarshipCard from '../../components/ScholarshipCard.jsx';
import { Alert, EmptyState, Loading, SectionHead } from '../../components/ui.jsx';

export default function Scholarships() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    q: params.get('q') || '',
    category: params.get('category') || '',
    status: params.get('status') || 'open',
  });

  const query = useMemo(
    () => ({ q: filters.q || undefined, category: filters.category || undefined, status: filters.status || undefined, limit: 50 }),
    [filters]
  );

  useEffect(() => {
    let active = true;
    setData(null);
    scholarshipsApi
      .list(query)
      .then((result) => active && setData(result.items))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setError((current) => current));
    return () => {
      active = false;
    };
  }, [query]);

  const apply = (event) => {
    event.preventDefault();
    const next = {};
    if (filters.q) next.q = filters.q;
    if (filters.category) next.category = filters.category;
    if (filters.status) next.status = filters.status;
    setParams(next);
  };

  return (
    <>
      <section className="section--tight section--brand" style={{ paddingBottom: 46, paddingTop: 46 }}>
        <div className="container">
          <span className="eyebrow eyebrow--accent">Scholarship programmes</span>
          <h1 style={{ marginBottom: 10 }}>Find the right scholarship for you</h1>
          <p className="lead">
            We offer separate programmes for school students preparing for the O/L examination and for university
            undergraduates. Each programme has its own eligibility rules, award value and closing date.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <form className="filter-bar" onSubmit={apply}>
            <div className="field">
              <label className="field__label" htmlFor="q">
                Search
              </label>
              <input
                id="q"
                className="input"
                placeholder="e.g. mathematics, STEM, undergraduate"
                value={filters.q}
                onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
              />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="category">
                Student type
              </label>
              <select
                id="category"
                className="select"
                value={filters.category}
                onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
              >
                <option value="">All students</option>
                <option value="school">School students</option>
                <option value="university">University students</option>
              </select>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="status">
                Status
              </label>
              <select
                id="status"
                className="select"
                value={filters.status}
                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              >
                <option value="">Any status</option>
                <option value="open">Open for applications</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="filter-bar__actions">
              <button type="submit" className="btn">
                Filter
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setFilters({ q: '', category: '', status: '' });
                  setParams({});
                }}
              >
                Reset
              </button>
            </div>
          </form>

          {error ? <Alert tone="danger">{error}</Alert> : null}

          {data === null ? (
            <Loading label="Loading scholarships…" />
          ) : data.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="No scholarships match your filters"
              description="Try removing a filter, or create an account to be notified when the next intake opens."
              action={
                <Link to="/register" className="btn">
                  Create an account
                </Link>
              }
            />
          ) : (
            <>
              <p className="text-muted text-small mb-2">{data.length} programme(s) found</p>
              <div className="grid grid--3">
                {data.map((scholarship) => (
                  <ScholarshipCard key={scholarship._id} scholarship={scholarship} actionLabel="Apply / details" />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="section section--alt">
        <div className="container">
          <SectionHead
            center
            eyebrow="Before you apply"
            title="Documents you will need"
            description="Keep scanned copies ready as PDF, JPG or PNG (max 5MB each). Applications without the required documents cannot be verified."
          />
          <div className="grid grid--3">
            {[
              { icon: '🪪', title: 'NIC or birth certificate', text: 'Required for every applicant - the number must match your application.' },
              { icon: '📄', title: 'Results sheet', text: 'O/L results for school applicants, A/L results for university applicants.' },
              { icon: '🏠', title: 'Income proof', text: 'Grama Niladhari certificate or a bank statement showing household income.' },
            ].map((item) => (
              <div key={item.title} className="card">
                <div className="card__body">
                  <div className="feature-icon">{item.icon}</div>
                  <h3>{item.title}</h3>
                  <p style={{ margin: 0 }}>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
