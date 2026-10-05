import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AppShell from '../../components/AppShell.jsx';
import { adminLinks } from '../../components/navLinks.js';
import { eventsApi } from '../../api/client.js';
import { useSite } from '../../context/SiteContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Alert, Checkbox, Loading, Select, TextArea, TextInput } from '../../components/ui.jsx';

const blank = {
  title: '',
  type: 'O/L Seminar',
  status: 'upcoming',
  date: '',
  endDate: '',
  startTime: '08:30',
  endTime: '12:30',
  venue: '',
  district: '',
  audience: '',
  description: '',
  organiser: 'Scholarship Foundation',
  contactPerson: '',
  contactPhone: '',
  contactEmail: '',
  volunteersNeeded: 10,
  rolesNeeded: [],
  requirements: '',
  capacity: '',
  registrationDeadline: '',
  featured: false,
  imageUrl: '',
  agenda: [{ time: '', title: '' }],
  notifyStudents: false,
};

export default function AdminEventForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const site = useSite();
  const toast = useToast();

  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(editing);

  useEffect(() => {
    if (!editing) return;
    eventsApi
      .get(id)
      .then(({ event }) => {
        setForm({
          ...blank,
          ...event,
          rolesNeeded: event.rolesNeeded || [],
          requirements: (event.requirements || []).join('\n'),
          agenda: event.agenda?.length ? event.agenda : [{ time: '', title: '' }],
        });
        setLoading(false);
      })
      .catch((err) => {
        setNotice(err.message);
        setLoading(false);
      });
  }, [id, editing]);

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
    setBusy(true);
    setNotice('');
    setErrors({});
    try {
      const payload = {
        ...form,
        volunteersNeeded: form.volunteersNeeded === '' ? undefined : Number(form.volunteersNeeded),
        capacity: form.capacity === '' ? undefined : Number(form.capacity),
        agenda: form.agenda.filter((item) => item.time || item.title),
      };
      const result = editing ? await eventsApi.update(id, payload) : await eventsApi.create(payload);
      toast.success(
        editing ? 'Event updated' : 'Event created',
        !editing && result.notified ? `${result.notified} student(s) were emailed about the event.` : result.event.title
      );
      navigate('/admin/events');
    } catch (error) {
      setErrors(error.errors || {});
      setNotice(error.message);
      toast.error('Could not save the event', error.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <AppShell links={adminLinks} homeLink="/admin" tone="admin" title="Event">
        <Loading label="Loading event…" />
      </AppShell>
    );
  }

  return (
    <AppShell
      links={adminLinks}
      homeLink="/admin"
      tone="admin"
      title={editing ? 'Edit event' : 'Create an event'}
      subtitle="Published events appear on the public events page and in the student dashboard"
    >
      {notice ? (
        <Alert tone="danger" title="Please check the form">
          {notice}
        </Alert>
      ) : null}

      <form onSubmit={submit} className="grid grid--form">
        <div className="stack">
          <fieldset className="fieldset">
            <legend className="fieldset__legend">Event details</legend>
            <div className="form-grid">
              <TextInput
                label="Event title"
                required
                className="span-2"
                placeholder="e.g. O/L Mathematics Paper Class - Colombo"
                value={form.title}
                error={errors.title}
                onChange={(event) => update('title', event.target.value)}
              />
              <Select
                label="Event type"
                required
                options={site.eventTypes}
                value={form.type}
                error={errors.type}
                onChange={(event) => update('type', event.target.value)}
              />
              <Select
                label="Status"
                options={[
                  { value: 'draft', label: 'Draft (hidden)' },
                  { value: 'upcoming', label: 'Upcoming' },
                  { value: 'ongoing', label: 'Ongoing' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
                value={form.status}
                onChange={(event) => update('status', event.target.value)}
              />
              <TextArea
                label="Description"
                required
                className="span-2"
                rows={5}
                value={form.description}
                error={errors.description}
                onChange={(event) => update('description', event.target.value)}
              />
              <TextInput
                label="Target audience"
                placeholder="e.g. Grade 10 and 11 students"
                value={form.audience}
                onChange={(event) => update('audience', event.target.value)}
              />
              <TextInput
                label="Organised by"
                value={form.organiser}
                onChange={(event) => update('organiser', event.target.value)}
              />
            </div>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset__legend">When &amp; where</legend>
            <div className="form-grid">
              <TextInput
                label="Event date"
                required
                type="date"
                value={form.date}
                error={errors.date}
                onChange={(event) => update('date', event.target.value)}
              />
              <TextInput
                label="End date (multi-day events)"
                type="date"
                value={form.endDate}
                onChange={(event) => update('endDate', event.target.value)}
              />
              <TextInput
                label="Start time"
                placeholder="08:30"
                value={form.startTime}
                onChange={(event) => update('startTime', event.target.value)}
              />
              <TextInput
                label="End time"
                placeholder="12:30"
                value={form.endTime}
                onChange={(event) => update('endTime', event.target.value)}
              />
              <TextInput
                label="Venue"
                required
                className="span-2"
                placeholder="e.g. Nalanda College Auditorium"
                value={form.venue}
                error={errors.venue}
                onChange={(event) => update('venue', event.target.value)}
              />
              <Select
                label="District"
                required
                placeholder="Select the district"
                options={site.districts}
                value={form.district}
                error={errors.district}
                onChange={(event) => update('district', event.target.value)}
              />
              <TextInput
                label="Participant capacity"
                type="number"
                min="0"
                value={form.capacity}
                onChange={(event) => update('capacity', event.target.value)}
              />
            </div>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset__legend">Volunteers</legend>
            <div className="form-grid">
              <TextInput
                label="Number of volunteers needed"
                type="number"
                min="0"
                value={form.volunteersNeeded}
                onChange={(event) => update('volunteersNeeded', event.target.value)}
              />
              <TextInput
                label="Volunteer registration deadline"
                type="date"
                value={form.registrationDeadline}
                onChange={(event) => update('registrationDeadline', event.target.value)}
              />
            </div>

            <div className="mt-2">
              <span className="field__label">Roles needed</span>
              <div className="checkbox-grid mt-1">
                {site.volunteerRoles.map((role) => (
                  <Checkbox
                    key={role}
                    label={role}
                    checked={form.rolesNeeded.includes(role)}
                    onChange={() =>
                      update(
                        'rolesNeeded',
                        form.rolesNeeded.includes(role)
                          ? form.rolesNeeded.filter((item) => item !== role)
                          : [...form.rolesNeeded, role]
                      )
                    }
                  />
                ))}
              </div>
            </div>

            <TextArea
              label="What we ask of volunteers (one per line)"
              className="mt-2"
              rows={3}
              placeholder={'Arrive 45 minutes early for the briefing\nFull day availability'}
              value={form.requirements}
              onChange={(event) => update('requirements', event.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset__legend">Programme / agenda</legend>
            <div className="stack stack--sm">
              {form.agenda.map((item, index) => (
                <div key={index} className="flex" style={{ gap: 10 }}>
                  <input
                    className="input"
                    style={{ maxWidth: 130 }}
                    placeholder="08:30"
                    value={item.time}
                    onChange={(event) =>
                      update(
                        'agenda',
                        form.agenda.map((row, rowIndex) => (rowIndex === index ? { ...row, time: event.target.value } : row))
                      )
                    }
                  />
                  <input
                    className="input"
                    placeholder="Session description"
                    value={item.title}
                    onChange={(event) =>
                      update(
                        'agenda',
                        form.agenda.map((row, rowIndex) => (rowIndex === index ? { ...row, title: event.target.value } : row))
                      )
                    }
                  />
                  <button
                    type="button"
                    className="btn btn--ghost btn--icon"
                    onClick={() => update('agenda', form.agenda.filter((_, rowIndex) => rowIndex !== index))}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn--outline btn--sm"
                style={{ alignSelf: 'flex-start' }}
                onClick={() => update('agenda', [...form.agenda, { time: '', title: '' }])}
              >
                + Add agenda item
              </button>
            </div>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset__legend">Contact &amp; notifications</legend>
            <div className="form-grid">
              <TextInput label="Contact person" value={form.contactPerson} onChange={(event) => update('contactPerson', event.target.value)} />
              <TextInput label="Contact phone" value={form.contactPhone} onChange={(event) => update('contactPhone', event.target.value)} />
              <TextInput
                label="Contact email"
                type="email"
                value={form.contactEmail}
                error={errors.contactEmail}
                onChange={(event) => update('contactEmail', event.target.value)}
              />
              <TextInput label="Cover image URL" placeholder="Optional" value={form.imageUrl} onChange={(event) => update('imageUrl', event.target.value)} />
              <div className="span-2">
                <Checkbox
                  label="Feature this event on the home page"
                  checked={form.featured}
                  onChange={(event) => update('featured', event.target.checked)}
                />
                <div className="mt-1">
                  <Checkbox
                    label="Email every student about this event now"
                    description="Sends an announcement email + in-app notification to all student accounts."
                    checked={form.notifyStudents}
                    onChange={(event) => update('notifyStudents', event.target.checked)}
                  />
                </div>
              </div>
            </div>
          </fieldset>

          <div className="btn-row">
            <button type="submit" className="btn btn--lg" disabled={busy}>
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Create event'}
            </button>
            <Link to="/admin/events" className="btn btn--ghost btn--lg">
              Cancel
            </Link>
          </div>
        </div>

        <aside className="stack">
          <div className="card">
            <div className="card__body">
              <h3>Preview</h3>
              <div className="tile">
                <div className="pill-row mb-1">
                  <span className="badge badge--brand">{form.type}</span>
                  <span className="badge badge--muted">{form.status}</span>
                </div>
                <strong>{form.title || 'Event title'}</strong>
                <div className="text-small text-muted">
                  {form.date || 'date'} {form.startTime ? `· ${form.startTime}` : ''} · {form.venue || 'venue'}
                </div>
                {form.rolesNeeded.length ? (
                  <div className="chips mt-1">
                    {form.rolesNeeded.map((role) => (
                      <span key={role} className="chip chip--brand">
                        {role}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card__body">
              <h3>Volunteer workflow</h3>
              <ol className="text-small">
                <li>Students register from the events page.</li>
                <li>The registration appears under <strong>Volunteers</strong> as pending.</li>
                <li>Approve or decline it there - the student is emailed automatically.</li>
              </ol>
            </div>
          </div>
        </aside>
      </form>
    </AppShell>
  );
}
