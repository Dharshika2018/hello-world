export const studentLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/dashboard/applications', label: 'My applications', icon: '📄' },
  { to: '/dashboard/apply', label: 'New application', icon: '📝' },
  { group: 'Volunteering' },
  { to: '/dashboard/volunteer', label: 'Events & sign-up', icon: '📅' },
  { to: '/dashboard/volunteering', label: 'My volunteer records', icon: '🤝' },
  { group: 'Account' },
  { to: '/dashboard/notifications', label: 'Notifications', icon: '🔔' },
  { to: '/dashboard/profile', label: 'My profile', icon: '👤' },
];

export const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { group: 'Applications' },
  { to: '/admin/applications', label: 'Scholarship applications', icon: '📥' },
  { to: '/admin/students', label: 'Student accounts', icon: '🎓' },
  { group: 'Programmes' },
  { to: '/admin/scholarships', label: 'Scholarships', icon: '🏅' },
  { to: '/admin/events', label: 'Events', icon: '📅' },
  { to: '/admin/volunteers', label: 'Volunteers', icon: '🤝' },
  { group: 'Communication' },
  { to: '/admin/emails', label: 'Email outbox', icon: '✉️' },
  { to: '/admin/compose', label: 'Send announcement', icon: '📢' },
  { group: 'System' },
  { to: '/admin/accounts', label: 'Accounts & roles', icon: '🛡️' },
  { to: '/admin/system', label: 'System & database', icon: '⚙️' },
];
