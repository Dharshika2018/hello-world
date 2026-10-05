import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppShell from '../../components/AppShell.jsx';
import { studentLinks } from '../../components/navLinks.js';
import { applicationsApi } from '../../api/client.js';
import { Alert, DetailRow, Loading, StatusBadge, formatDate, formatDateTime, formatMoney } from '../../components/ui.jsx';

export default function ApplicationDetail() {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    applicationsApi
      .mineOne(id)
      .then((data) => setApplication(data.application))
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) {
    return (
      <AppShell links={studentLinks} homeLink="/dashboard" title="Application">
        <Alert tone="danger" title="Application not available">
          {error}
        </Alert>
        <Link to="/dashboard/applications" className="btn btn--outline">
          ← Back to my applications
        </Link>
      </AppShell>
    );
  }

  if (!application) {
    return (
      <AppShell links={studentLinks} homeLink="/dashboard" title="Application">
        <Loading label="Loading your application…" />
      </AppShell>
    );
  }

  const { personal, guardian, household, education, financial, motivation, declaration, documents } = application;
  const schoolApplicant = application.applicantType === 'school';

  return (
    <AppShell
      links={studentLinks}
      homeLink="/dashboard"
      title={`Application ${application.applicationNo}`}
      subtitle={application.scholarshipTitle}
    >
      <div className="card mb-3">
        <div className="card__body">
          <div className="flex flex--between flex--wrap">
            <div>
              <h2 style={{ marginBottom: 6 }}>{application.scholarshipTitle}</h2>
              <p className="text-muted text-small mb-0">
                Submitted {formatDateTime(application.createdAt)} · {schoolApplicant ? 'School student' : 'University student'}
              </p>
            </div>
            <div className="text-right">
              <StatusBadge status={application.status} />
              {application.admin?.reviewedBy ? (
                <div className="text-small text-muted mt-1">
                  Reviewed by {application.admin.reviewedBy}
                  <br />
                  {formatDate(application.admin.reviewedAt)}
                </div>
              ) : null}
            </div>
          </div>

          {application.status === 'approved' ? (
            <Alert tone="success" title="Congratulations - your application was approved 🎉">
              Our finance team will contact you about the disbursement schedule. Keep your bank details up to date.
            </Alert>
          ) : null}
          {application.status === 'rejected' ? (
            <Alert tone="danger" title="This application was not successful">
              {application.admin?.note || 'Thank you for applying. You are welcome to apply again for the next intake.'}
            </Alert>
          ) : null}
          {application.status === 'under_review' ? (
            <Alert tone="info" title="Verification in progress">
              Our team is checking your documents. You will be emailed as soon as a decision is made.
            </Alert>
          ) : null}
        </div>
      </div>

      <div className="grid grid--sidebar">
        <div className="stack">
          <Section title="Personal details">
            <div className="detail-grid">
              <div>
                <DetailRow label="Full name" value={personal?.fullName} />
                <DetailRow label="Name with initials" value={personal?.nameWithInitials} />
                <DetailRow label="NIC" value={personal?.nic} />
                <DetailRow label="Date of birth" value={formatDate(personal?.dateOfBirth)} />
                <DetailRow label="Gender" value={personal?.gender} />
              </div>
              <div>
                <DetailRow label="Email" value={personal?.email} />
                <DetailRow label="Mobile" value={personal?.phone} />
                <DetailRow label="WhatsApp" value={personal?.whatsapp} />
                <DetailRow label="District" value={personal?.district} />
                <DetailRow label="Divisional secretariat" value={personal?.divisionalSecretariat} />
              </div>
            </div>
            <DetailRow label="Address" value={personal?.address} />
          </Section>

          <Section title="Guardian & household">
            <div className="detail-grid">
              <div>
                <DetailRow label="Guardian" value={guardian?.name} />
                <DetailRow label="Relationship" value={guardian?.relationship} />
                <DetailRow label="Occupation" value={guardian?.occupation} />
                <DetailRow label="Guardian phone" value={guardian?.phone} />
                <DetailRow label="Guardian monthly income" value={guardian?.monthlyIncome ? formatMoney(guardian.monthlyIncome) : '—'} />
              </div>
              <div>
                <DetailRow label="Family members" value={household?.members} />
                <DetailRow label="Household income" value={household?.monthlyIncome ? formatMoney(household.monthlyIncome) : '—'} />
                <DetailRow label="Siblings in school" value={household?.siblingsInSchool} />
                <DetailRow label="Income sources" value={(household?.incomeSources || []).join(', ')} />
                <DetailRow label="Samurdhi / state support" value={household?.receivesSamurdhi ? 'Yes' : 'No'} />
              </div>
            </div>
          </Section>

          <Section title="Education & results">
            {schoolApplicant ? (
              <>
                <div className="detail-grid">
                  <div>
                    <DetailRow label="School" value={education?.schoolName} />
                    <DetailRow label="School district" value={education?.schoolDistrict} />
                    <DetailRow label="School type" value={education?.schoolType} />
                  </div>
                  <div>
                    <DetailRow label="Current grade" value={education?.currentGradeLevel} />
                    <DetailRow label="O/L year" value={education?.olExamYear} />
                    <DetailRow label="O/L index no." value={education?.olIndexNo} />
                  </div>
                </div>
                <ResultsView title="O/L results" rows={education?.olResults} />
                {education?.alResults?.length ? <ResultsView title="A/L results" rows={education.alResults} /> : null}
              </>
            ) : (
              <>
                <div className="detail-grid">
                  <div>
                    <DetailRow label="University / institute" value={education?.universityName} />
                    <DetailRow label="Degree programme" value={education?.degreeProgramme} />
                    <DetailRow label="Registration no." value={education?.universityRegNo} />
                    <DetailRow label="Year of study" value={education?.yearOfStudy} />
                  </div>
                  <div>
                    <DetailRow label="Expected graduation" value={education?.expectedGraduation} />
                    <DetailRow label="Medium" value={education?.mediumOfStudy} />
                    <DetailRow label="GPA / average" value={education?.gpa} />
                    <DetailRow label="A/L year &amp; stream" value={[education?.alExamYear, education?.alStream].filter(Boolean).join(' · ')} />
                  </div>
                </div>
                <ResultsView title="A/L results" rows={education?.alResults} />
                {education?.olResults?.length ? <ResultsView title="O/L results" rows={education.olResults} /> : null}
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
          </Section>

          <Section title="Financial need & motivation">
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
                <DetailRow label="Account number" value={financial?.bankAccountNumber ? `••••${String(financial.bankAccountNumber).slice(-4)}` : '—'} />
              </div>
            </div>
            <DetailRow label="Why this scholarship" value={motivation?.reasonForApplication} />
            <DetailRow label="Family situation" value={motivation?.financialHardship} />
            <DetailRow label="Future goals" value={motivation?.futureGoals} />
            <DetailRow label="Community contribution" value={motivation?.communityContribution} />
          </Section>

          <Section title="Documents & declaration">
            <div className="stack stack--sm">
              {Object.entries(documents || {}).length === 0 ? (
                <p className="text-muted text-small mb-0">No documents were uploaded with this application.</p>
              ) : (
                Object.entries(documents || {}).map(([key, doc]) => {
                  const files = Array.isArray(doc) ? doc : [doc];
                  return files.map((file) => (
                    <div key={`${key}-${file.url}`} className="tile flex flex--between flex--wrap">
                      <div>
                        <strong className="text-small">{file.label || key}</strong>
                        <div className="text-small text-muted">{file.name}</div>
                      </div>
                      <a className="btn btn--ghost btn--sm" href={file.url} target="_blank" rel="noreferrer">
                        View / download
                      </a>
                    </div>
                  ));
                })
              )}
            </div>

            <div className="detail-grid mt-2">
              <div>
                <DetailRow label="Signed by" value={declaration?.studentSignature} />
                <DetailRow label="Guardian signature" value={declaration?.guardianSignature} />
              </div>
              <div>
                <DetailRow label="Place" value={declaration?.place} />
                <DetailRow label="Date" value={formatDate(declaration?.declarationDate)} />
              </div>
            </div>
          </Section>
        </div>

        <aside className="stack">
          <div className="card">
            <div className="card__body">
              <h3>Verification history</h3>
              <ul className="timeline">
                {(application.statusHistory || []).map((entry) => (
                  <li key={`${entry.status}-${entry.at}`}>
                    <div className="timeline__time">{formatDateTime(entry.at)}</div>
                    <div className="timeline__title">
                      {String(entry.status).replace('_', ' ').replace(/^\w/, (character) => character.toUpperCase())}
                    </div>
                    <div className="timeline__note">
                      {entry.by ? `by ${entry.by}` : ''} {entry.note ? `· ${entry.note}` : ''}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card">
            <div className="card__body">
              <h3>Reference numbers</h3>
              <div className="kv-list">
                <DetailRow label="Application no." value={application.applicationNo} />
                <DetailRow label="Application ID" value={application._id} />
                <DetailRow label="Status" value={application.statusLabel} />
              </div>
              <p className="hint-note mt-2 mb-0">Quote the application number in any email or phone call about this application.</p>
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Section({ title, children }) {
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
  if (!rows.length) return null;
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
