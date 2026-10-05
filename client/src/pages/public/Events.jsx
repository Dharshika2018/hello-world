import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { eventsApi } from '../../api/client.js';
import EventCard from '../../components/EventCard.jsx';
import { Alert, EmptyState, Loading, SectionHead } from '../../components/ui.jsx';
import { useSite } from '../../context/SiteContext.jsx';

export default function Events() {
  const site = useSite();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    scope: params.get('scope') || 'upcoming',
    type: params.get('type') || '',
    district: params.get('district') || '',
    q: params.get('q') || '',
  });

  const query = useMemo(
    () => ({
      scope: filters.scope,
      type: filters.type || undefined,
      district: filters.district || undefined,
      q: filters.q || undefined,
      limit: 60,
    }),
    [filters]
  );

  useEffect(() => {
    let active = true;
    setData(null);
    eventsApi
      .list(query)
      .then((result) => active && setData(result.items))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [query]);

  const submit = (event) => {
    event.preventDefault();
    setParams(Object.fromEntries(Object.entries(filters).filter(([, value]) => value)));
  };

  return (
    <>
      <section className="section--brand" style={{ padding: '46px 0' }}>
        <div className="container">
          <span className="eyebrow eyebrow--accent">Events &amp; volunteering</span>
          <h1 style={{ marginBottom: 10 }}>Seminars, paper classes and community programmes</h1>
          <p className="lead">
            Every programme is free for students. Volunteers can register for any event below - our coordinators verify
            each sign-up and confirm your slot by email.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="tabs">
            {[
              { key: 'upcoming', label: '📅 Upcoming events' },
              { key: 'past', label: '🗂️ Past events' },
              { key: 'all', label: '📋 All events' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`tab${filters.scope === tab.key ? ' tab--active' : ''}`}
                onClick={() => setFilters((current) => ({ ...current, scope: tab.key }))}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form className="filter-bar" onSubmit={submit}>
            <div className="field">
              <label className="field__label" htmlFor="event-q">
                Search
              </label>
              <input
                id="event-q"
                className="input"
                placeholder="e.g. mathematics paper class"
                value={filters.q}
                onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
              />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="event-type">
                Event type
              </label>
              <select
                id="event-type"
                className="select"
                value={filters.type}
                onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}
              >
                <option value="">All types</option>
                {site.eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="event-district">
                District
              </label>
              <select
                id="event-district"
                className="select"
                value={filters.district}
                onChange={(event) => setFilters((current) => ({ ...current, district: event.target.value }))}
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
              <button type="submit" className="btn">
                Filter
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setFilters({ scope: 'upcoming', type: '', district: '', q: '' })}>
                Reset
              </button>
            </div>
          </form>

          {error ? <Alert tone="danger">{error}</Alert> : null}

          {data === null ? (
            <Loading label="Loading events…" />
          ) : data.length === 0 ? (
            <EmptyState
              icon="📅"
              title="No events found"
              description="There are no events matching your filters. Check back soon or follow us on social media for announcements."
              action={
                <Link to="/dashboard/volunteer" className="btn">
                  Volunteer for a future event
                </Link>
              }
            />
          ) : (
            <>
              <p className="text-muted text-small mb-2">
                {data.length} event(s) · {filters.scope === 'past' ? 'most recent first' : 'soonest first'}
              </p>
              <div className="stack">
                {data.map((event) => (
                  <EventCard key={event._id} event={event}>
                    <span className="badge badge--muted">🤝 {event.volunteerCount || 0} volunteer(s) registered</span>
                    <Link to={`/events/${event._id}`} className="btn btn--sm btn--outline">
                      Event details
                    </Link>
                    {event.status !== 'completed' && event.status !== 'cancelled' ? (
                      <Link to={`/dashboard/volunteer?event=${event._id}`} className="btn btn--sm">
                        Volunteer for this event
                      </Link>
                    ) : null}
                  </EventCard>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="section section--alt">
        <div className="container split">
          <div>
            <SectionHead
              eyebrow="Volunteer with us"
              title="Why volunteers matter"
              description="Our paper classes and seminars are run almost entirely by volunteers - university students, teachers and professionals who give their time."
            />
            <ul className="check-list">
              <li>Teach or assist in an O/L or A/L paper class</li>
              <li>Handle student registration and crowd management</li>
              <li>Help with logistics, refreshments and hall setup</li>
              <li>Photograph and document the event for our reports</li>
              <li>Mentor scholarship students throughout the year</li>
            </ul>
            <div className="btn-row mt-3">
              <Link to="/register" className="btn">
                Create a volunteer account
              </Link>
              <Link to="/dashboard/volunteer" className="btn btn--outline">
                Volunteer registration form
              </Link>
            </div>
          </div>
          <img src="/images/events.jpg" alt="Students attending a paper class" />
        </div>
      </section>
    </>
  );
}
