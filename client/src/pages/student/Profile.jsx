import { useState } from 'react';
import AppShell from '../../components/AppShell.jsx';
import { studentLinks } from '../../components/navLinks.js';
import { auth as authApi } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Alert, DetailRow, Select, TextInput, formatDateTime } from '../../components/ui.jsx';

export default function Profile() {
  const { user, setUser } = useAuth();
  const site = useSite();
  const toast = useToast();

  const [profile, setProfile] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    nic: user?.nic || '',
    district: user?.district || '',
    address: user?.address || '',
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const saveProfile = async (event) => {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    setNotice('');
    try {
      const result = await authApi.updateProfile(profile);
      setUser(result.user);
      toast.success('Profile updated', 'Your contact details have been saved.');
    } catch (error) {
      setErrors(error.errors || {});
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    if (passwords.newPassword !== passwords.confirm) {
      setErrors({ confirm: 'Passwords do not match' });
      return;
    }
    setBusy(true);
    setErrors({});
    setNotice('');
    try {
      await authApi.changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Password changed', 'Use your new password the next time you sign in.');
    } catch (error) {
      setErrors(error.errors || {});
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell links={studentLinks} homeLink="/dashboard" title="My profile" subtitle="Keep your contact details up to date so we can reach you about your application">
      {notice ? <Alert tone="danger" title="Could not save">{notice}</Alert> : null}

      <div className="grid grid--2">
        <div className="card">
          <div className="card__head--row">
            <h3 className="mb-0">Contact details</h3>
          </div>
          <div className="card__body">
            <form onSubmit={saveProfile} className="form-grid">
              <TextInput
                label="Full name"
                required
                className="span-2"
                value={profile.name}
                error={errors.name}
                onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
              />
              <TextInput
                label="Mobile number"
                placeholder="0771234567"
                value={profile.phone}
                error={errors.phone}
                onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))}
              />
              <TextInput
                label="NIC number"
                placeholder="200312345678"
                value={profile.nic}
                error={errors.nic}
                onChange={(event) => setProfile((current) => ({ ...current, nic: event.target.value }))}
              />
              <Select
                label="District"
                placeholder="Select your district"
                options={site.districts}
                value={profile.district}
                error={errors.district}
                onChange={(event) => setProfile((current) => ({ ...current, district: event.target.value }))}
              />
              <TextInput
                label="Address"
                placeholder="Optional"
                value={profile.address}
                error={errors.address}
                onChange={(event) => setProfile((current) => ({ ...current, address: event.target.value }))}
              />
              <div className="span-2">
                <button type="submit" className="btn" disabled={busy}>
                  {busy ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <div className="card__head--row">
              <h3 className="mb-0">Account</h3>
            </div>
            <div className="card__body">
              <div className="kv-list">
                <DetailRow label="Email" value={user?.email} />
                <DetailRow label="Role" value={user?.role === 'admin' ? 'Administrator' : 'Student / Volunteer'} />
                <DetailRow label="Account created" value={formatDateTime(user?.createdAt)} />
                <DetailRow label="Last sign in" value={formatDateTime(user?.lastLoginAt)} />
                <DetailRow label="Status" value={user?.status === 'active' ? 'Active' : 'Inactive'} />
              </div>
              <p className="hint-note mt-2 mb-0">Your email address is used for scholarship decisions and volunteer confirmations and cannot be changed here.</p>
            </div>
          </div>

          <div className="card">
            <div className="card__head--row">
              <h3 className="mb-0">Change password</h3>
            </div>
            <div className="card__body">
              <form onSubmit={changePassword} className="stack">
                <TextInput
                  label="Current password"
                  type="password"
                  required
                  value={passwords.currentPassword}
                  error={errors.currentPassword}
                  onChange={(event) => setPasswords((current) => ({ ...current, currentPassword: event.target.value }))}
                />
                <TextInput
                  label="New password"
                  type="password"
                  required
                  hint="At least 6 characters"
                  value={passwords.newPassword}
                  error={errors.newPassword}
                  onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))}
                />
                <TextInput
                  label="Confirm new password"
                  type="password"
                  required
                  value={passwords.confirm}
                  error={errors.confirm}
                  onChange={(event) => setPasswords((current) => ({ ...current, confirm: event.target.value }))}
                />
                <button type="submit" className="btn btn--outline" disabled={busy}>
                  Update password
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
