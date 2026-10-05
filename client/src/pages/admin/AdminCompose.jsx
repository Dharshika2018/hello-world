import { useState } from 'react';
import AppShell from '../../components/AppShell.jsx';
import { adminLinks } from '../../components/navLinks.js';
import { adminApi } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Alert, Select, TextArea, TextInput } from '../../components/ui.jsx';

export default function AdminCompose() {
  const toast = useToast();
  const [form, setForm] = useState({ audience: 'student', subject: '', message: '', ctaLabel: '', ctaUrl: '' });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setSent(null);
    try {
      const result = await adminApi.broadcast(form);
      toast.success('Announcement queued', result.message);
      setSent(result);
      setForm((current) => ({ ...current, subject: '', message: '', ctaLabel: '', ctaUrl: '' }));
    } catch (error) {
      toast.error('Could not send the announcement', error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell
      links={adminLinks}
      homeLink="/admin"
      tone="admin"
      title="Send an announcement"
      subtitle="Email every student, or all accounts, and add the message to their notification feed"
    >
      <div className="grid grid--form">
        <div className="card">
          <div className="card__head--row">
            <h3 className="mb-0">Compose announcement</h3>
          </div>
          <div className="card__body">
            {sent ? <Alert tone="success" title="Announcement queued">{sent.message} Open the Email Outbox to preview how it looks.</Alert> : null}

            <form onSubmit={submit} className="stack">
              <Select
                label="Audience"
                options={[
                  { value: 'student', label: 'All students' },
                  { value: 'admin', label: 'Administrators only' },
                  { value: 'all', label: 'Every account' },
                ]}
                value={form.audience}
                onChange={(event) => setForm((current) => ({ ...current, audience: event.target.value }))}
              />

              <TextInput
                label="Subject"
                required
                placeholder="e.g. Applications for the 2026 intake are now open"
                value={form.subject}
                onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
              />

              <TextArea
                label="Message"
                required
                rows={9}
                hint="Line breaks are preserved. Keep it short - two or three short paragraphs work best."
                placeholder={'Dear students,\n\nApplications for the 2026 scholarship intake are now open until 30 November.\n\nSign in to your dashboard and complete the online form.'}
                value={form.message}
                onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
              />

              <div className="form-grid">
                <TextInput
                  label="Button label (optional)"
                  placeholder="e.g. Open my dashboard"
                  value={form.ctaLabel}
                  onChange={(event) => setForm((current) => ({ ...current, ctaLabel: event.target.value }))}
                />
                <TextInput
                  label="Button link (optional)"
                  placeholder="e.g. /scholarships"
                  value={form.ctaUrl}
                  onChange={(event) => setForm((current) => ({ ...current, ctaUrl: event.target.value }))}
                />
              </div>

              <button type="submit" className="btn btn--lg" disabled={busy}>
                {busy ? 'Queueing…' : '📢 Send announcement'}
              </button>
            </form>
          </div>
        </div>

        <aside className="stack">
          <div className="card">
            <div className="card__body">
              <h3>How announcements reach students</h3>
              <ul className="text-small">
                <li>An in-app notification appears in their bell menu instantly.</li>
                <li>An email is queued in the Email Outbox (and delivered if SMTP is configured).</li>
                <li>The message is stored against each recipient for your records.</li>
              </ul>
            </div>
          </div>

          <div className="card">
            <div className="card__body">
              <h3>Preview</h3>
              <div className="tile">
                <div style={{ fontWeight: 800, color: 'var(--brand-700)' }}>{form.subject || 'Announcement subject'}</div>
                <p className="text-small" style={{ whiteSpace: 'pre-line' }}>
                  {form.message || 'Your message appears here exactly as students will read it.'}
                </p>
                {form.ctaLabel ? (
                  <span className="btn btn--sm" style={{ pointerEvents: 'none' }}>
                    {form.ctaLabel}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
