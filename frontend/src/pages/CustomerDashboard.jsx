import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client';

const STATUS_STYLES = {
  pending:   'bg-yellow-50 text-yellow-700 border border-yellow-200',
  submitted: 'bg-green-50 text-green-700 border border-green-200',
  rejected:  'bg-red-50 text-red-600 border border-red-200',
};

const LS_NOTIF_KEY = 'saiint_notif_cleared_at';

function maskAccount(num) {
  if (!num || num.length <= 4) return num;
  return '\u2022'.repeat(num.length - 4) + num.slice(-4);
}

export default function CustomerDashboard() {
  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [txFilter, setTxFilter] = useState('all');
  const [showNotif, setShowNotif] = useState(false);
  const navigate = useNavigate();

  const clearedAt = useMemo(() => {
    const v = localStorage.getItem(LS_NOTIF_KEY);
    return v ? new Date(v) : new Date(0);
  }, []);

  useEffect(() => {
    Promise.all([client.get('/auth/me'), client.get('/transactions')])
      .then(([meRes, txRes]) => {
        setCustomer(meRes.data);
        setTransactions(txRes.data.transactions);
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, [navigate]);

  const rejectedNew = useMemo(() =>
    transactions.filter(tx => tx.status === 'rejected' && new Date(tx.created_at) > clearedAt),
    [transactions, clearedAt]
  );

  function clearNotifications() {
    localStorage.setItem(LS_NOTIF_KEY, new Date().toISOString());
    setShowNotif(false);
    // re-derive by forcing re-read — just hide the panel; count resets on next mount
    window.location.reload();
  }

  const filtered = txFilter === 'all'
    ? transactions
    : transactions.filter(tx => tx.status === txFilter);

  async function logout() {
    await client.post('/auth/logout');
    navigate('/login');
  }

  function downloadStatement() {
    window.open(`${import.meta.env.VITE_API_URL}/transactions/export`, '_blank');
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
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="text-xs font-semibold tracking-widest text-gray-800 uppercase hover:text-blue-600 transition-colors">
            SAIINT BANK INC
          </Link>
          <div className="flex items-center gap-3">
            {/* Notifications bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotif(v => !v)}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
                title="Notifications"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {rejectedNew.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {rejectedNew.length}
                  </span>
                )}
              </button>

              {showNotif && (
                <div className="absolute right-0 top-10 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                  <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-widest">Notifications</p>
                    {rejectedNew.length > 0 && (
                      <button onClick={clearNotifications} className="text-xs text-blue-600 hover:underline">
                        Mark all read
                      </button>
                    )}
                  </div>
                  {rejectedNew.length === 0 ? (
                    <p className="px-4 py-5 text-sm text-gray-400 text-center">No new notifications.</p>
                  ) : (
                    <ul className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                      {rejectedNew.map(tx => (
                        <li key={tx.id} className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-800">Payment rejected</p>
                          <p className="text-xs text-gray-500">
                            {tx.payee_name} — {parseFloat(tx.amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })} {tx.currency}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(tx.created_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <Link to="/dashboard/profile" className="text-sm text-gray-500 hover:text-gray-800 transition-colors font-medium">
              Profile
            </Link>
            <button onClick={logout} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Account card */}
        <div className="relative bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 text-white rounded-2xl p-7 shadow-xl overflow-hidden select-none">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-blue-500/10 rounded-full" />
          <div className="absolute -bottom-12 -left-12 w-52 h-52 bg-blue-600/10 rounded-full" />
          <div className="relative">
            <div className="flex justify-between items-start mb-8">
              <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">SAIINT BANK INC</p>
              <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                customer?.account_status === 'suspended'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-green-500/20 text-green-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${customer?.account_status === 'suspended' ? 'bg-red-400' : 'bg-green-400'}`}></span>
                {customer?.account_status === 'suspended' ? 'Suspended' : 'Active'}
              </span>
            </div>

            <p className="text-lg font-semibold tracking-wide mb-1">{customer?.full_name}</p>
            <p className="font-mono text-gray-300 text-base tracking-[0.2em] mb-5">
              {customer?.account_number ? maskAccount(customer.account_number) : '••••••••••'}
            </p>

            {/* Balance */}
            <div className="mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Available Balance</p>
              <p className="text-2xl font-bold tracking-tight">
                R {customer?.balance
                  ? parseFloat(customer.balance).toLocaleString('en-ZA', { minimumFractionDigits: 2 })
                  : '—'}
              </p>
            </div>

            <div className="flex justify-between items-end text-xs">
              <div>
                <p className="text-gray-500 uppercase tracking-widest mb-0.5">Account Type</p>
                <p className="text-gray-300">International Payments</p>
              </div>
              {customer?.member_since && (
                <div className="text-right">
                  <p className="text-gray-500 uppercase tracking-widest mb-0.5">Member Since</p>
                  <p className="text-gray-300">
                    {new Date(customer.member_since).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'New Payment', icon: '↗', action: () => navigate('/dashboard/pay'), primary: true },
            { label: 'Statement', icon: '↓', action: downloadStatement },
            { label: 'Profile & Security', icon: '⚙', action: () => navigate('/dashboard/profile') },
            { label: 'Support', icon: '?', action: () => {} },
          ].map(({ label, icon, action, primary }) => (
            <button
              key={label}
              onClick={action}
              className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl border font-medium text-sm transition-all ${
                primary
                  ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 shadow-sm'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <span className={`text-xl leading-none ${primary ? 'text-white' : 'text-gray-400'}`}>{icon}</span>
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>

        {/* Transaction history */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap gap-3 justify-between items-center">
            <h2 className="font-semibold text-gray-800">Transaction History</h2>
            {/* Filter tabs */}
            <div className="flex gap-1.5">
              {['all', 'pending', 'submitted', 'rejected'].map(s => (
                <button
                  key={s}
                  onClick={() => setTxFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
                    txFilter === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 mb-3 text-sm">
                {txFilter === 'all' ? 'No transactions yet.' : `No ${txFilter} transactions.`}
              </p>
              {txFilter === 'all' && (
                <button onClick={() => navigate('/dashboard/pay')} className="text-blue-600 hover:underline text-sm font-medium">
                  Make your first payment →
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Date</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Payee</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Bank</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Amount</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-4 text-gray-400 whitespace-nowrap text-xs">
                        {new Date(tx.created_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-800">{tx.payee_name}</td>
                      <td className="px-5 py-4 text-gray-500">
                        {tx.payee_bank_name}
                        {tx.payee_country && (
                          <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{tx.payee_country}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-mono text-right text-gray-800 whitespace-nowrap">
                        {parseFloat(tx.amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                        <span className="ml-1 text-gray-400 text-xs">{tx.currency}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[tx.status] || 'bg-gray-100 text-gray-500'}`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


const STATUS_STYLES = {
  pending:   'bg-yellow-50 text-yellow-700 border border-yellow-200',
  submitted: 'bg-green-50 text-green-700 border border-green-200',
  rejected:  'bg-red-50 text-red-600 border border-red-200',
};

function maskAccount(num) {
  if (!num || num.length <= 4) return num;
  return '\u2022'.repeat(num.length - 4) + num.slice(-4);
}

export default function CustomerDashboard() {
  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([client.get('/auth/me'), client.get('/transactions')])
      .then(([meRes, txRes]) => {
        setCustomer(meRes.data);
        setTransactions(txRes.data.transactions);
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, [navigate]);

  async function logout() {
    await client.post('/auth/logout');
    navigate('/login');
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
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">SAIINT BANK INC</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard/pay')}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              + New Payment
            </button>
            <button onClick={logout} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Account card */}
        <div className="relative bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 text-white rounded-2xl p-7 shadow-xl overflow-hidden select-none">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-blue-500/10 rounded-full" />
          <div className="absolute -bottom-12 -left-12 w-52 h-52 bg-blue-600/10 rounded-full" />
          <div className="relative">
            <div className="flex justify-between items-start mb-10">
              <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">SAIINT BANK INC</p>
              <span className="flex items-center gap-1.5 text-xs bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full font-medium">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                Active
              </span>
            </div>
            <p className="text-lg font-semibold tracking-wide mb-1">{customer?.full_name}</p>
            <p className="font-mono text-gray-300 text-base tracking-[0.2em] mb-8">
              {customer?.account_number ? maskAccount(customer.account_number) : '••••••••••'}
            </p>
            <div className="flex justify-between items-end text-xs">
              <div>
                <p className="text-gray-500 uppercase tracking-widest mb-0.5">Account Type</p>
                <p className="text-gray-300">International Payments</p>
              </div>
              {customer?.member_since && (
                <div className="text-right">
                  <p className="text-gray-500 uppercase tracking-widest mb-0.5">Member Since</p>
                  <p className="text-gray-300">
                    {new Date(customer.member_since).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-semibold text-gray-800">Transaction History</h2>
            <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
            </span>
          </div>
          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 mb-3 text-sm">No transactions yet.</p>
              <button
                onClick={() => navigate('/dashboard/pay')}
                className="text-blue-600 hover:underline text-sm font-medium"
              >
                Make your first payment →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Date</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Payee</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Bank</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Amount</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-4 text-gray-400 whitespace-nowrap text-xs">
                        {new Date(tx.created_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-800">{tx.payee_name}</td>
                      <td className="px-5 py-4 text-gray-500">
                        {tx.payee_bank_name}
                        {tx.payee_country && (
                          <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{tx.payee_country}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-mono text-right text-gray-800 whitespace-nowrap">
                        {parseFloat(tx.amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                        <span className="ml-1 text-gray-400 text-xs">{tx.currency}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[tx.status] || 'bg-gray-100 text-gray-500'}`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
