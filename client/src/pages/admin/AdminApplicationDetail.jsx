import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AppShell from '../../components/AppShell.jsx';
import { adminLinks } from '../../components/navLinks.js';
import { applicationsApi } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Alert,
  Badge,
  DetailRow,
  Loading,
  Select,
  StatusBadge,
  TextArea,
  formatDate,
  formatDateTime,
  formatMoney,
} from '../../components/ui.jsx';

export default function AdminApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ status: '', adminNote: '', notify: true });
  const [busy, setBusy] = useState(false);
  const [saveNoteBusy, setSaveNoteBusy] = useState(false);

  const load = useCallback(() => {
    applicationsApi
      .adminOne(id)
      .then((result) => {
        setData(result);
        setForm({
          status: result.application.status,
          adminNote: result.application.admin?.note || '',
          notify: true,
        });
      })
      .catch((err) => setError(err.message));
  }, [id]);

  useEffect(load, [load]);

  if (error) {
    return (
      <AppShell links={adminLinks} homeLink="/admin" tone="admin" title="Application">
        <Alert tone="danger" title="Application not available">
          {error}
        </Alert>
        <Link to="/admin/applications" className="btn btn--outline">
          ← Back to applications
        </Link>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell links={adminLinks} homeLink="/admin" tone="admin" title="Application">
        <Loading label="Loading application…" />
      </AppShell>
    );
  }

  const { application, applicant } = data;
  const { personal, guardian, household, education, financial, motivation, declaration, documents } = application;
  const schoolApplicant = application.applicantType === 'school';

  const updateStatus = async (status) => {
    setBusy(true);
    try {
      const result = await applicationsApi.setStatus(application._id, { ...form, status });
      toast.success(
        `Marked as ${result.application.statusLabel}`,
        result.notified ? `Notification email queued to ${result.email?.to}` : 'Student was not notified.'
      );
      setForm((current) => ({ ...current, status }));
      load();
    } catch (err) {
      toast.error('Could not update the status', err.message);
    } finally {
      setBusy(false);
    }
  };

  const saveNote = async () => {
    setSaveNoteBusy(true);
    try {
      await applicationsApi.setNote(application._id, { adminNote: form.adminNote });
      toast.success('Internal note saved', 'This note is only visible to administrators.');
      load();
    } catch (err) {
      toast.error('Could not save the note', err.message);
    } finally {
      setSaveNoteBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete application ${application.applicationNo}? This cannot be undone.`)) return;
    try {
      await applicationsApi.remove(application._id);
      toast.success('Application deleted', `${application.applicationNo} was removed.`);
      navigate('/admin/applications');
    } catch (err) {
      toast.error('Could not delete', err.message);
    }
  };

  return (
    <AppShell
      links={adminLinks}
      homeLink="/admin"
      tone="admin"
      title={`Application ${application.applicationNo}`}
      subtitle={`${personal?.fullName} · ${application.scholarshipTitle}`}
    >
      <div className="flex flex--between flex--wrap mb-3">
        <div className="pill-row">
          <StatusBadge status={application.status} />
          <Badge tone={schoolApplicant ? 'info' : 'brand'}>{schoolApplicant ? 'School student' : 'University student'}</Badge>
          <Badge tone="muted">Submitted {formatDateTime(application.createdAt)}</Badge>
          <Badge tone="muted">{Object.keys(documents || {}).length} document(s)</Badge>
        </div>
        <div className="btn-row">
          <Link to="/admin/applications" className="btn btn--ghost btn--sm">
            ← All applications
          </Link>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => window.print()}>
            🖨 Print
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={remove}>
            🗑 Delete
          </button>
        </div>
      </div>

      <div className="grid grid--sidebar">
        <div className="stack">
          <Card title="Applicant account">
            <div className="detail-grid">
              <div>
                <DetailRow label="Name" value={applicant?.name} />
                <DetailRow label="Email" value={applicant?.email} />
                <DetailRow label="Phone" value={applicant?.phone} />
              </div>
              <div>
                <DetailRow label="NIC" value={applicant?.nic} />
                <DetailRow label="District" value={applicant?.district} />
                <DetailRow label="Registered" value={formatDateTime(applicant?.createdAt)} />
              </div>
            </div>
          </Card>

          <Card title="Personal details">
            <div className="detail-grid">
              <div>
                <DetailRow label="Full name" value={personal?.fullName} />
                <DetailRow label="Name with initials" value={personal?.nameWithInitials} />
                <DetailRow label="NIC" value={personal?.nic} />
                <DetailRow label="Date of birth" value={formatDate(personal?.dateOfBirth)} />
                <DetailRow label="Gender" value={personal?.gender} />
                <DetailRow label="Preferred contact" value={personal?.preferredContactMethod} />
              </div>
              <div>
                <DetailRow label="Email" value={personal?.email} />
                <DetailRow label="Mobile" value={personal?.phone} />
                <DetailRow label="WhatsApp" value={personal?.whatsapp} />
                <DetailRow label="District" value={personal?.district} />
                <DetailRow label="Divisional secretariat" value={personal?.divisionalSecretariat} />
                <DetailRow label="Postal code" value={personal?.postalCode} />
              </div>
            </div>
            <DetailRow label="Address" value={personal?.address} />
          </Card>

          <Card title="Guardian & household">
            <div className="detail-grid">
              <div>
                <DetailRow label="Guardian" value={guardian?.name} />
                <DetailRow label="Relationship" value={guardian?.relationship} />
                <DetailRow label="Occupation" value={guardian?.occupation} />
                <DetailRow label="Guardian NIC" value={guardian?.nic} />
                <DetailRow label="Guardian phone" value={guardian?.phone} />
              </div>
              <div>
                <DetailRow label="Family members" value={household?.members} />
                <DetailRow label="Household income" value={formatMoney(household?.monthlyIncome)} />
                <DetailRow label="Guardian income" value={formatMoney(guardian?.monthlyIncome)} />
                <DetailRow label="Siblings in school" value={household?.siblingsInSchool} />
                <DetailRow label="Samurdhi / state support" value={household?.receivesSamurdhi ? 'Yes' : 'No'} />
                <DetailRow label="Other support" value={household?.receivesOtherSupport ? household?.supportDetails || 'Yes' : 'No'} />
              </div>
            </div>
            <DetailRow label="Income sources" value={(household?.incomeSources || []).join(', ')} />
          </Card>

          <Card title="Education & results">
            {schoolApplicant ? (
              <>
                <div className="detail-grid">
                  <div>
                    <DetailRow label="School" value={education?.schoolName} />
                    <DetailRow label="School district" value={education?.schoolDistrict} />
                    <DetailRow label="School type" value={education?.schoolType} />
                    <DetailRow label="Current grade" value={education?.currentGradeLevel} />
                  </div>
                  <div>
                    <DetailRow label="O/L year" value={education?.olExamYear} />
                    <DetailRow label="O/L index" value={education?.olIndexNo} />
                    <DetailRow label="A/L year" value={education?.alExamYear} />
                    <DetailRow label="A/L stream" value={education?.alStream} />
                  </div>
                </div>
                <ResultsView title="O/L results" rows={education?.olResults} />
                <ResultsView title="A/L results" rows={education?.alResults} />
              </>
            ) : (
              <>
                <div className="detail-grid">
                  <div>
                    <DetailRow label="Institute" value={education?.universityName} />
                    <DetailRow label="Programme" value={education?.degreeProgramme} />
                    <DetailRow label="Registration no." value={education?.universityRegNo} />
                    <DetailRow label="Year of study" value={education?.yearOfStudy} />
                    <DetailRow label="State university" value={education?.isStateUniversity ? 'Yes' : 'No'} />
                  </div>
                  <div>
                    <DetailRow label="Expected graduation" value={education?.expectedGraduation} />
                    <DetailRow label="Medium" value={education?.mediumOfStudy} />
                    <DetailRow label="GPA / average" value={education?.gpa} />
                    <DetailRow label="A/L year" value={education?.alExamYear} />
                    <DetailRow label="A/L stream" value={education?.alStream} />
                  </div>
                </div>
                <ResultsView title="A/L results" rows={education?.alResults} />
                <ResultsView title="O/L results" rows={education?.olResults} />
              </>
            )}
            <div className="mt-2">
              <DetailRow label="Preferred field of study" value={education?.preferredStudyStream} />
              <DetailRow label="Preferred institute" value={education?.preferredInstitute} />
              <DetailRow label="Preferred intake" value={education?.preferredIntake} />
              <DetailRow label="Achievements" value={education?.achievements} />
              <DetailRow label="Leadership" value={education?.leadershipPositions} />
              <DetailRow label="Extracurricular" value={education?.extracurricularActivities} />
            </div>
          </Card>

          <Card title="Financial need & motivation">
            <div className="detail-grid">
              <div>
                <DetailRow label="Amount requested" value={formatMoney(financial?.requestedAmount)} />
                <DetailRow label="Frequency" value={financial?.requestedFrequency} />
                <DetailRow label="Purpose" value={financial?.purpose} />
                <DetailRow label="Other scholarships" value={financial?.existingScholarships} />
              </div>
              <div>
                <DetailRow label="Bank" value={financial?.bankName} />
                <DetailRow label="Branch" value={financial?.bankBranch} />
                <DetailRow label="Account name" value={financial?.bankAccountName} />
                <DetailRow label="Account number" value={financial?.bankAccountNumber} />
              </div>
            </div>
            <DetailRow label="Why this scholarship" value={motivation?.reasonForApplication} />
            <DetailRow label="Family situation" value={motivation?.financialHardship} />
            <DetailRow label="Future goals" value={motivation?.futureGoals} />
            <DetailRow label="Community contribution" value={motivation?.communityContribution} />
          </Card>

          <Card title="Uploaded documents">
            {Object.keys(documents || {}).length === 0 ? (
              <Alert tone="warning">No documents were uploaded with this application.</Alert>
            ) : (
              <div className="stack stack--sm">
                {Object.entries(documents).map(([key, value]) => {
                  const files = Array.isArray(value) ? value : [value];
                  return files.map((file) => (
                    <div key={`${key}-${file.url}`} className="tile flex flex--between flex--wrap">
                      <div>
                        <strong className="text-small">{file.label || key}</strong>
                        <div className="text-small text-muted">
                          {file.name} · {file.size ? `${Math.round(file.size / 1024)} KB` : ''} · {file.mimetype}
                        </div>
                      </div>
                      <a className="btn btn--outline btn--sm" href={file.url} target="_blank" rel="noreferrer">
                        Open document
                      </a>
                    </div>
                  ));
                })}
              </div>
            )}
            <div className="detail-grid mt-2">
              <div>
                <DetailRow label="Student signature" value={declaration?.studentSignature} />
                <DetailRow label="Guardian signature" value={declaration?.guardianSignature} />
              </div>
              <div>
                <DetailRow label="Signed place" value={declaration?.place} />
                <DetailRow label="Signed date" value={formatDate(declaration?.declarationDate)} />
                <DetailRow label="Declaration accepted" value={declaration?.declaration ? 'Yes' : 'No'} />
                <DetailRow label="Verification consent" value={declaration?.consentToVerify ? 'Yes' : 'No'} />
              </div>
            </div>
          </Card>
        </div>

        {/* ----------------------------------------------------- verify panel */}
        <aside className="stack">
          <div className="card" style={{ borderColor: 'var(--brand-300)', borderWidth: 2 }}>
            <div className="card__head--row">
              <h3 className="mb-0">Verification decision</h3>
              <StatusBadge status={application.status} />
            </div>
            <div className="card__body">
              <Select
                label="Set status"
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                options={[
                  { value: 'pending', label: 'Pending review' },
                  { value: 'under_review', label: 'Under review' },
                  { value: 'approved', label: '✅ Approved' },
                  { value: 'rejected', label: '❌ Rejected' },
                ]}
              />

              <TextArea
                label="Note to the student"
                rows={4}
                className="mt-2"
                placeholder="This note is included in the notification email."
                value={form.adminNote}
                onChange={(event) => setForm((current) => ({ ...current, adminNote: event.target.value }))}
              />

              <label className="checkbox mt-2">
                <input
                  type="checkbox"
                  checked={form.notify}
                  onChange={(event) => setForm((current) => ({ ...current, notify: event.target.checked }))}
                />
                <span>Notify the student by email</span>
              </label>

              <div className="stack stack--sm mt-2">
                <button type="button" className="btn btn--success btn--block" disabled={busy} onClick={() => updateStatus('approved')}>
                  ✅ Approve application
                </button>
                <button type="button" className="btn btn--warning btn--block" disabled={busy} onClick={() => updateStatus('under_review')}>
                  🔎 Mark under review
                </button>
                <button type="button" className="btn btn--danger btn--block" disabled={busy} onClick={() => updateStatus('rejected')}>
                  ❌ Reject application
                </button>
              </div>

              <p className="hint-note mt-2 mb-0">
                Approving sends the student a congratulations email with the award details. Rejecting sends a polite
                decision email. Both are recorded in the Email Outbox.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card__head--row">
              <h3 className="mb-0">Internal note</h3>
            </div>
            <div className="card__body">
              <TextArea
                label="Visible to administrators only"
                rows={3}
                value={form.adminNote}
                onChange={(event) => setForm((current) => ({ ...current, adminNote: event.target.value }))}
              />
              <button type="button" className="btn btn--outline btn--block" onClick={saveNote} disabled={saveNoteBusy}>
                {saveNoteBusy ? 'Saving…' : 'Save note'}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card__head--row">
              <h3 className="mb-0">Verification history</h3>
            </div>
            <div className="card__body">
              <ul className="timeline">
                {(application.statusHistory || []).map((entry) => (
                  <li key={`${entry.status}-${entry.at}`}>
                    <div className="timeline__time">{formatDateTime(entry.at)}</div>
                    <div className="timeline__title">{String(entry.status).replace('_', ' ')}</div>
                    <div className="timeline__note">
                      {entry.by ? `by ${entry.by}` : ''} {entry.note ? `· ${entry.note}` : ''}
                    </div>
                  </li>
                ))}
              </ul>
              {application.admin?.reviewedBy ? (
                <div className="mt-2">
                  <DetailRow label="Last reviewed by" value={application.admin.reviewedBy} />
                  <DetailRow label="Reviewed at" value={formatDateTime(application.admin.reviewedAt)} />
                </div>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Card({ title, children }) {
  return (
    <div className="card">
      <div className="card__head--row">
        <h3 className="mb-0">{title}</h3>
      </div>
      <div className="card__body">{children}</div>
    </div>
  );
}

function ResultsView({ title, rows = [] }) {
  if (!rows?.length) return null;
  return (
    <div className="mt-2">
      <h4>{title}</h4>
      <div className="chips">
        {rows.map((row) => (
          <span key={`${row.subject}-${row.grade}`} className="chip">
            {row.subject} · <strong>{row.grade}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}
