import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventsApi, scholarshipsApi } from '../../api/client.js';
import { useSite } from '../../context/SiteContext.jsx';
import ScholarshipCard from '../../components/ScholarshipCard.jsx';
import EventCard from '../../components/EventCard.jsx';
import { Loading, SectionHead } from '../../components/ui.jsx';

const PROGRAMMES = [
  {
    icon: '🎒',
    title: 'School student scholarships',
    text: 'Monthly grants, study packs and free access to every paper class for students from low income families preparing for the O/L examination.',
  },
  {
    icon: '🎓',
    title: 'University grants & loans',
    text: 'Interest free education loans with monthly living grants for undergraduates, with repayment starting one year after graduation.',
  },
  {
    icon: '📚',
    title: 'Seminars & paper classes',
    text: 'Free subject seminars, past paper classes and revision programmes conducted island wide by volunteer teachers and undergraduates.',
  },
  {
    icon: '🤝',
    title: 'Mentoring & career guidance',
    text: 'One to one mentoring with university students and industry professionals, plus career guidance for school leavers.',
  },
];

const STEPS = [
  { n: 1, title: 'Create your account', text: 'Register with your NIC, contact number and district - it takes less than two minutes.' },
  { n: 2, title: 'Complete the application', text: 'Fill the online form in six short steps and upload your results sheet, NIC copy and income certificate.' },
  { n: 3, title: 'Verification', text: 'Our team verifies every application against the submitted documents. You can track progress live in your dashboard.' },
  { n: 4, title: 'Decision by email', text: 'Approved or not, we notify you by email and in-app. Approved students are matched with donors and paid monthly.' },
];

export default function Home() {
  const site = useSite();
  const [scholarships, setScholarships] = useState(null);
  const [events, setEvents] = useState(null);

  useEffect(() => {
    scholarshipsApi
      .list({ status: 'open', limit: 3 })
      .then((data) => setScholarships(data.items))
      .catch(() => setScholarships([]));
    eventsApi
      .list({ scope: 'upcoming', limit: 3 })
      .then((data) => setEvents(data.items))
      .catch(() => setEvents([]));
  }, []);

  return (
    <>
      {/* ------------------------------------------------------------- hero */}
      <section className="hero">
        <div className="container hero__grid">
          <div>
            <span className="eyebrow eyebrow--accent">Non-profit · Island wide · Sri Lanka</span>
            <h1>
              Empowering students.
              <br />
              Shaping futures.
            </h1>
            <p>
              {site.organisation.name} provides scholarships for school and university students, and runs free O/L
              seminars, paper classes and mentoring programmes. Apply online, track your application and volunteer at
              our events - all from one portal.
            </p>
            <div className="hero__actions">
              <Link to="/register" className="btn btn--accent btn--lg">
                Apply for a scholarship
              </Link>
              <Link to="/events" className="btn btn--light btn--lg">
                Join an event as a volunteer
              </Link>
            </div>
            <div className="hero__stats">
              <div className="hero__stat">
                <b>1,250+</b>
                <span>Students supported</span>
              </div>
              <div className="hero__stat">
                <b>25</b>
                <span>Districts covered</span>
              </div>
              <div className="hero__stat">
                <b>LKR 85M</b>
                <span>Awards committed</span>
              </div>
              <div className="hero__stat">
                <b>600+</b>
                <span>Active volunteers</span>
              </div>
            </div>
          </div>

          <div className="hero__media">
            <img src="/images/hero.jpg" alt="Students in a classroom raising their hands" />
            <div className="hero__card">
              <strong>Applications open for 2026</strong>
              <span>School &amp; university programmes · verified within 14 days</span>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- programmes */}
      <section className="section section--alt">
        <div className="container">
          <SectionHead
            center
            eyebrow="What we do"
            title="Support for every stage of a student's journey"
            description="From the O/L classroom to the university lecture hall, we fund education and remove the barriers that force students to drop out."
          />
          <div className="grid grid--4">
            {PROGRAMMES.map((item) => (
              <div key={item.title} className="card card--hover">
                <div className="card__body">
                  <div className="feature-icon">{item.icon}</div>
                  <h3>{item.title}</h3>
                  <p style={{ margin: 0, fontSize: '0.92rem' }}>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ scholarships */}
      <section className="section">
        <div className="container">
          <div className="flex flex--between flex--wrap mb-3">
            <SectionHead
              eyebrow="Scholarships"
              title="Programmes open for applications"
              description="Read the eligibility criteria carefully and apply online before the deadline."
            />
            <Link to="/scholarships" className="btn btn--outline">
              View all scholarships
            </Link>
          </div>

          {scholarships === null ? (
            <Loading label="Loading scholarships…" />
          ) : scholarships.length === 0 ? (
            <div className="alert alert--info">No scholarships are open right now. Please check back soon.</div>
          ) : (
            <div className="grid grid--3">
              {scholarships.map((scholarship) => (
                <ScholarshipCard key={scholarship._id} scholarship={scholarship} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------ events */}
      <section className="section section--alt">
        <div className="container">
          <div className="flex flex--between flex--wrap mb-3">
            <SectionHead
              eyebrow="Events & volunteering"
              title="Upcoming seminars, paper classes & workshops"
              description="Our events are free for students and powered by volunteers. Register to attend, or sign up to help run the session."
            />
            <Link to="/events" className="btn btn--outline">
              All events
            </Link>
          </div>

          {events === null ? (
            <Loading label="Loading events…" />
          ) : events.length === 0 ? (
            <div className="alert alert--info">No upcoming events published yet.</div>
          ) : (
            <div className="stack">
              {events.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* -------------------------------------------------------- how to apply */}
      <section className="section">
        <div className="container">
          <SectionHead
            center
            eyebrow="How it works"
            title="Four steps from application to award"
            description="Everything happens online and every change of status is emailed to you automatically."
          />
          <div className="grid grid--4">
            {STEPS.map((step) => (
              <div key={step.n} className="tile">
                <div className="feature-icon feature-icon--accent">{step.n}</div>
                <h3>{step.title}</h3>
                <p style={{ margin: 0, fontSize: '0.92rem' }}>{step.text}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-3">
            <Link to="/register" className="btn btn--lg">
              Start your application
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ impact */}
      <section className="section section--alt">
        <div className="container split">
          <img src="/images/scholarship.jpg" alt="A graduate holding her certificate" />
          <div>
            <span className="eyebrow">Student voices</span>
            <h2>“The grant meant I could stay in university instead of dropping out.”</h2>
            <p>
              Our scholarships are funded by individual and corporate donors, and every award is tracked from the
              application to graduation. Approved students receive a monthly grant, tuition support and a mentor.
            </p>
            <ul className="check-list">
              <li>LKR 5,000 – 25,000 paid monthly directly to the student</li>
              <li>Tuition support paid straight to the institute where possible</li>
              <li>Interest free repayment begins one year after graduation</li>
              <li>Verification of every document before an award is released</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- cta */}
      <section className="section">
        <div className="container">
          <div className="cta-band" style={{ backgroundImage: 'linear-gradient(120deg, rgba(59,7,100,.94), rgba(91,33,182,.9)), url(/images/events.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div style={{ maxWidth: '58ch' }}>
              <h2>Give a few hours. Change a student's year.</h2>
              <p>
                Volunteers run registrations, teach paper classes, arrange logistics and mentor students. Sign up for
                an upcoming event and our coordinators will confirm your slot by email.
              </p>
            </div>
            <Link to="/events" className="btn btn--accent btn--lg">
              Become a volunteer
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
