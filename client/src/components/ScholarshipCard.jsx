import { Link } from 'react-router-dom';
import { Badge, StatusBadge, daysUntil, formatDate } from './ui.jsx';

export default function ScholarshipCard({ scholarship, actionLabel = 'View details', actionTo }) {
  const left = daysUntil(scholarship.deadline);
  const closed = scholarship.status === 'closed' || (left !== null && left < 0);

  return (
    <article className="scholarship-card">
      <div className="scholarship-card__top">
        <div>
          <div className="pill-row mb-1">
            <Badge tone="brand">{scholarship.category === 'school' ? 'School students' : 'University students'}</Badge>
            {scholarship.featured ? <Badge tone="warning">Featured</Badge> : null}
          </div>
          <h3>{scholarship.title}</h3>
        </div>
        <StatusBadge status={scholarship.status} />
      </div>

      <p style={{ margin: 0 }}>{scholarship.shortDescription}</p>

      {scholarship.benefits?.length ? (
        <div className="chips">
          {scholarship.benefits.slice(0, 2).map((benefit) => (
            <span key={benefit} className="chip chip--brand">
              ★ {benefit}
            </span>
          ))}
        </div>
      ) : null}

      <div className="scholarship-card__meta">
        <div>
          <b>{scholarship.awardAmount || 'See details'}</b>
          Award value
        </div>
        <div>
          <b>{formatDate(scholarship.deadline)}</b>
          Deadline
        </div>
        <div>
          <b>{scholarship.seats ? `${scholarship.seats} awards` : 'Limited'}</b>
          Available
        </div>
      </div>

      <div className="flex flex--between">
        {left !== null && !closed ? (
          <span className={`badge badge--${left <= 7 ? 'danger' : 'success'}`}>
            {left === 0 ? 'Closes today' : `${left} day${left === 1 ? '' : 's'} left`}
          </span>
        ) : (
          <span className="badge badge--muted">Closed</span>
        )}
        <Link to={actionTo || `/scholarships/${scholarship._id}`} className="btn btn--sm">
          {actionLabel} →
        </Link>
      </div>
    </article>
  );
}
