import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client';

function maskAccount(num) {
  if (!num || num.length <= 4) return num;
  return '\u2022'.repeat(num.length - 4) + num.slice(-4);
}

export default function CustomerProfile() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  // Change password form
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    client.get('/auth/me')
      .then(res => setCustomer(res.data))
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, [navigate]);

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (newPw !== confirmPw) {
      setPwError('New passwords do not match.');
      return;
    }

    setPwLoading(true);
    try {
      await client.post('/auth/change-password', {
        current_password: currentPw,
        new_password: newPw,
      });
      setPwSuccess('Password updated successfully.');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err) {
      setPwError(err.response?.data?.error || 'Failed to update password.');
    } finally {
      setPwLoading(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Loading…</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="text-xs font-semibold tracking-widest text-gray-800 uppercase hover:text-blue-600 transition-colors">
            SAIINT BANK INC
          </Link>
          <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1.5">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <h1 className="text-xl font-bold text-gray-900">Profile &amp; Security</h1>

        {/* Account info card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Account Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Full Name</p>
              <p className="font-medium text-gray-800">{customer?.full_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Account Number</p>
              <p className="font-mono text-gray-700 tracking-widest">
                {customer?.account_number ? maskAccount(customer.account_number) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Available Balance</p>
              <p className="font-bold text-gray-900 text-lg">
                R {customer?.balance
                  ? parseFloat(customer.balance).toLocaleString('en-ZA', { minimumFractionDigits: 2 })
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Account Status</p>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                customer?.account_status === 'suspended'
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {customer?.account_status || 'active'}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Member Since</p>
              <p className="text-gray-700 text-sm">
                {customer?.member_since
                  ? new Date(customer.member_since).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Account Type</p>
              <p className="text-gray-700 text-sm">International Payments</p>
            </div>
          </div>
        </div>

        {/* MFA card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-1">
                Two-Factor Authentication
              </h2>
              <p className="text-sm text-gray-600">
                {customer?.mfa_enabled
                  ? 'MFA is enabled. Your account is protected with an authenticator app.'
                  : 'MFA is not enabled. Add an extra layer of security to your account.'}
              </p>
            </div>
            <span className={`shrink-0 ml-4 px-3 py-1 rounded-full text-xs font-semibold ${
              customer?.mfa_enabled
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
            }`}>
              {customer?.mfa_enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          {!customer?.mfa_enabled && (
            <Link
              to="/mfa/setup"
              className="inline-block mt-4 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Set up MFA →
            </Link>
          )}
        </div>

        {/* Change password card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-5">Change Password</h2>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Current Password</label>
              <input
                type="password"
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">New Password</label>
              <input
                type="password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">Min 12 chars — upper, lower, digit, and special character.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {pwError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{pwError}</p>
            )}
            {pwSuccess && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">{pwSuccess}</p>
            )}

            <button
              type="submit"
              disabled={pwLoading}
              className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {pwLoading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
