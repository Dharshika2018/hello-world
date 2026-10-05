import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { eventsApi } from '../../api/client.js';
import EventCard from '../../components/EventCard.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Alert, Badge, DetailRow, Loading, StatusBadge, daysUntil, formatDate } from '../../components/ui.jsx';

export default function EventDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    eventsApi
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
          <Alert tone="danger" title="Event not available">
            {error}
          </Alert>
          <Link to="/events" className="btn btn--outline">
            ← Back to events
          </Link>
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="section">
        <Loading label="Loading event…" />
      </section>
    );
  }

  const { event, volunteerCount, related } = data;
  const closed = ['completed', 'cancelled'].includes(event.status);
  const left = daysUntil(event.registrationDeadline || event.date);

  return (
    <>
      <section className="section--brand" style={{ padding: '42px 0 52px' }}>
        <div className="container">
          <div className="breadcrumb" style={{ color: 'rgba(255,255,255,.7)' }}>
            <Link to="/" style={{ color: 'rgba(255,255,255,.85)' }}>
              Home
            </Link>
            <span>/</span>
            <Link to="/events" style={{ color: 'rgba(255,255,255,.85)' }}>
              Events
            </Link>
            <span>/</span>
            <span>{event.title}</span>
          </div>
          <div className="pill-row mb-2">
            <Badge tone="brand">{event.type}</Badge>
            <StatusBadge status={event.status} />
            {event.audience ? <Badge tone="muted">🎯 {event.audience}</Badge> : null}
          </div>
          <h1 style={{ maxWidth: '26ch' }}>{event.title}</h1>
          <p className="lead">
            📅 {formatDate(event.date)}
            {event.startTime ? ` · 🕘 ${event.startTime}${event.endTime ? ` – ${event.endTime}` : ''}` : ''} · 📍 {event.venue}, {event.district}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container grid grid--form">
          <div className="stack">
            <div className="card">
              <div className="card__head--row">
                <h3 className="mb-0">About this event</h3>
                <span className="badge badge--muted">🤝 {volunteerCount} volunteer(s)</span>
              </div>
              <div className="card__body">
                <p style={{ whiteSpace: 'pre-line' }}>{event.description}</p>

                {event.agenda?.length ? (
                  <>
                    <h4 className="mt-3">Programme</h4>
                    <ul className="timeline">
                      {event.agenda.map((item) => (
                        <li key={`${item.time}-${item.title}`}>
                          <div className="timeline__time">{item.time}</div>
                          <div className="timeline__title">{item.title}</div>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}

                {event.rolesNeeded?.length ? (
                  <>
                    <h4 className="mt-3">Volunteer roles needed</h4>
                    <div className="chips">
                      {[...new Set(event.rolesNeeded)].map((role) => (
                        <span key={role} className="chip chip--brand">
                          {role}
                        </span>
                      ))}
                    </div>
                  </>
                ) : null}

                {event.requirements?.length ? (
                  <>
                    <h4 className="mt-3">What we ask of volunteers</h4>
                    <ul className="check-list">
                      {event.requirements.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>
            </div>

            {related?.length ? (
              <div className="card">
                <div className="card__head--row">
                  <h3 className="mb-0">Other upcoming events</h3>
                </div>
                <div className="card__body stack">
                  {related.map((item) => (
                    <EventCard key={item._id} event={item} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <aside className="stack">
            <div className="card">
              <div className="card__body">
                <h3>Event details</h3>
                <div className="kv-list">
                  <DetailRow label="Date" value={formatDate(event.date)} />
                  <DetailRow label="Time" value={event.startTime ? `${event.startTime}${event.endTime ? ` – ${event.endTime}` : ''}` : 'To be confirmed'} />
                  <DetailRow label="Venue" value={event.venue} />
                  <DetailRow label="District" value={event.district} />
                  <DetailRow label="Target audience" value={event.audience} />
                  <DetailRow label="Volunteers needed" value={event.volunteersNeeded} />
                  <DetailRow label="Participant capacity" value={event.capacity} />
                  <DetailRow label="Volunteer registration closes" value={formatDate(event.registrationDeadline)} />
                  <DetailRow label="Organised by" value={event.organiser} />
                  <DetailRow label="Contact" value={event.contactPerson} />
                  <DetailRow label="Phone" value={event.contactPhone} />
                  <DetailRow label="Email" value={event.contactEmail} />
                </div>

                <button
                  type="button"
                  className="btn btn--block mt-2"
                  disabled={closed}
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast.info('Sign in to volunteer', 'Create a free account or sign in to register as a volunteer.');
                      navigate('/login', { state: { from: `/dashboard/volunteer?event=${event._id}` } });
                      return;
                    }
                    navigate(`/dashboard/volunteer?event=${event._id}`);
                  }}
                >
                  {closed ? 'This event has ended' : 'Register as a volunteer'}
                </button>
                {!closed && left !== null && left >= 0 ? (
                  <p className="field__hint text-center mt-1 mb-0">
                    {left === 0 ? 'Registration closes today' : `Registration closes in ${left} day(s)`}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="card">
              <div className="card__body">
                <h3>Students: attend for free</h3>
                <p style={{ fontSize: '0.92rem' }}>
                  Participation is free for all students. Bring your school ID or NIC and arrive 15 minutes before the
                  start time.
                </p>
                <Link to="/scholarships" className="btn btn--outline btn--block">
                  Explore scholarships
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
