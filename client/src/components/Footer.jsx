import { Link } from 'react-router-dom';
import { useSite } from '../context/SiteContext.jsx';
import { Logo } from './ui.jsx';

export default function Footer() {
  const site = useSite();
  const { organisation } = site;

  return (
    <footer className="footer">
      <div className="container">
        <div className="grid grid--4">
          <div>
            <div className="footer__brand">
              <Logo size={46} className="brand__logo" />
              <div>
                <strong style={{ color: '#fff', fontSize: '1.05rem' }}>{organisation.name}</strong>
                <p style={{ margin: '6px 0 0', fontSize: '0.86rem' }}>{organisation.tagline}</p>
              </div>
            </div>
            <p style={{ marginTop: 16, fontSize: '0.87rem' }}>
              A non-profit organisation providing scholarships to school and university students, and running free
              seminars, paper classes and mentoring programmes across Sri Lanka.
            </p>
          </div>

          <div>
            <h4>Quick links</h4>
            <ul className="footer__list">
              <li>
                <Link to="/scholarships">Scholarship programmes</Link>
              </li>
              <li>
                <Link to="/events">Events &amp; volunteering</Link>
              </li>
              <li>
                <Link to="/about">About the foundation</Link>
              </li>
              <li>
                <Link to="/register">Create an account</Link>
              </li>
              <li>
                <Link to="/login">Student / Admin sign in</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4>Programmes</h4>
            <ul className="footer__list">
              <li>O/L paper classes &amp; seminars</li>
              <li>A/L subject seminars</li>
              <li>School scholarship grants</li>
              <li>University undergraduate grants</li>
              <li>Career guidance workshops</li>
            </ul>
          </div>

          <div>
            <h4>Contact</h4>
            <ul className="footer__list">
              <li>📍 {organisation.address}</li>
              <li>
                ✉️ <a href={`mailto:${organisation.email}`}>{organisation.email}</a>
              </li>
              <li>
                ☎️{' '}
                <a href={`tel:${String(organisation.phone).replace(/\s/g, '')}`}>{organisation.phone}</a>
              </li>
              <li>🕘 Mon – Fri, 8.30am – 5.00pm</li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <span>
            © {new Date().getFullYear()} {organisation.name}. All rights reserved.
          </span>
          <span>Built with the MERN stack · Node · Express · MongoDB · React</span>
        </div>
      </div>
    </footer>
  );
}
