import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AppShell from '../../components/AppShell.jsx';
import { adminLinks } from '../../components/navLinks.js';
import { scholarshipsApi } from '../../api/client.js';
import { useSite } from '../../context/SiteContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Alert, Checkbox, Loading, Select, TextArea, TextInput } from '../../components/ui.jsx';

const blank = {
  title: '',
  code: '',
  category: 'school',
  status: 'open',
  shortDescription: '',
  description: '',
  eligibility: '',
  awardAmount: '',
  awardFrequency: 'Monthly',
  awardDuration: '',
  academicYear: `${new Date().getFullYear()}`,
  applicationOpenDate: new Date().toISOString().slice(0, 10),
  deadline: '',
  seats: '',
  minimumGpa: '',
  benefits: '',
  requirements: '',
  requiredDocuments: '',
  eligibleDistricts: [],
  contactPerson: '',
  contactEmail: '',
  contactPhone: '',
  featured: false,
  imageUrl: '',
};

export default function AdminScholarshipForm() {
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
    scholarshipsApi
      .get(id)
      .then(({ scholarship }) => {
        setForm({
          ...blank,
          ...scholarship,
          benefits: (scholarship.benefits || []).join('\n'),
          requirements: (scholarship.requirements || []).join('\n'),
          requiredDocuments: (scholarship.requiredDocuments || []).join('\n'),
          eligibleDistricts: scholarship.eligibleDistricts || [],
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
        seats: form.seats === '' ? undefined : Number(form.seats),
        benefits: form.benefits,
        requirements: form.requirements,
        requiredDocuments: form.requiredDocuments,
      };
      const result = editing ? await scholarshipsApi.update(id, payload) : await scholarshipsApi.create(payload);
      toast.success(editing ? 'Scholarship updated' : 'Scholarship created', result.scholarship.title);
      navigate('/admin/scholarships');
    } catch (error) {
      setErrors(error.errors || {});
      setNotice(error.message);
      toast.error('Could not save the scholarship', error.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <AppShell links={adminLinks} homeLink="/admin" tone="admin" title="Scholarship">
        <Loading label="Loading scholarship…" />
      </AppShell>
    );
  }

  return (
    <AppShell
      links={adminLinks}
      homeLink="/admin"
      tone="admin"
      title={editing ? 'Edit scholarship' : 'Create a scholarship'}
      subtitle="Everything here appears on the public scholarship page and in the student application form"
    >
      {notice ? (
        <Alert tone="danger" title="Please check the form">
          {notice}
        </Alert>
      ) : null}

      <form onSubmit={submit} className="grid grid--form">
        <div className="stack">
          <fieldset className="fieldset">
            <legend className="fieldset__legend">Basic details</legend>
            <div className="form-grid">
              <TextInput
                label="Scholarship title"
                required
                className="span-2"
                placeholder="e.g. O/L Star School Scholarship 2026"
                value={form.title}
                error={errors.title}
                onChange={(event) => update('title', event.target.value)}
              />
              <TextInput
                label="Reference code"
                placeholder="e.g. SF-SCH-01"
                value={form.code}
                error={errors.code}
                onChange={(event) => update('code', event.target.value)}
              />
              <Select
                label="Applies to"
                required
                options={[
                  { value: 'school', label: 'School students (O/L / A/L)' },
                  { value: 'university', label: 'University / higher education students' },
                ]}
                value={form.category}
                error={errors.category}
                onChange={(event) => update('category', event.target.value)}
              />
              <Select
                label="Status"
                options={[
                  { value: 'open', label: 'Open - accepting applications' },
                  { value: 'closed', label: 'Closed - hidden from applying' },
                  { value: 'draft', label: 'Draft - not visible to students' },
                ]}
                value={form.status}
                onChange={(event) => update('status', event.target.value)}
              />
              <TextInput
                label="Academic year"
                placeholder="2026"
                value={form.academicYear}
                onChange={(event) => update('academicYear', event.target.value)}
              />
              <TextArea
                label="Short description (shown on cards)"
                required
                className="span-2"
                rows={3}
                value={form.shortDescription}
                error={errors.shortDescription}
                onChange={(event) => update('shortDescription', event.target.value)}
              />
              <TextArea
                label="Full description"
                className="span-2"
                rows={6}
                value={form.description}
                onChange={(event) => update('description', event.target.value)}
              />
              <TextArea
                label="Eligibility criteria (one per line)"
                className="span-2"
                rows={5}
                placeholder={'Following grade 10 or 11\nHousehold income below LKR 50,000\nResident in any district'}
                value={form.eligibility}
                onChange={(event) => update('eligibility', event.target.value)}
              />
            </div>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset__legend">Award &amp; timeline</legend>
            <div className="form-grid">
              <TextInput
                label="Award amount"
                placeholder="e.g. LKR 5,000 / month"
                value={form.awardAmount}
                onChange={(event) => update('awardAmount', event.target.value)}
              />
              <Select
                label="Frequency"
                options={['Monthly', 'Per academic year', 'Per semester', 'One off', 'Per instalment']}
                value={form.awardFrequency}
                onChange={(event) => update('awardFrequency', event.target.value)}
              />
              <TextInput
                label="Duration / coverage"
                placeholder="e.g. Up to 24 months until the O/L examination"
                value={form.awardDuration}
                onChange={(event) => update('awardDuration', event.target.value)}
              />
              <TextInput
                label="Number of awards"
                type="number"
                min="0"
                value={form.seats}
                error={errors.seats}
                onChange={(event) => update('seats', event.target.value)}
              />
              <TextInput
                label="Applications open on"
                type="date"
                value={form.applicationOpenDate}
                onChange={(event) => update('applicationOpenDate', event.target.value)}
              />
              <TextInput
                label="Deadline"
                required
                type="date"
                value={form.deadline}
                error={errors.deadline}
                onChange={(event) => update('deadline', event.target.value)}
              />
              <TextInput
                label="Minimum requirement"
                placeholder="e.g. Minimum 70% average in grade 10"
                value={form.minimumGpa}
                onChange={(event) => update('minimumGpa', event.target.value)}
              />
              <TextInput
                label="Cover image URL"
                placeholder="Optional"
                value={form.imageUrl}
                onChange={(event) => update('imageUrl', event.target.value)}
              />
            </div>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset__legend">Benefits & requirements</legend>
            <div className="form-grid">
              <TextArea
                label="Benefits / what the award covers (one per line)"
                className="span-2"
                rows={4}
                placeholder={'Monthly allowance of LKR 5,000\nFree entry to all paper classes\nMentorship by university students'}
                value={form.benefits}
                onChange={(event) => update('benefits', event.target.value)}
              />
              <TextArea
                label="Selection requirements (one per line)"
                className="span-2"
                rows={4}
                value={form.requirements}
                onChange={(event) => update('requirements', event.target.value)}
              />
              <TextArea
                label="Required documents (one per line)"
                className="span-2"
                rows={4}
                value={form.requiredDocuments}
                onChange={(event) => update('requiredDocuments', event.target.value)}
              />
            </div>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset__legend">Contact & visibility</legend>
            <div className="form-grid">
              <TextInput
                label="Contact person"
                value={form.contactPerson}
                onChange={(event) => update('contactPerson', event.target.value)}
              />
              <TextInput
                label="Contact email"
                type="email"
                value={form.contactEmail}
                error={errors.contactEmail}
                onChange={(event) => update('contactEmail', event.target.value)}
              />
              <TextInput
                label="Contact phone"
                value={form.contactPhone}
                onChange={(event) => update('contactPhone', event.target.value)}
              />
              <div className="field">
                <span className="field__label">Presentation</span>
                <Checkbox
                  label="Feature this scholarship on the home page"
                  checked={form.featured}
                  onChange={(event) => update('featured', event.target.checked)}
                />
              </div>
            </div>

            <div className="mt-2">
              <span className="field__label">Eligible districts (leave empty for all 25 districts)</span>
              <div className="checkbox-grid mt-1">
                {site.districts.map((district) => (
                  <Checkbox
                    key={district}
                    label={district}
                    checked={form.eligibleDistricts.includes(district)}
                    onChange={() =>
                      update(
                        'eligibleDistricts',
                        form.eligibleDistricts.includes(district)
                          ? form.eligibleDistricts.filter((item) => item !== district)
                          : [...form.eligibleDistricts, district]
                      )
                    }
                  />
                ))}
              </div>
            </div>
          </fieldset>

          <div className="btn-row">
            <button type="submit" className="btn btn--lg" disabled={busy}>
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Create scholarship'}
            </button>
            <Link to="/admin/scholarships" className="btn btn--ghost btn--lg">
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
                  <span className="badge badge--brand">{form.category === 'school' ? 'School students' : 'University students'}</span>
                  <span className={`badge badge--${form.status === 'open' ? 'success' : 'muted'}`}>{form.status}</span>
                </div>
                <strong>{form.title || 'Scholarship title'}</strong>
                <p className="text-small text-muted mt-1 mb-1">{form.shortDescription || 'Short description appears here.'}</p>
                <div className="chips">
                  <span className="chip">{form.awardAmount || 'Award value'}</span>
                  <span className="chip">Deadline: {form.deadline || 'not set'}</span>
                  {form.seats ? <span className="chip">{form.seats} awards</span> : null}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card__body">
              <h3>Tips</h3>
              <ul className="text-small">
                <li>Students can only apply while the status is <strong>Open</strong> and before the deadline.</li>
                <li>Closing a scholarship keeps existing applications intact - nothing is deleted.</li>
                <li>Lines you enter for benefits, requirements and documents become bullet points on the public page.</li>
              </ul>
            </div>
          </div>
        </aside>
      </form>
    </AppShell>
  );
}
