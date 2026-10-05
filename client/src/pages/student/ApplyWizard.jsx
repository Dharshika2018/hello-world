import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AppShell from '../../components/AppShell.jsx';
import { studentLinks } from '../../components/navLinks.js';
import { applicationsApi, scholarshipsApi } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Alert,
  Checkbox,
  EmptyState,
  Field,
  FileField,
  Loading,
  RadioGroup,
  Select,
  TextArea,
  TextInput,
  formatDate,
} from '../../components/ui.jsx';

const STEPS = [
  { key: 'basics', label: 'Scholarship' },
  { key: 'personal', label: 'Personal details' },
  { key: 'family', label: 'Guardian & household' },
  { key: 'education', label: 'Education & results' },
  { key: 'need', label: 'Finances & motivation' },
  { key: 'documents', label: 'Documents & declaration' },
];

const emptyResult = () => ({ subject: '', grade: '' });

const initialForm = {
  scholarshipId: '',
  applicantType: '',
  personal: {
    fullName: '',
    nameWithInitials: '',
    nic: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    district: '',
    divisionalSecretariat: '',
    postalCode: '',
    preferredContactMethod: 'Email',
  },
  guardian: { name: '', relationship: '', occupation: '', nic: '', phone: '', monthlyIncome: '' },
  household: {
    members: '',
    monthlyIncome: '',
    siblingsInSchool: '',
    incomeSources: [],
    incomeSourceOther: '',
    receivesSamurdhi: false,
    receivesOtherSupport: false,
    supportDetails: '',
  },
  education: {
    schoolName: '',
    schoolDistrict: '',
    schoolType: 'Government',
    currentGradeLevel: '',
    olExamYear: '',
    olIndexNo: '',
    olResults: [emptyResult(), emptyResult(), emptyResult(), emptyResult(), emptyResult(), emptyResult()],
    alExamYear: '',
    alStream: '',
    alIndexNo: '',
    alResults: [emptyResult(), emptyResult(), emptyResult()],
    universityName: '',
    universityDistrict: '',
    degreeProgramme: '',
    universityRegNo: '',
    yearOfStudy: '',
    gpa: '',
    expectedGraduation: '',
    mediumOfStudy: '',
    isStateUniversity: false,
    preferredStudyStream: '',
    preferredInstitute: '',
    preferredIntake: '',
    achievements: '',
    leadershipPositions: '',
    extracurricularActivities: '',
  },
  financial: {
    requestedAmount: '',
    requestedFrequency: 'Per academic year',
    purpose: '',
    existingScholarships: '',
    bankName: '',
    bankBranch: '',
    bankAccountName: '',
    bankAccountNumber: '',
  },
  motivation: { reasonForApplication: '', financialHardship: '', futureGoals: '', communityContribution: '' },
  declaration: { declaration: false, consentToVerify: false, studentSignature: '', guardianSignature: '', declarationDate: new Date().toISOString().slice(0, 10), place: '' },
};

/** Immutable nested setter:  update('personal', 'nic', value) */
function setDeep(object, path, value) {
  const [key, ...rest] = path;
  if (rest.length === 0) return { ...object, [key]: value };
  return { ...object, [key]: setDeep(object[key] || {}, rest, value) };
}

