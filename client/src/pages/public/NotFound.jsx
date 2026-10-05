import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="section">
      <div className="container text-center" style={{ padding: '60px 0' }}>
        <div style={{ fontSize: '3.4rem' }}>🧭</div>
        <h1>Page not found</h1>
        <p className="lead" style={{ margin: '0 auto 24px' }}>
          The page you are looking for has been moved or does not exist. Try one of the links below.
        </p>
        <div className="btn-row" style={{ justifyContent: 'center' }}>
          <Link to="/" className="btn">
            Back to home
          </Link>
          <Link to="/scholarships" className="btn btn--outline">
            Browse scholarships
          </Link>
          <Link to="/events" className="btn btn--ghost">
            View events
          </Link>
        </div>
      </div>
    </section>
  );
}
