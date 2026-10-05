import { Link } from 'react-router-dom';
import { Badge, StatusBadge, formatDate, daysUntil } from './ui.jsx';

export default function EventCard({ event, to, children }) {
  const date = new Date(`${event.date}T00:00:00`);
  const valid = !Number.isNaN(date.getTime());
  const left = daysUntil(event.date);

  return (
    <article className="event-card">
      <div className="event-card__date">
        <b>{valid ? date.getDate() : '—'}</b>
        <span>{valid ? date.toLocaleString('en-GB', { month: 'short' }) : ''}</span>
      </div>

      <div className="event-card__body" style={{ flex: 1 }}>
        <div className="pill-row mb-1">
          <Badge tone="brand">{event.type}</Badge>
          <StatusBadge status={event.status} />
          {event.featured ? <Badge tone="warning">Featured</Badge> : null}
          {left !== null && left >= 0 && event.status === 'upcoming' ? (
            <Badge tone={left <= 3 ? 'danger' : 'success'}>{left === 0 ? 'Today' : `In ${left} day${left === 1 ? '' : 's'}`}</Badge>
          ) : null}
        </div>

        <h3>
          <Link to={to || `/events/${event._id}`}>{event.title}</Link>
        </h3>
        <p style={{ margin: 0 }}>{String(event.description || '').slice(0, 190)}{String(event.description || '').length > 190 ? '…' : ''}</p>

        <div className="event-card__meta">
          <span>🕘 {event.startTime ? `${event.startTime}${event.endTime ? ` – ${event.endTime}` : ''}` : 'Time on registration'}</span>
          <span>📍 {event.venue}</span>
          <span>🗺️ {event.district}</span>
          {event.volunteersNeeded ? <span>🤝 {event.volunteersNeeded} volunteers needed</span> : null}
          <span>📅 {formatDate(event.date)}</span>
        </div>

        {children ? <div className="mt-2 flex flex--wrap">{children}</div> : null}
      </div>
    </article>
  );
}
