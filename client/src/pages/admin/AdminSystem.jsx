import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell.jsx';
import { adminLinks } from '../../components/navLinks.js';
import { adminApi } from '../../api/client.js';
import { Alert, Badge, DetailRow, Loading, StatCard } from '../../components/ui.jsx';

export default function AdminSystem() {
  const [system, setSystem] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminApi.system().then(setSystem).catch(() => setSystem({}));
    adminApi.stats().then(setStats).catch(() => {});
  }, []);

  if (!system) {
    return (
      <AppShell links={adminLinks} homeLink="/admin" tone="admin" title="System &amp; database">
        <Loading label="Loading system information…" />
      </AppShell>
    );
  }

  const isMongo = system.database?.kind === 'mongo';

  return (
    <AppShell
      links={adminLinks}
      homeLink="/admin"
      tone="admin"
      title="System &amp; database"
      subtitle="Which database and mail transport this installation is using, and how to switch to MongoDB"
    >
      <div className="stat-grid page-section">
        <StatCard icon="🗄️" value={isMongo ? 'MongoDB' : 'Dev store'} label="Active database" tone={isMongo ? 'success' : 'info'} />
        <StatCard icon="✉️" value={system.mail?.mode === 'smtp' ? 'SMTP' : 'Outbox'} label="Mail transport" tone={system.mail?.mode === 'smtp' ? 'success' : 'info'} />
        <StatCard icon="🏅" value={system.counts?.scholarships ?? 0} label="Scholarships" />
        <StatCard icon="📅" value={system.counts?.events ?? 0} label="Events" tone="accent" />
        <StatCard icon="🎓" value={system.counts?.students ?? 0} label="Student accounts" />
        <StatCard icon="🛡️" value={system.counts?.admins ?? 0} label="Administrator accounts" />
      </div>

      <div className="grid grid--2 page-section">
        <div className="card">
          <div className="card__head--row">
            <h3 className="mb-0">Database</h3>
            <Badge tone={isMongo ? 'success' : 'warning'}>{system.database?.mode} mode</Badge>
          </div>
          <div className="card__body">
            <div className="kv-list">
              <DetailRow label="Backend" value={system.database?.label} />
              <DetailRow label="Connection string" value={system.database?.uri} />
              <DetailRow label="Mode" value={system.database?.mode} />
              <DetailRow label="Fallback reason" value={system.database?.fallbackReason} />
            </div>

            {isMongo ? (
              <Alert tone="success" title="Open MongoDB Compass to inspect the data">
                Connect Compass to <code>mongodb://127.0.0.1:27017</code> and open the{' '}
                <code>scholarship_portal</code> database. Collections: users, scholarships, events, applications,
                volunteers, notifications, emails, counters.
              </Alert>
            ) : (
              <Alert tone="warning" title="MongoDB is not reachable right now">
                Follow these steps to run the project on MongoDB:
                <ol style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                  <li>
                    Start MongoDB locally (<code>mongod</code> or the MongoDB Compass "Start server" option).
                  </li>
                  <li>
                    In <code>server/.env</code> set <code>DB_MODE=mongo</code> (and <code>MONGODB_URI</code> if your
                    server is not on the default port).
                  </li>
                  <li>
                    Restart the API: <code>npm run dev:server</code>.
                  </li>
                  <li>
                    Seed the demo data if the database is empty: <code>npm run seed</code>.
                  </li>
                </ol>
              </Alert>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card__head--row">
            <h3 className="mb-0">Email delivery</h3>
            <Badge tone={system.mail?.smtpConfigured ? 'success' : 'warning'}>
              {system.mail?.smtpConfigured ? 'SMTP configured' : 'Outbox mode'}
            </Badge>
          </div>
          <div className="card__body">
            <div className="kv-list">
              <DetailRow label="From address" value={system.mail?.from} />
              <DetailRow label="Transport" value={system.mail?.mode} />
              <DetailRow label="Queued emails" value={stats?.totals?.emailsSent} />
            </div>
            <Alert tone="info" title="Testing the notification flow">
              Approve an application in <strong>Applications</strong> and open <strong>Email Outbox</strong> - the exact
              message the student receives is stored there. Add SMTP credentials to <code>server/.env</code> to send
              them for real.
            </Alert>
          </div>
        </div>
      </div>

      <div className="grid grid--2">
        <div className="card">
          <div className="card__head--row">
            <h3 className="mb-0">Organisation</h3>
          </div>
          <div className="card__body">
            <div className="kv-list">
              <DetailRow label="Name" value={system.organisation?.name} />
              <DetailRow label="Tagline" value={system.organisation?.tagline} />
              <DetailRow label="Email" value={system.organisation?.email} />
              <DetailRow label="Phone" value={system.organisation?.phone} />
              <DetailRow label="Address" value={system.organisation?.address} />
            </div>
            <p className="hint-note mt-2 mb-0">
              These values come from <code>server/.env</code> (<code>ORG_NAME</code>, <code>ORG_EMAIL</code>, …) and are
              shown on the public website and in every email template.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card__head--row">
            <h3 className="mb-0">Application activity</h3>
          </div>
          <div className="card__body">
            <div className="kv-list">
              <DetailRow label="Total applications" value={stats?.totals?.applications} />
              <DetailRow label="Pending verification" value={stats?.totals?.pending} />
              <DetailRow label="Under review" value={stats?.totals?.underReview} />
              <DetailRow label="Approved" value={stats?.totals?.approved} />
              <DetailRow label="Rejected" value={stats?.totals?.rejected} />
              <DetailRow label="Submitted today" value={stats?.totals?.applicationsToday} />
              <DetailRow label="Volunteer registrations" value={stats?.totals?.totalVolunteers} />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
