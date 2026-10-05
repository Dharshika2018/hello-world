import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSite } from '../../context/SiteContext.jsx';
import { SectionHead, TextArea, TextInput } from '../../components/ui.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const FAQS = [
  {
    q: 'Who can apply for a scholarship?',
    a: 'School students in grade 10-13 and students following a degree or higher diploma at a recognised institute. Each programme lists its own eligibility rules on the scholarship page.',
  },
  {
    q: 'How long does verification take?',
    a: 'Our team usually completes verification within 14 days of submission. You will see the status change from "Pending review" to "Under review" and finally to "Approved" or "Rejected" in your dashboard, and we email you at every step.',
  },
  {
    q: 'Do I need to pay anything to apply?',
    a: 'No. Applying is completely free, and we never ask applicants for payment - please report anyone who does.',
  },
  {
    q: 'Can I volunteer if I am not a student?',
    a: 'Yes. Anyone above 16 can volunteer for our seminars, paper classes and community programmes. You still need an account so we can verify your NIC and confirm your slot.',
  },
];

export default function Contact() {
  const site = useSite();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const submit = (event) => {
    event.preventDefault();
    toast.success(
      'Thank you for your message',
      `Our team will reply to ${form.email || 'your email'} within two working days.`
    );
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <>
      <section className="section--brand" style={{ padding: '46px 0' }}>
        <div className="container">
          <span className="eyebrow eyebrow--accent">Contact</span>
          <h1>Talk to our team</h1>
          <p className="lead">
            Questions about a scholarship, an application you have already submitted, volunteering or donating? Send us
            a message or reach the relevant department directly.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container grid grid--form">
          <div className="card">
            <div className="card__head--row">
              <h3 className="mb-0">Send us a message</h3>
              <span className="badge badge--muted">Demo form - not emailed</span>
            </div>
            <div className="card__body">
              <form onSubmit={submit} className="form-grid">
                <TextInput
                  label="Your name"
                  required
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                />
                <TextInput
                  label="Email address"
                  type="email"
                  required
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                />
                <TextInput
                  label="Subject"
                  required
                  className="span-2"
                  value={form.subject}
                  onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                />
                <TextArea
                  label="Message"
                  required
                  rows={6}
                  className="span-2"
                  value={form.message}
                  onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                />
                <div className="span-2">
                  <button type="submit" className="btn">
                    Send message
                  </button>
                </div>
              </form>
            </div>
          </div>

          <aside className="stack">
            <div className="card">
              <div className="card__body">
                <h3>Head office</h3>
                <div className="kv-list">
                  <div className="detail-row">
                    <span className="detail-row__label">Address</span>
                    <span className="detail-row__value">{site.organisation.address}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-row__label">Phone</span>
                    <span className="detail-row__value">{site.organisation.phone}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-row__label">Email</span>
                    <span className="detail-row__value">{site.organisation.email}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-row__label">Office hours</span>
                    <span className="detail-row__value">Mon – Fri, 8.30am – 5.00pm</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card__body">
                <h3>Departments</h3>
                <div className="kv-list">
                  <div className="detail-row">
                    <span className="detail-row__label">School scholarships</span>
                    <span className="detail-row__value">schools@scholarshipfoundation.org</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-row__label">University grants</span>
                    <span className="detail-row__value">university@scholarshipfoundation.org</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-row__label">Events &amp; volunteering</span>
                    <span className="detail-row__value">seminars@scholarshipfoundation.org</span>
                  </div>
                </div>
                <Link to="/events" className="btn btn--outline btn--block mt-2">
                  See upcoming events
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="section section--alt">
        <div className="container">
          <SectionHead center eyebrow="FAQ" title="Frequently asked questions" />
          <div className="grid grid--2">
            {FAQS.map((faq) => (
              <div key={faq.q} className="tile">
                <h3>{faq.q}</h3>
                <p style={{ margin: 0 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
