import { Link } from 'react-router-dom';
import { SectionHead } from '../../components/ui.jsx';
import { useSite } from '../../context/SiteContext.jsx';

const VALUES = [
  { icon: '🌱', title: 'Opportunity for all', text: 'No student should drop out of education because of their family income. We fund the gap between talent and means.' },
  { icon: '🔍', title: 'Verified support', text: 'Every application is verified against submitted documents before a single rupee is released.' },
  { icon: '🤝', title: 'Collaboration', text: 'Donors, universities, employers and volunteers work together around each student.' },
  { icon: '📈', title: 'Accountability', text: 'Students track their own progress and repay interest free loans after graduation, funding the next generation.' },
];

export default function About() {
  const site = useSite();

  return (
    <>
      <section className="section--brand" style={{ padding: '46px 0' }}>
        <div className="container">
          <span className="eyebrow eyebrow--accent">About us</span>
          <h1 style={{ maxWidth: '26ch' }}>A foundation built around students</h1>
          <p className="lead">
            {site.organisation.name} is a non-profit organisation working across Sri Lanka to keep talented students in
            education - from the O/L classroom to the university lecture hall.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div>
            <SectionHead
              eyebrow="Our mission"
              title="Remove the financial barrier between a student and their future"
              description="We identify students who are performing well but are at risk of leaving education, verify their circumstances and support them with grants, materials, tuition, mentoring and career pathways."
            />
            <p>
              Support is delivered through two scholarship programmes - one for school students preparing for the
              Ordinary Level examination, and one for university undergraduates - and a year round calendar of free
              seminars and paper classes delivered by volunteers.
            </p>
            <Link to="/scholarships" className="btn mt-2">
              See our scholarship programmes
            </Link>
          </div>
          <img src="/images/scholarship.jpg" alt="A scholarship recipient at her graduation" />
        </div>
      </section>

      <section className="section section--alt">
        <div className="container">
          <SectionHead center eyebrow="What guides us" title="Our values" />
          <div className="grid grid--4">
            {VALUES.map((value) => (
              <div key={value.title} className="card">
                <div className="card__body">
                  <div className="feature-icon">{value.icon}</div>
                  <h3>{value.title}</h3>
                  <p style={{ margin: 0 }}>{value.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHead
            center
            eyebrow="How the programme works"
            title="Students, donors, universities and employers"
            description="Each stakeholder plays a clear role, and the student remains the centre of the model."
          />
          <div className="grid grid--2">
            {[
              {
                title: 'Students',
                text: 'Deserving students who cannot afford tuition, materials or living costs while they study. They apply online, are verified, and receive support until they graduate.',
              },
              {
                title: 'Donors',
                text: 'Individuals and companies who fund one or more students with a monthly contribution for the full duration of the award.',
              },
              {
                title: 'Universities & institutes',
                text: 'Partner institutions that offer placements at concessionary rates and flexible payment plans for our scholarship holders.',
              },
              {
                title: 'Employers',
                text: 'Companies that take scholarship students for internships and employment, helping them earn while they learn.',
              },
            ].map((item) => (
              <div key={item.title} className="tile">
                <h3>{item.title}</h3>
                <p style={{ margin: 0 }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--alt">
        <div className="container">
          <div className="grid grid--4">
            {[
              { value: '1,250+', label: 'Students supported' },
              { value: 'LKR 85M', label: 'Awards committed' },
              { value: '25', label: 'Districts reached' },
              { value: '600+', label: 'Volunteers engaged' },
            ].map((item) => (
              <div key={item.label} className="stat-card stat-card--accent">
                <div>
                  <div className="stat-card__value">{item.value}</div>
                  <div className="stat-card__label">{item.label}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="cta-band mt-3">
            <div>
              <h2>Want to fund a student?</h2>
              <p>Donors and corporate partners can sponsor one student at a time, with full reporting on progress.</p>
            </div>
            <div className="btn-row">
              <Link to="/contact" className="btn btn--accent">
                Contact our team
              </Link>
              <Link to="/events" className="btn btn--light">
                Volunteer instead
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