export default function ApplyWizard() {
  const { scholarshipId } = useParams();
  const { user } = useAuth();
  const site = useSite();
  const toast = useToast();
  const navigate = useNavigate();

  const [scholarships, setScholarships] = useState(null);
  const [existing, setExisting] = useState([]);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState({});
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (...args) => {
    const value = args.pop();
    const path = args;
    setForm((current) => setDeep(current, path, value));
    setErrors((current) => {
      const key = path.join('.');
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  /* --------------------------------------------------------------- loading */
  useEffect(() => {
    scholarshipsApi
      .list({ status: 'open', limit: 50 })
      .then((data) => setScholarships(data.items))
      .catch(() => setScholarships([]));
    applicationsApi
      .mine()
      .then((data) => setExisting(data.items))
      .catch(() => setExisting([]));
  }, []);

  useEffect(() => {
    if (scholarshipId) {
      setForm((current) => ({ ...current, scholarshipId }));
    }
  }, [scholarshipId]);

  // Pre-fill from the signed in student's account so they type less
  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      personal: {
        ...current.personal,
        fullName: current.personal.fullName || user.name || '',
        email: current.personal.email || user.email || '',
        phone: current.personal.phone || user.phone || '',
        nic: current.personal.nic || user.nic || '',
        district: current.personal.district || user.district || '',
      },
      declaration: { ...current.declaration, studentSignature: current.declaration.studentSignature || user.name || '' },
    }));
  }, [user]);

  const selected = useMemo(
    () => (scholarships || []).find((item) => item._id === form.scholarshipId),
    [scholarships, form.scholarshipId]
  );

  const alreadyApplied = useMemo(
    () =>
      existing.find(
        (application) =>
          application.scholarshipId === form.scholarshipId && application.status !== 'rejected'
      ),
    [existing, form.scholarshipId]
  );

  // Auto-set the applicant type from the chosen scholarship's category
  useEffect(() => {
    if (selected && selected.category && !form.applicantType) {
      update('applicantType', selected.category);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  /* ------------------------------------------------------------ validation */
  const validateStep = (index) => {
    const found = {};
    const { personal, guardian, household, education, financial, motivation, declaration } = form;

    if (index === 0) {
      if (!form.scholarshipId) found.scholarshipId = 'Select the scholarship you are applying for';
      if (!['school', 'university'].includes(form.applicantType)) found.applicantType = 'Tell us whether you are a school or university student';
      if (alreadyApplied) found.scholarshipId = `You already have an application (${alreadyApplied.applicationNo}) for this scholarship`;
    }

    if (index === 1) {
      if (!personal.fullName || personal.fullName.trim().length < 3) found['personal.fullName'] = 'Enter your full name';
      if (!/^([0-9]{9}[vVxX]|[0-9]{12})$/.test(personal.nic.trim())) found['personal.nic'] = 'Use 9 digits + V/X or the 12 digit NIC number';
      if (!personal.dateOfBirth) found['personal.dateOfBirth'] = 'Select your date of birth';
      if (!personal.gender) found['personal.gender'] = 'Select your gender';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(personal.email.trim())) found['personal.email'] = 'Enter a valid email address';
      if (!/^(\+94[0-9]{9}|0[0-9]{9})$/.test(personal.phone.replace(/[\s-]/g, ''))) found['personal.phone'] = 'Use a number such as 0771234567 or +94771234567';
      if (!personal.address || personal.address.trim().length < 8) found['personal.address'] = 'Enter your permanent address';
      if (!personal.district) found['personal.district'] = 'Select your district';
    }

    if (index === 2) {
      if (!guardian.name) found['guardian.name'] = "Guardian's name is required";
      if (!guardian.relationship) found['guardian.relationship'] = 'Select the relationship';
      if (!guardian.phone) found['guardian.phone'] = 'Guardian contact number is required';
      if (guardian.monthlyIncome === '' || Number(guardian.monthlyIncome) < 0) found['guardian.monthlyIncome'] = 'Enter the monthly income (LKR)';
      if (!household.members || Number(household.members) < 1) found['household.members'] = 'How many people live in your household?';
      if (household.monthlyIncome === '') found['household.monthlyIncome'] = 'Enter the total monthly household income';
      if (!household.incomeSources.length) found['household.incomeSources'] = 'Select at least one income source';
      if (household.incomeSources.includes('Other') && !household.incomeSourceOther) found['household.incomeSourceOther'] = 'Describe the other income source';
    }

    if (index === 3) {
      const complete = (rows) => (rows || []).filter((row) => row.subject && row.grade).length;
      if (form.applicantType === 'school') {
        if (!education.schoolName) found['education.schoolName'] = 'Enter your school name';
        if (!education.schoolDistrict) found['education.schoolDistrict'] = 'Select the school district';
        if (!education.currentGradeLevel) found['education.currentGradeLevel'] = 'Select your current grade';
        if (!education.olExamYear) found['education.olExamYear'] = 'Select the O/L examination year';
        if (complete(education.olResults) < 3) found['education.olResults'] = 'Enter at least 3 O/L subject results';
      } else {
        if (!education.universityName) found['education.universityName'] = 'Enter your university / institute';
        if (!education.degreeProgramme) found['education.degreeProgramme'] = 'Enter the degree programme';
        if (!education.yearOfStudy) found['education.yearOfStudy'] = 'Select your year of study';
        if (!education.expectedGraduation) found['education.expectedGraduation'] = 'Enter the expected graduation year';
        if (!education.alExamYear) found['education.alExamYear'] = 'Enter the A/L examination year';
        if (!education.alStream) found['education.alStream'] = 'Select your A/L stream';
        if (complete(education.alResults) < 3) found['education.alResults'] = 'Enter at least 3 A/L subject results';
      }
      if (!education.preferredStudyStream) found['education.preferredStudyStream'] = 'Select the field you want to study';
    }

    if (index === 4) {
      if (financial.requestedAmount === '' || Number(financial.requestedAmount) <= 0) found['financial.requestedAmount'] = 'Enter the amount of support you need';
      if (!financial.purpose || financial.purpose.trim().length < 10) found['financial.purpose'] = 'Describe what the funds will be used for';
      if (financial.bankAccountNumber && !/^[0-9]{6,20}$/.test(financial.bankAccountNumber)) found['financial.bankAccountNumber'] = 'Account number should be 6-20 digits';
      if (motivation.reasonForApplication.trim().length < 60) found['motivation.reasonForApplication'] = 'Please write at least a few sentences (60 characters)';
      if (motivation.financialHardship.trim().length < 40) found['motivation.financialHardship'] = 'Please describe your family situation (40 characters minimum)';
      if (motivation.futureGoals.trim().length < 30) found['motivation.futureGoals'] = 'Tell us your goals (30 characters minimum)';
    }

    if (index === 5) {
      if (!declaration.declaration) found['declaration.declaration'] = 'You must accept the declaration';
      if (!declaration.consentToVerify) found['declaration.consentToVerify'] = 'Consent to verify documents is required';
      if (!declaration.studentSignature) found['declaration.studentSignature'] = 'Type your full name as your signature';
      if (form.applicantType === 'school' && !declaration.guardianSignature) found['declaration.guardianSignature'] = 'A parent / guardian signature is required';
      for (const doc of site.documentTypes) {
        if (doc.required && !files[doc.key]) found[`documents.${doc.key}`] = `${doc.label} is required`;
      }
    }

    setErrors(found);
    if (Object.keys(found).length) {
      setNotice('Please correct the highlighted fields before continuing.');
      return false;
    }
    setNotice('');
    return true;
  };

  const next = () => {
    if (validateStep(step) && step < STEPS.length - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const back = () => {
    setNotice('');
    setStep((current) => Math.max(0, current - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const jump = (index) => {
    // Only allow jumping forward when every previous step is valid
    for (let i = 0; i < index; i += 1) {
      if (!validateStep(i)) {
        setStep(i);
        return;
      }
    }
    setStep(index);
    setNotice('');
  };

  /* ---------------------------------------------------------------- submit */
  const submit = async (event) => {
    event.preventDefault();
    for (let index = 0; index < STEPS.length; index += 1) {
      if (!validateStep(index)) {
        setStep(index);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('payload', JSON.stringify(form));
      Object.entries(files).forEach(([key, file]) => {
        if (file) formData.append(key, file);
      });

      const result = await applicationsApi.submit(formData);
      toast.success('Application submitted 🎉', `Your reference is ${result.application.applicationNo}. We emailed a confirmation to you.`);
      navigate(`/dashboard/applications/${result.application._id}`, { replace: true });
    } catch (error) {
      const serverErrors = error.errors || {};
      setErrors(serverErrors);
      const keys = Object.keys(serverErrors);
      if (keys.length) {
        const firstKey = keys[0];
        const index = STEPS.findIndex((item) => firstKey.startsWith(item.key));
        setStep(index >= 0 ? index : 0);
      }
      setNotice(error.message);
      toast.error('Could not submit the application', error.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  /* ----------------------------------------------------------------- views */
  if (scholarships === null) {
    return (
      <AppShell links={studentLinks} homeLink="/dashboard" title="Scholarship application">
        <Loading label="Loading scholarships…" />
      </AppShell>
    );
  }

  if (scholarships.length === 0) {
    return (
      <AppShell links={studentLinks} homeLink="/dashboard" title="Scholarship application">
        <EmptyState
          icon="🏅"
          title="No scholarships are open right now"
          description="Applications open a few times a year. Watch your notifications - we email you as soon as a new programme is announced."
          action={
            <Link to="/dashboard" className="btn">
              Back to dashboard
            </Link>
          }
        />
      </AppShell>
    );
  }

  const schoolSelected = form.applicantType === 'school';

  return (
    <AppShell
      links={studentLinks}
      homeLink="/dashboard"
      title="Scholarship application"
      subtitle="Complete all six steps and submit - you can review everything before sending"
    >
      {notice ? (
        <Alert tone="danger" title="Please check your form">
          {notice}
        </Alert>
      ) : null}

      <div className="stepper">
        {STEPS.map((item, index) => (
          <button
            key={item.key}
            type="button"
            className={`step${index === step ? ' step--active' : ''}${index < step ? ' step--done' : ''}`}
            onClick={() => jump(index)}
          >
            <span className="step__num">{index < step ? '✓' : index + 1}</span>
            {item.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="grid grid--form">
        <div className="stack">
          {/* ------------------------------------------------------ step 1 */}
          {step === 0 ? (
            <div className="card">
              <div className="card__head--row">
                <h3 className="mb-0">Step 1 · Choose your scholarship</h3>
              </div>
              <div className="card__body">
                <Select
                  label="Scholarship programme"
                  required
                  placeholder="Select an open programme"
                  value={form.scholarshipId}
                  error={errors.scholarshipId}
                  onChange={(event) => {
                    update('scholarshipId', event.target.value);
                    const found = scholarships.find((item) => item._id === event.target.value);
                    if (found) update('applicantType', found.category);
                  }}
                >
                  {scholarships.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.title} · closes {formatDate(item.deadline)}
                    </option>
                  ))}
                </Select>

                <div className="mt-2">
                  <RadioGroup
                    label="I am applying as"
                    required
                    name="applicantType"
                    value={form.applicantType}
                    error={errors.applicantType}
                    onChange={(value) => update('applicantType', value)}
                    options={[
                      { value: 'school', label: '🏫 A school student (O/L or A/L)' },
                      { value: 'university', label: '🎓 A university / higher education student' },
                    ]}
                  />
                </div>

                {alreadyApplied ? (
                  <Alert tone="warning" title="You have already applied">
                    You already submitted application <strong>{alreadyApplied.applicationNo}</strong> for this
                    scholarship. You can track it in{' '}
                    <Link to={`/dashboard/applications/${alreadyApplied._id}`}>my applications</Link>, or choose a
                    different programme.
                  </Alert>
                ) : null}

                {selected ? (
                  <div className="tile mt-2">
                    <strong>{selected.title}</strong>
                    <p className="text-small text-muted mt-1 mb-1">{selected.shortDescription}</p>
                    <div className="chips">
                      <span className="chip">Award: {selected.awardAmount || 'See details'}</span>
                      <span className="chip">Deadline: {formatDate(selected.deadline)}</span>
                      {selected.seats ? <span className="chip">{selected.seats} awards</span> : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* ------------------------------------------------------ step 2 */}
          {step === 1 ? (
            <div className="card">
              <div className="card__head--row">
                <h3 className="mb-0">Step 2 · Personal details</h3>
              </div>
              <div className="card__body">
                <div className="form-grid">
                  <TextInput
                    label="Full name"
                    required
                    className="span-2"
                    placeholder="As it appears on your NIC or birth certificate"
                    value={form.personal.fullName}
                    error={errors['personal.fullName']}
                    onChange={(event) => update('personal', 'fullName', event.target.value)}
                  />
                  <TextInput
                    label="Name with initials"
                    placeholder="e.g. K. A. N. Perera"
                    value={form.personal.nameWithInitials}
                    error={errors['personal.nameWithInitials']}
                    onChange={(event) => update('personal', 'nameWithInitials', event.target.value)}
                  />
                  <TextInput
                    label="NIC number"
                    required
                    placeholder="200312345678 or 991234567V"
                    value={form.personal.nic}
                    error={errors['personal.nic']}
                    onChange={(event) => update('personal', 'nic', event.target.value)}
                  />
                  <TextInput
                    label="Date of birth"
                    required
                    type="date"
                    value={form.personal.dateOfBirth}
                    error={errors['personal.dateOfBirth']}
                    onChange={(event) => update('personal', 'dateOfBirth', event.target.value)}
                  />
                  <Select
                    label="Gender"
                    required
                    placeholder="Select"
                    options={site.genderOptions}
                    value={form.personal.gender}
                    error={errors['personal.gender']}
                    onChange={(event) => update('personal', 'gender', event.target.value)}
                  />
                  <TextInput
                    label="Email address"
                    required
                    type="email"
                    hint="All decisions are emailed here"
                    value={form.personal.email}
                    error={errors['personal.email']}
                    onChange={(event) => update('personal', 'email', event.target.value)}
                  />
                  <TextInput
                    label="Mobile number"
                    required
                    placeholder="0771234567"
                    value={form.personal.phone}
                    error={errors['personal.phone']}
                    onChange={(event) => update('personal', 'phone', event.target.value)}
                  />
                  <TextInput
                    label="WhatsApp number"
                    placeholder="Optional"
                    value={form.personal.whatsapp}
                    error={errors['personal.whatsapp']}
                    onChange={(event) => update('personal', 'whatsapp', event.target.value)}
                  />
                  <Select
                    label="Preferred contact method"
                    options={site.contactMethods}
                    value={form.personal.preferredContactMethod}
                    onChange={(event) => update('personal', 'preferredContactMethod', event.target.value)}
                  />
                  <TextArea
                    label="Permanent address"
                    required
                    className="span-2"
                    rows={3}
                    placeholder="House number, street, town"
                    value={form.personal.address}
                    error={errors['personal.address']}
                    onChange={(event) => update('personal', 'address', event.target.value)}
                  />
                  <Select
                    label="District"
                    required
                    placeholder="Select your district"
                    options={site.districts}
                    value={form.personal.district}
                    error={errors['personal.district']}
                    onChange={(event) => update('personal', 'district', event.target.value)}
                  />
                  <TextInput
                    label="Divisional secretariat"
                    placeholder="e.g. Colombo Divisional Secretariat"
                    value={form.personal.divisionalSecretariat}
                    onChange={(event) => update('personal', 'divisionalSecretariat', event.target.value)}
                  />
                  <TextInput
                    label="Postal code"
                    placeholder="Optional"
                    value={form.personal.postalCode}
                    onChange={(event) => update('personal', 'postalCode', event.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {/* ------------------------------------------------------ step 3 */}
          {step === 2 ? (
            <div className="card">
              <div className="card__head--row">
                <h3 className="mb-0">Step 3 · Guardian &amp; household</h3>
              </div>
              <div className="card__body">
                <h4>Parent / guardian</h4>
                <div className="form-grid">
                  <TextInput
                    label="Guardian's full name"
                    required
                    value={form.guardian.name}
                    error={errors['guardian.name']}
                    onChange={(event) => update('guardian', 'name', event.target.value)}
                  />
                  <Select
                    label="Relationship to you"
                    required
                    placeholder="Select"
                    options={['Father', 'Mother', 'Legal guardian', 'Grandparent', 'Sibling', 'Other']}
                    value={form.guardian.relationship}
                    error={errors['guardian.relationship']}
                    onChange={(event) => update('guardian', 'relationship', event.target.value)}
                  />
                  <TextInput
                    label="Occupation"
                    placeholder="e.g. Farmer, driver, government officer"
                    value={form.guardian.occupation}
                    onChange={(event) => update('guardian', 'occupation', event.target.value)}
                  />
                  <TextInput
                    label="Guardian's NIC"
                    placeholder="Optional"
                    value={form.guardian.nic}
                    onChange={(event) => update('guardian', 'nic', event.target.value)}
                  />
                  <TextInput
                    label="Guardian's contact number"
                    required
                    placeholder="0712345678"
                    value={form.guardian.phone}
                    error={errors['guardian.phone']}
                    onChange={(event) => update('guardian', 'phone', event.target.value)}
                  />
                  <TextInput
                    label="Guardian's monthly income (LKR)"
                    required
                    type="number"
                    min="0"
                    value={form.guardian.monthlyIncome}
                    error={errors['guardian.monthlyIncome']}
                    onChange={(event) => update('guardian', 'monthlyIncome', event.target.value)}
                  />
                </div>

                <hr />

                <h4>Household details</h4>
                <div className="form-grid">
                  <TextInput
                    label="Number of family members"
                    required
                    type="number"
                    min="1"
                    value={form.household.members}
                    error={errors['household.members']}
                    onChange={(event) => update('household', 'members', event.target.value)}
                  />
                  <TextInput
                    label="Total monthly household income (LKR)"
                    required
                    type="number"
                    min="0"
                    value={form.household.monthlyIncome}
                    error={errors['household.monthlyIncome']}
                    onChange={(event) => update('household', 'monthlyIncome', event.target.value)}
                  />
                  <TextInput
                    label="Siblings still in school"
                    type="number"
                    min="0"
                    value={form.household.siblingsInSchool}
                    onChange={(event) => update('household', 'siblingsInSchool', event.target.value)}
                  />
                </div>

                <div className="mt-2">
                  <span className="field__label">
                    Sources of family income<span>*</span>
                  </span>
                  <div className="checkbox-grid mt-1">
                    {site.incomeSources.map((source) => (
                      <Checkbox
                        key={source}
                        label={source}
                        checked={form.household.incomeSources.includes(source)}
                        onChange={() =>
                          update(
                            'household',
                            'incomeSources',
                            form.household.incomeSources.includes(source)
                              ? form.household.incomeSources.filter((item) => item !== source)
                              : [...form.household.incomeSources, source]
                          )
                        }
                      />
                    ))}
                  </div>
                  {errors['household.incomeSources'] ? <span className="field__error">{errors['household.incomeSources']}</span> : null}
                </div>

                {form.household.incomeSources.includes('Other') ? (
                  <TextInput
                    label="Please describe the other income source"
                    className="mt-2"
                    value={form.household.incomeSourceOther}
                    error={errors['household.incomeSourceOther']}
                    onChange={(event) => update('household', 'incomeSourceOther', event.target.value)}
                  />
                ) : null}

                <div className="grid grid--2 mt-2">
                  <Checkbox
                    label="My family receives Samurdhi or other state assistance"
                    checked={form.household.receivesSamurdhi}
                    onChange={(event) => update('household', 'receivesSamurdhi', event.target.checked)}
                  />
                  <Checkbox
                    label="My family receives support from a relative or charity"
                    checked={form.household.receivesOtherSupport}
                    onChange={(event) => update('household', 'receivesOtherSupport', event.target.checked)}
                  />
                </div>

                {form.household.receivesOtherSupport ? (
                  <TextArea
                    label="Describe the support you receive"
                    className="mt-2"
                    rows={3}
                    value={form.household.supportDetails}
                    onChange={(event) => update('household', 'supportDetails', event.target.value)}
                  />
                ) : null}
              </div>
            </div>
          ) : null}

          {/* ------------------------------------------------------ step 4 */}
          {step === 3 ? (
            <div className="card">
              <div className="card__head--row">
                <h3 className="mb-0">Step 4 · Education &amp; results</h3>
                <span className="badge badge--brand">{schoolSelected ? 'School student' : 'University student'}</span>
              </div>
              <div className="card__body">
                {schoolSelected ? (
                  <>
                    <h4>School details</h4>
                    <div className="form-grid">
                      <TextInput
                        label="School name"
                        required
                        className="span-2"
                        value={form.education.schoolName}
                        error={errors['education.schoolName']}
                        onChange={(event) => update('education', 'schoolName', event.target.value)}
                      />
                      <Select
                        label="School district"
                        required
                        placeholder="Select"
                        options={site.districts}
                        value={form.education.schoolDistrict}
                        error={errors['education.schoolDistrict']}
                        onChange={(event) => update('education', 'schoolDistrict', event.target.value)}
                      />
                      <Select
                        label="School type"
                        options={['Government', 'Government assisted', 'Private', 'International']}
                        value={form.education.schoolType}
                        onChange={(event) => update('education', 'schoolType', event.target.value)}
                      />
                      <Select
                        label="Current grade / level"
                        required
                        placeholder="Select"
                        options={['Grade 9', 'Grade 10', 'Grade 11 (O/L)', 'Grade 12 (A/L)', 'Grade 13 (A/L)', 'Completed O/L', 'Completed A/L']}
                        value={form.education.currentGradeLevel}
                        error={errors['education.currentGradeLevel']}
                        onChange={(event) => update('education', 'currentGradeLevel', event.target.value)}
                      />
                      <TextInput
                        label="School index number"
                        placeholder="Optional"
                        value={form.education.olIndexNo}
                        onChange={(event) => update('education', 'olIndexNo', event.target.value)}
                      />
                      <Select
                        label="O/L examination year"
                        required
                        placeholder="Select"
                        options={['2023', '2024', '2025', '2026', '2027']}
                        value={form.education.olExamYear}
                        error={errors['education.olExamYear']}
                        onChange={(event) => update('education', 'olExamYear', event.target.value)}
                      />
                    </div>

                    <ResultsTable
                      title="O/L subject results"
                      rows={form.education.olResults}
                      grades={site.grades}
                      error={errors['education.olResults']}
                      onChange={(rows) => update('education', 'olResults', rows)}
                    />

                    <h4 className="mt-3">A/L details (if you have already sat the examination)</h4>
                    <div className="form-grid">
                      <Select
                        label="A/L examination year"
                        placeholder="Not applicable"
                        options={['2022', '2023', '2024', '2025', '2026', '2027']}
                        value={form.education.alExamYear}
                        onChange={(event) => update('education', 'alExamYear', event.target.value)}
                      />
                      <Select
                        label="A/L stream"
                        placeholder="Not applicable"
                        options={site.alStreams}
                        value={form.education.alStream}
                        onChange={(event) => update('education', 'alStream', event.target.value)}
                      />
                    </div>
                    {form.education.alExamYear ? (
                      <ResultsTable
                        title="A/L subject results"
                        rows={form.education.alResults}
                        grades={site.grades}
                        onChange={(rows) => update('education', 'alResults', rows)}
                      />
                    ) : null}
                  </>
                ) : (
                  <>
                    <h4>University / higher education institute</h4>
                    <div className="form-grid">
                      <TextInput
                        label="University or institute"
                        required
                        className="span-2"
                        placeholder="e.g. NSBM Green University, University of Colombo"
                        value={form.education.universityName}
                        error={errors['education.universityName']}
                        onChange={(event) => update('education', 'universityName', event.target.value)}
                      />
                      <TextInput
                        label="Degree / diploma programme"
                        required
                        value={form.education.degreeProgramme}
                        error={errors['education.degreeProgramme']}
                        onChange={(event) => update('education', 'degreeProgramme', event.target.value)}
                      />
                      <TextInput
                        label="Registration number"
                        placeholder="Optional"
                        value={form.education.universityRegNo}
                        onChange={(event) => update('education', 'universityRegNo', event.target.value)}
                      />
                      <Select
                        label="Year of study"
                        required
                        placeholder="Select"
                        options={site.yearOfStudyOptions}
                        value={form.education.yearOfStudy}
                        error={errors['education.yearOfStudy']}
                        onChange={(event) => update('education', 'yearOfStudy', event.target.value)}
                      />
                      <TextInput
                        label="Expected graduation year"
                        required
                        placeholder="e.g. 2028"
                        value={form.education.expectedGraduation}
                        error={errors['education.expectedGraduation']}
                        onChange={(event) => update('education', 'expectedGraduation', event.target.value)}
                      />
                      <Select
                        label="Institute district"
                        placeholder="Select"
                        options={site.districts}
                        value={form.education.universityDistrict}
                        onChange={(event) => update('education', 'universityDistrict', event.target.value)}
                      />
                      <TextInput
                        label="Current GPA / average mark"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Optional"
                        value={form.education.gpa}
                        error={errors['education.gpa']}
                        onChange={(event) => update('education', 'gpa', event.target.value)}
                      />
                      <Select
                        label="Medium of study"
                        placeholder="Select"
                        options={site.mediumOfStudyOptions}
                        value={form.education.mediumOfStudy}
                        onChange={(event) => update('education', 'mediumOfStudy', event.target.value)}
                      />
                    </div>

                    <h4 className="mt-3">A/L results</h4>
                    <div className="form-grid">
                      <Select
                        label="A/L examination year"
                        required
                        placeholder="Select"
                        options={['2021', '2022', '2023', '2024', '2025', '2026']}
                        value={form.education.alExamYear}
                        error={errors['education.alExamYear']}
                        onChange={(event) => update('education', 'alExamYear', event.target.value)}
                      />
                      <Select
                        label="A/L stream"
                        required
                        placeholder="Select"
                        options={site.alStreams}
                        value={form.education.alStream}
                        error={errors['education.alStream']}
                        onChange={(event) => update('education', 'alStream', event.target.value)}
                      />
                      <TextInput
                        label="A/L index number"
                        placeholder="Optional"
                        value={form.education.alIndexNo}
                        onChange={(event) => update('education', 'alIndexNo', event.target.value)}
                      />
                    </div>

                    <ResultsTable
                      title="A/L subject results"
                      rows={form.education.alResults}
                      grades={site.grades}
                      error={errors['education.alResults']}
                      onChange={(rows) => update('education', 'alResults', rows)}
                    />
                    <Checkbox
                      label="I am following my degree at a state university"
                      checked={form.education.isStateUniversity}
                      onChange={(event) => update('education', 'isStateUniversity', event.target.checked)}
                    />
                  </>
                )}

                <hr />
                <h4>Study plans &amp; achievements</h4>
                <div className="form-grid">
                  <Select
                    label="Preferred field of study"
                    required
                    placeholder="Select"
                    options={site.studyStreams}
                    value={form.education.preferredStudyStream}
                    error={errors['education.preferredStudyStream']}
                    onChange={(event) => update('education', 'preferredStudyStream', event.target.value)}
                  />
                  <TextInput
                    label="Preferred university / institute"
                    placeholder="Optional"
                    value={form.education.preferredInstitute}
                    onChange={(event) => update('education', 'preferredInstitute', event.target.value)}
                  />
                  <TextInput
                    label="Preferred intake"
                    placeholder="e.g. February 2027"
                    value={form.education.preferredIntake}
                    onChange={(event) => update('education', 'preferredIntake', event.target.value)}
                  />
                  <TextArea
                    label="Academic achievements"
                    className="span-2"
                    rows={3}
                    placeholder="Prizes, ranks, olympiad results, competitions"
                    value={form.education.achievements}
                    onChange={(event) => update('education', 'achievements', event.target.value)}
                  />
                  <TextArea
                    label="Leadership positions held"
                    rows={3}
                    placeholder="Prefect, club secretary, team captain…"
                    value={form.education.leadershipPositions}
                    onChange={(event) => update('education', 'leadershipPositions', event.target.value)}
                  />
                  <TextArea
                    label="Extracurricular activities"
                    rows={3}
                    placeholder="Sports, clubs, community service…"
                    value={form.education.extracurricularActivities}
                    onChange={(event) => update('education', 'extracurricularActivities', event.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {/* ------------------------------------------------------ step 5 */}
          {step === 4 ? (
            <div className="card">
              <div className="card__head--row">
                <h3 className="mb-0">Step 5 · Finances &amp; motivation</h3>
              </div>
              <div className="card__body">
                <h4>Financial support requested</h4>
                <div className="form-grid">
                  <TextInput
                    label="Amount requested (LKR)"
                    required
                    type="number"
                    min="0"
                    placeholder="e.g. 300000"
                    value={form.financial.requestedAmount}
                    error={errors['financial.requestedAmount']}
                    onChange={(event) => update('financial', 'requestedAmount', event.target.value)}
                  />
                  <Select
                    label="How often do you need it?"
                    options={['Per academic year', 'Monthly', 'Per semester', 'One off (emergency)']}
                    value={form.financial.requestedFrequency}
                    onChange={(event) => update('financial', 'requestedFrequency', event.target.value)}
                  />
                  <TextArea
                    label="What will the funds be used for?"
                    required
                    className="span-2"
                    rows={3}
                    placeholder="Tuition fees, transport, accommodation, study materials, examination fees…"
                    value={form.financial.purpose}
                    error={errors['financial.purpose']}
                    onChange={(event) => update('financial', 'purpose', event.target.value)}
                  />
                  <TextInput
                    label="Other scholarships you currently receive"
                    className="span-2"
                    placeholder="e.g. None / Mahapola"
                    value={form.financial.existingScholarships}
                    onChange={(event) => update('financial', 'existingScholarships', event.target.value)}
                  />
                </div>

                <h4 className="mt-3">Bank details (needed if your application is approved)</h4>
                <div className="form-grid">
                  <TextInput
                    label="Bank"
                    placeholder="e.g. Bank of Ceylon"
                    value={form.financial.bankName}
                    onChange={(event) => update('financial', 'bankName', event.target.value)}
                  />
                  <TextInput
                    label="Branch"
                    placeholder="e.g. Matara"
                    value={form.financial.bankBranch}
                    onChange={(event) => update('financial', 'bankBranch', event.target.value)}
                  />
                  <TextInput
                    label="Account holder name"
                    value={form.financial.bankAccountName}
                    onChange={(event) => update('financial', 'bankAccountName', event.target.value)}
                  />
                  <TextInput
                    label="Account number"
                    placeholder="Digits only"
                    value={form.financial.bankAccountNumber}
                    error={errors['financial.bankAccountNumber']}
                    onChange={(event) => update('financial', 'bankAccountNumber', event.target.value)}
                  />
                </div>

                <hr />
                <h4>Your story</h4>
                <div className="form-grid">
                  <TextArea
                    label="Why should you receive this scholarship?"
                    required
                    className="span-2"
                    rows={5}
                    placeholder="Tell us about your results, your goals and why you need support. Minimum 60 characters."
                    hint={`${form.motivation.reasonForApplication.length} characters written`}
                    value={form.motivation.reasonForApplication}
                    error={errors['motivation.reasonForApplication']}
                    onChange={(event) => update('motivation', 'reasonForApplication', event.target.value)}
                  />
                  <TextArea
                    label="Describe your family's financial situation"
                    required
                    className="span-2"
                    rows={4}
                    placeholder="Income sources, dependants, medical expenses or other pressures on the household."
                    value={form.motivation.financialHardship}
                    error={errors['motivation.financialHardship']}
                    onChange={(event) => update('motivation', 'financialHardship', event.target.value)}
                  />
                  <TextArea
                    label="What are your goals after your studies?"
                    required
                    rows={4}
                    value={form.motivation.futureGoals}
                    error={errors['motivation.futureGoals']}
                    onChange={(event) => update('motivation', 'futureGoals', event.target.value)}
                  />
                  <TextArea
                    label="How will you give back to your community?"
                    rows={4}
                    placeholder="Optional"
                    value={form.motivation.communityContribution}
                    onChange={(event) => update('motivation', 'communityContribution', event.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {/* ------------------------------------------------------ step 6 */}
          {step === 5 ? (
            <div className="card">
              <div className="card__head--row">
                <h3 className="mb-0">Step 6 · Documents &amp; declaration</h3>
              </div>
              <div className="card__body">
                <p className="text-small text-muted">
                  Upload clear scans or photographs (PDF, JPG or PNG · maximum 5MB each). Applications missing the
                  required documents cannot be verified.
                </p>

                <div className="form-grid">
                  {site.documentTypes.map((doc) => (
                    <FileField
                      key={doc.key}
                      label={doc.label}
                      required={doc.required}
                      error={errors[`documents.${doc.key}`]}
                      name={doc.key}
                      fileName={files[doc.key]?.name}
                      onChange={(name, file) => setFiles((current) => ({ ...current, [name]: file }))}
                    />
                  ))}
                </div>

                <hr />
                <h4>Declaration</h4>
                <div className="stack">
                  <Checkbox
                    label="I declare that all the information and documents submitted with this application are true, complete and correct."
                    checked={form.declaration.declaration}
                    onChange={(event) => update('declaration', 'declaration', event.target.checked)}
                  />
                  {errors['declaration.declaration'] ? <span className="field__error">{errors['declaration.declaration']}</span> : null}

                  <Checkbox
                    label="I consent to the foundation verifying my details with my school, university, Grama Niladhari or bank."
                    checked={form.declaration.consentToVerify}
                    onChange={(event) => update('declaration', 'consentToVerify', event.target.checked)}
                  />
                  {errors['declaration.consentToVerify'] ? <span className="field__error">{errors['declaration.consentToVerify']}</span> : null}
                </div>

                <div className="form-grid mt-2">
                  <TextInput
                    label="Student signature (type your full name)"
                    required
                    value={form.declaration.studentSignature}
                    error={errors['declaration.studentSignature']}
                    onChange={(event) => update('declaration', 'studentSignature', event.target.value)}
                  />
                  <TextInput
                    label={schoolSelected ? 'Parent / guardian signature (required)' : 'Parent / guardian signature'}
                    required={schoolSelected}
                    value={form.declaration.guardianSignature}
                    error={errors['declaration.guardianSignature']}
                    onChange={(event) => update('declaration', 'guardianSignature', event.target.value)}
                  />
                  <TextInput
                    label="Place"
                    placeholder="e.g. Matara"
                    value={form.declaration.place}
                    onChange={(event) => update('declaration', 'place', event.target.value)}
                  />
                  <TextInput
                    label="Date"
                    type="date"
                    value={form.declaration.declarationDate}
                    onChange={(event) => update('declaration', 'declarationDate', event.target.value)}
                  />
                </div>

                <Alert tone="info" title="What happens next?">
                  Our verification team reviews your application within 14 days. You will receive an email and an in-app
                  notification when the status changes - approved applications are matched with donors and paid monthly.
                </Alert>
              </div>
            </div>
          ) : null}

          <div className="wizard-actions">
            <button type="button" className="btn btn--ghost" onClick={back} disabled={step === 0}>
              ← Back
            </button>
            <div className="btn-row">
              {step < STEPS.length - 1 ? (
                <button type="button" className="btn" onClick={next}>
                  Save &amp; continue →
                </button>
              ) : (
                <button type="submit" className="btn btn--accent btn--lg" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit application'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------ summary */}
        <aside className="stack">
          <div className="card">
            <div className="card__body">
              <h3>Application summary</h3>
              <div className="kv-list">
                <SummaryRow label="Scholarship" value={selected?.title || 'Not selected'} />
                <SummaryRow label="Applicant type" value={form.applicantType === 'school' ? 'School student' : form.applicantType === 'university' ? 'University student' : '—'} />
                <SummaryRow label="Full name" value={form.personal.fullName || '—'} />
                <SummaryRow label="NIC" value={form.personal.nic || '—'} />
                <SummaryRow label="District" value={form.personal.district || '—'} />
                <SummaryRow label="Household income" value={form.household.monthlyIncome ? `LKR ${Number(form.household.monthlyIncome).toLocaleString()}` : '—'} />
                <SummaryRow
                  label="School / University"
                  value={form.education.schoolName || form.education.universityName || '—'}
                />
                <SummaryRow label="Amount requested" value={form.financial.requestedAmount ? `LKR ${Number(form.financial.requestedAmount).toLocaleString()}` : '—'} />
                <SummaryRow
                  label="Documents attached"
                  value={`${Object.values(files).filter(Boolean).length} of ${site.documentTypes.length}`}
                />
              </div>
              <p className="hint-note mt-2 mb-0">
                Your progress is kept in this browser tab only - submit before closing the page.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card__body">
              <h3>Need help?</h3>
              <p className="text-small">
                If you cannot upload a document or your NIC is not accepted, email us and our team will assist you.
              </p>
              <div className="kv-list">
                <SummaryRow label="Email" value={site.organisation.email} />
                <SummaryRow label="Phone" value={site.organisation.phone} />
              </div>
            </div>
          </div>
        </aside>
      </form>
    </AppShell>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="detail-row">
      <span className="detail-row__label">{label}</span>
      <span className="detail-row__value">{value}</span>
    </div>
  );
}

/** Repeating subject / grade rows for O/L and A/L results. */
function ResultsTable({ title, rows = [], grades = [], onChange, error }) {
  const change = (index, key, value) => {
    const next = rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row));
    onChange(next);
  };
  const add = () => onChange([...rows, emptyResult()]);
  const remove = (index) => onChange(rows.filter((_, rowIndex) => rowIndex !== index));

  return (
    <Field label={title} error={error} hint="Add one row per subject. Leave unused rows empty.">
      <div className="stack stack--sm">
        {rows.map((row, index) => (
          <div key={index} className="flex" style={{ gap: 10 }}>
            <input
              className="input"
              placeholder="Subject"
              value={row.subject}
              onChange={(event) => change(index, 'subject', event.target.value)}
            />
            <select className="select" style={{ maxWidth: 150 }} value={row.grade} onChange={(event) => change(index, 'grade', event.target.value)}>
              <option value="">Grade</option>
              {grades.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
            <button type="button" className="btn btn--ghost btn--icon" onClick={() => remove(index)} aria-label="Remove row">
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="btn btn--outline btn--sm" onClick={add} style={{ alignSelf: 'flex-start' }}>
          + Add subject
        </button>
      </div>
    </Field>
  );
}
