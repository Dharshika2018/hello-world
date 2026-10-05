import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppShell from '../../components/AppShell.jsx';
import { studentLinks } from '../../components/navLinks.js';
import { eventsApi, volunteersApi } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Alert,
  Checkbox,
  EmptyState,
  Loading,
  Select,
  TextArea,
  TextInput,
  formatDate,
} from '../../components/ui.jsx';

const emptyForm = {
  eventId: '',
  fullName: '',
  email: '',
  phone: '',
  nic: '',
  district: '',
  occupation: '',
  role: '',
  availability: '',
  experience: '',
  motivation: '',
  emergencyName: '',
  emergencyPhone: '',
  emergencyRelationship: '',
  declaration: false,
};

export default function VolunteerEvents() {
  const { user } = useAuth();
  const site = useSite();
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  const [events, setEvents] = useState(null);
  const [mine, setMine] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState({ scope: 'upcoming', type: '', q: '' });

  const selectedEventId = params.get('event') || '';

  const load = () => {
    eventsApi
      .list({ scope: filter.scope, type: filter.type || undefined, q: filter.q || undefined, limit: 60 })
      .then((data) => setEvents(data.items))
      .catch(() => setEvents([]));
    volunteersApi
      .mine()
      .then((data) => setMine(data.items))
      .catch(() => setMine([]));
  };

  useEffect(load, [filter.scope, filter.type, filter.q]);

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      fullName: current.fullName || user.name || '',
      email: current.email || user.email || '',
      phone: current.phone || user.phone || '',
      nic: current.nic || user.nic || '',
      district: current.district || user.district || '',
    }));
  }, [user]);

  useEffect(() => {
    if (selectedEventId) {
      setForm((current) => ({ ...current, eventId: selectedEventId }));
      const element = document.getElementById('volunteer-form');
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedEventId, events]);

  const selectedEvent = useMemo(
    () => (events || []).find((event) => event._id === form.eventId),
    [events, form.eventId]
  );

  const alreadyRegistered = useMemo(
    () => mine.find((record) => record.eventId === form.eventId),
    [mine, form.eventId]
  );

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    const found = {};
    if (!form.eventId) found.eventId = 'Select the event you want to volunteer for';
    if (!form.fullName || form.fullName.trim().length < 3) found.fullName = 'Enter your full name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) found.email = 'Enter a valid email address';
    if (!/^(\+94[0-9]{9}|0[0-9]{9})$/.test(form.phone.replace(/[\s-]/g, ''))) found.phone = 'Use a number such as 0771234567';
    if (!/^([0-9]{9}[vVxX]|[0-9]{12})$/.test(form.nic.trim())) found.nic = 'Use 9 digits + V/X or the 12 digit NIC';
    if (!form.district) found.district = 'Select your district';
    if (!form.role) found.role = 'Select the role you prefer';
    if (!form.availability) found.availability = 'Tell us when you are available';
    if (form.motivation.trim().length < 30) found.motivation = 'Write at least a sentence (30 characters) about why you want to volunteer';
    if (!form.emergencyName) found.emergencyName = 'Emergency contact name is required';
    if (!form.emergencyPhone) found.emergencyPhone = 'Emergency contact number is required';
    if (!form.declaration) found.declaration = 'Please accept the volunteer declaration';
    if (alreadyRegistered) found.eventId = `You have already registered for this event (${alreadyRegistered.registrationNo})`;

    setErrors(found);
    if (Object.keys(found).length) {
      setNotice('Please correct the highlighted fields.');
      return;
    }

    setBusy(true);
    setNotice('');
    try {
      const result = await volunteersApi.register(form);
      toast.success('Volunteer registration submitted 🤝', `Reference ${result.volunteer.registrationNo} · we emailed a confirmation to you.`);
      setForm({ ...emptyForm, fullName: user?.name || '', email: user?.email || '', phone: user?.phone || '', nic: user?.nic || '', district: user?.district || '' });
      setParams({});
      load();
    } catch (error) {
      setErrors(error.errors || {});
      setNotice(error.message);
      toast.error('Could not register you', error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell
      links={studentLinks}
      homeLink="/dashboard"
      title="Events & volunteer sign-up"
      subtitle="Seminars, O/L and A/L paper classes, career guidance and community programmes"
    >
      <div className="card mb-3">
        <div className="card__head--row">
          <h3 className="mb-0">Upcoming events</h3>
          <div className="btn-row">
            <span className="badge badge--muted">{(events || []).length} event(s)</span>
          </div>
        </div>
        <div className="card__body">
          <div className="filter-bar" style={{ marginBottom: 18 }}>
            <div className="field">
              <label className="field__label" htmlFor="vol-q">
                Search events
              </label>
              <input
                id="vol-q"
                className="input"
                placeholder="e.g. mathematics, Kandy"
                value={filter.q}
                onChange={(event) => setFilter((current) => ({ ...current, q: event.target.value }))}
              />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="vol-type">
                Event type
              </label>
              <select
                id="vol-type"
                className="select"
                value={filter.type}
                onChange={(event) => setFilter((current) => ({ ...current, type: event.target.value }))}
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
              <label className="field__label" htmlFor="vol-scope">
                Show
              </label>
              <select
                id="vol-scope"
                className="select"
                value={filter.scope}
                onChange={(event) => setFilter((current) => ({ ...current, scope: event.target.value }))}
              >
                <option value="upcoming">Upcoming only</option>
                <option value="past">Past events</option>
                <option value="all">All events</option>
              </select>
            </div>
          </div>

          {events === null ? (
            <Loading label="Loading events…" />
          ) : events.length === 0 ? (
            <EmptyState icon="📅" title="No events found" description="Try a different filter - new events are added every month." />
          ) : (
            <div className="stack stack--sm">
              {events.map((oneEvent) => {
                const registered = mine.find((record) => record.eventId === oneEvent._id);
                return (
                  <div key={oneEvent._id} className="tile">
                    <div className="flex flex--between flex--wrap">
                      <div style={{ minWidth: 0 }}>
                        <div className="pill-row mb-1">
                          <span className="badge badge--brand">{oneEvent.type}</span>
                          <span className="badge badge--muted">{formatDate(oneEvent.date)}</span>
                          {registered ? <span className={`badge badge--${registered.status === 'approved' ? 'success' : registered.status === 'rejected' ? 'danger' : 'warning'}`}>You: {registered.status}</span> : null}
                        </div>
                        <strong>{oneEvent.title}</strong>
                        <div className="text-small text-muted">
                          📍 {oneEvent.venue}, {oneEvent.district} · 🕘 {oneEvent.startTime || 'TBC'} · 🤝{' '}
                          {oneEvent.volunteerCount || 0}/{oneEvent.volunteersNeeded || '∞'} volunteers
                        </div>
                      </div>
                      <div className="btn-row">
                        <button
                          type="button"
                          className="btn btn--sm"
                          disabled={Boolean(registered) || ['completed', 'cancelled'].includes(oneEvent.status)}
                          onClick={() => {
                            update('eventId', oneEvent._id);
                            setParams({ event: oneEvent._id });
                            document.getElementById('volunteer-form')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          {registered ? 'Registered' : ['completed', 'cancelled'].includes(oneEvent.status) ? 'Event ended' : 'Volunteer for this'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------ sign-up form */}
      <div className="card" id="volunteer-form">
        <div className="card__head--row">
          <h3 className="mb-0">Volunteer registration form</h3>
          <span className="badge badge--brand">Step 2 · your details</span>
        </div>
        <div className="card__body">
          {notice ? (
            <Alert tone="danger" title="Please check the form">
              {notice}
            </Alert>
          ) : null}

          <form onSubmit={submit} className="form-grid">
            <Select
              label="Event"
              required
              className="span-2"
              placeholder="Select the event you want to volunteer for"
              value={form.eventId}
              error={errors.eventId}
              onChange={(event) => {
                update('eventId', event.target.value);
                setParams(event.target.value ? { event: event.target.value } : {});
              }}
            >
              {(events || []).map((oneEvent) => (
                <option key={oneEvent._id} value={oneEvent._id}>
                  {oneEvent.title} · {formatDate(oneEvent.date)} · {oneEvent.district}
                </option>
              ))}
            </Select>

            {selectedEvent ? (
              <div className="tile span-2">
                <strong>{selectedEvent.title}</strong>
                <div className="text-small text-muted">
                  {formatDate(selectedEvent.date)} {selectedEvent.startTime ? `· ${selectedEvent.startTime}` : ''} ·{' '}
                  {selectedEvent.venue}, {selectedEvent.district}
                </div>
                {selectedEvent.rolesNeeded?.length ? (
                  <div className="chips mt-1">
                    {[...new Set(selectedEvent.rolesNeeded)].map((role) => (
                      <span key={role} className="chip chip--brand">
                        {role}
                      </span>
                    ))}
                  </div>
                ) : null}
                {selectedEvent.registrationDeadline ? (
                  <div className="field__hint">Volunteer registration closes on {formatDate(selectedEvent.registrationDeadline)}</div>
                ) : null}
              </div>
            ) : null}

            <TextInput
              label="Full name"
              required
              value={form.fullName}
              error={errors.fullName}
              onChange={(event) => update('fullName', event.target.value)}
            />
            <TextInput
              label="Email address"
              required
              type="email"
              value={form.email}
              error={errors.email}
              onChange={(event) => update('email', event.target.value)}
            />
            <TextInput
              label="Mobile number"
              required
              placeholder="0771234567"
              value={form.phone}
              error={errors.phone}
              onChange={(event) => update('phone', event.target.value)}
            />
            <TextInput
              label="NIC number"
              required
              placeholder="200312345678 or 991234567V"
              hint="Used to verify your identity on event day"
              value={form.nic}
              error={errors.nic}
              onChange={(event) => update('nic', event.target.value)}
            />
            <Select
              label="District"
              required
              placeholder="Select your district"
              options={site.districts}
              value={form.district}
              error={errors.district}
              onChange={(event) => update('district', event.target.value)}
            />
            <TextInput
              label="School / university / occupation"
              placeholder="e.g. 2nd year undergraduate, NSBM"
              value={form.occupation}
              onChange={(event) => update('occupation', event.target.value)}
            />
            <Select
              label="Preferred volunteer role"
              required
              placeholder="Select a role"
              options={site.volunteerRoles}
              value={form.role}
              error={errors.role}
              onChange={(event) => update('role', event.target.value)}
            />
            <Select
              label="Availability on event day"
              required
              placeholder="Select"
              options={site.availabilityOptions}
              value={form.availability}
              error={errors.availability}
              onChange={(event) => update('availability', event.target.value)}
            />
            <TextArea
              label="Previous volunteering experience"
              className="span-2"
              rows={3}
              placeholder="Optional - tell us about any similar work"
              value={form.experience}
              onChange={(event) => update('experience', event.target.value)}
            />
            <TextArea
              label="Why do you want to volunteer with us?"
              required
              className="span-2"
              rows={4}
              value={form.motivation}
              error={errors.motivation}
              onChange={(event) => update('motivation', event.target.value)}
            />

            <TextInput
              label="Emergency contact name"
              required
              value={form.emergencyName}
              error={errors.emergencyName}
              onChange={(event) => update('emergencyName', event.target.value)}
            />
            <TextInput
              label="Emergency contact number"
              required
              value={form.emergencyPhone}
              error={errors.emergencyPhone}
              onChange={(event) => update('emergencyPhone', event.target.value)}
            />
            <TextInput
              label="Emergency contact relationship"
              placeholder="e.g. Parent"
              value={form.emergencyRelationship}
              onChange={(event) => update('emergencyRelationship', event.target.value)}
            />

            <div className="span-2">
              <Checkbox
                label="I agree to follow the foundation's volunteer code of conduct and to attend the briefing before the event."
                checked={form.declaration}
                onChange={(event) => update('declaration', event.target.checked)}
              />
              {errors.declaration ? <span className="field__error">{errors.declaration}</span> : null}
            </div>

            <div className="span-2 btn-row">
              <button type="submit" className="btn btn--accent btn--lg" disabled={busy}>
                {busy ? 'Submitting…' : 'Submit volunteer registration'}
              </button>
              <a href="#volunteer-form" className="btn btn--ghost" onClick={() => setForm({ ...emptyForm })}>
                Clear form
              </a>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
