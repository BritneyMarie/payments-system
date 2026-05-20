import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

const STATUS_CLS = {
  pending:   'bg-yellow-50 text-yellow-700 border border-yellow-200',
  submitted: 'bg-green-50 text-green-700 border border-green-200',
  rejected:  'bg-red-50 text-red-600 border border-red-200',
};

function StatCard({ label, value, sub, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-50 border-blue-100 text-blue-700',
    yellow: 'bg-amber-50 border-amber-100 text-amber-700',
    green:  'bg-green-50 border-green-100 text-green-700',
    red:    'bg-red-50 border-red-100 text-red-600',
  };
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-widest opacity-60 mb-1">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
      {sub && <p className="text-xs opacity-50 mt-1">{sub}</p>}
    </div>
  );
}

export default function EmployeePortal() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [pendingTx, setPendingTx] = useState([]);
  const [allTx, setAllTx] = useState([]);
  const [txFilter, setTxFilter] = useState('all');
  const [customers, setCustomers] = useState([]);
  const [custSearch, setCustSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [custTx, setCustTx] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadOverview(); }, []);

  async function loadOverview() {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([
        client.get('/portal/stats'),
        client.get('/portal/transactions'),
      ]);
      setStats(s.data);
      setPendingTx(t.data.transactions);
    } catch {
      navigate('/employee/login');
    } finally {
      setLoading(false);
    }
  }

  async function loadAllTx(status) {
    const url = status === 'all' ? '/portal/all-transactions' : `/portal/all-transactions?status=${status}`;
    const res = await client.get(url);
    setAllTx(res.data.transactions);
  }

  async function loadCustomers(q = '') {
    const url = q ? `/portal/customers?q=${encodeURIComponent(q)}` : '/portal/customers';
    const res = await client.get(url);
    setCustomers(res.data.customers);
  }

  async function loadAuditLog() {
    const res = await client.get('/portal/audit-log');
    setAuditLog(res.data.logs);
  }

  async function expandCustomer(id) {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    const res = await client.get(`/portal/customers/${id}/transactions`);
    setCustTx(res.data.transactions);
  }

  async function toggleStatus(id) {
    await client.post(`/portal/customers/${id}/toggle-status`);
    loadCustomers(custSearch);
    client.get('/portal/stats').then(s => setStats(s.data));
  }

  async function approveTx(id, from) {
    setActionLoading(true);
    try {
      await client.post(`/portal/transactions/${id}/submit`);
      if (from === 'overview') { await loadOverview(); }
      else { await loadAllTx(txFilter); client.get('/portal/stats').then(s => setStats(s.data)); }
    } finally { setActionLoading(false); }
  }

  async function rejectTx(id, from) {
    setActionLoading(true);
    try {
      await client.post(`/portal/transactions/${id}/reject`);
      if (from === 'overview') { await loadOverview(); }
      else { await loadAllTx(txFilter); client.get('/portal/stats').then(s => setStats(s.data)); }
    } finally { setActionLoading(false); }
  }

  function switchTab(t) {
    setTab(t);
    if (t === 'transactions') loadAllTx(txFilter);
    if (t === 'customers') loadCustomers();
    if (t === 'audit') loadAuditLog();
  }

  async function logout() {
    await client.post('/auth/logout').catch(() => {});
    navigate('/employee/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loadingâ€¦</p>
      </div>
    );
  }

  const TABS = [
    { id: 'overview',     label: 'Overview' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'customers',    label: 'Customers' },
    { id: 'audit',        label: 'Audit Log' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* â”€â”€ Header â”€â”€ */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold tracking-[0.2em] text-gray-800 uppercase">SAIINT BANK</span>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-medium">Staff Portal</span>
          </div>
          <button onClick={logout} className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
            Sign out
          </button>
        </div>

        {/* Tab bar */}
        <div className="max-w-7xl mx-auto px-6 flex gap-0 border-t border-gray-100">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                tab === t.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.label}
              {t.id === 'overview' && stats?.pending_count > 0 && (
                <span className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full font-semibold">
                  {stats.pending_count}
                </span>
              )}
              {t.id === 'overview' && stats?.flagged_count > 0 && (
                <span className="bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full font-semibold">
                  {stats.flagged_count}âš‘
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* â•â•â•â•â•â•â•â• OVERVIEW â•â•â•â•â•â•â•â• */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Customers" value={stats?.total_customers ?? 'â€”'} color="blue" />
              <StatCard label="Pending Review"  value={stats?.pending_count ?? 'â€”'}   sub="awaiting action"   color="yellow" />
              <StatCard
                label="Today's Volume"
                value={`R ${(stats?.today_volume ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`}
                color="green"
              />
              <StatCard label="Flagged" value={stats?.flagged_count ?? 'â€”'} sub="high-value pending" color="red" />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-800">Pending Transactions</h2>
                {pendingTx.length > 0 && (
                  <span className="text-xs text-gray-400">{pendingTx.length} awaiting review</span>
                )}
              </div>
              {pendingTx.length === 0 ? (
                <p className="p-10 text-center text-gray-400 text-sm">All clear â€” no pending transactions.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        <th className="px-4 py-3 text-left">Customer</th>
                        <th className="px-4 py-3 text-left">Payee</th>
                        <th className="px-4 py-3 text-left">Bank / Country</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {pendingTx.map(tx => (
                        <tr key={tx.id} className={`hover:bg-gray-50/70 ${tx.flagged ? 'bg-red-50/40' : ''}`}>
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {tx.customer_name}
                            {tx.flagged && (
                              <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">
                                HIGH VALUE
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{tx.payee_name}</td>
                          <td className="px-4 py-3 text-gray-500">
                            {tx.payee_bank_name}
                            {tx.payee_country && (
                              <span className="ml-1.5 text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">
                                {tx.payee_country}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-right text-gray-800 whitespace-nowrap">
                            {parseFloat(tx.amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                            <span className="ml-1 text-xs text-gray-400">{tx.currency}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                            {new Date(tx.created_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => approveTx(tx.id, 'overview')}
                                disabled={actionLoading}
                                className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => rejectTx(tx.id, 'overview')}
                                disabled={actionLoading}
                                className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* â•â•â•â•â•â•â•â• ALL TRANSACTIONS â•â•â•â•â•â•â•â• */}
        {tab === 'transactions' && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {['all', 'pending', 'submitted', 'rejected'].map(s => (
                <button
                  key={s}
                  onClick={() => { setTxFilter(s); loadAllTx(s); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                    txFilter === s
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {allTx.length === 0 ? (
                <p className="p-10 text-center text-gray-400 text-sm">No transactions found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Customer</th>
                        <th className="px-4 py-3 text-left">Payee</th>
                        <th className="px-4 py-3 text-left">Bank / Country</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {allTx.map(tx => (
                        <tr key={tx.id} className={`hover:bg-gray-50/70 ${tx.flagged ? 'bg-red-50/20' : ''}`}>
                          <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                            {new Date(tx.created_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {tx.customer_name}
                            {tx.flagged && <span className="ml-1.5 text-xs text-red-500 font-bold">âš‘</span>}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{tx.payee_name}</td>
                          <td className="px-4 py-3 text-gray-500">
                            {tx.payee_bank_name}
                            {tx.payee_country && (
                              <span className="ml-1.5 text-xs bg-gray-100 text-gray-400 px-1 py-0.5 rounded">
                                {tx.payee_country}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-right text-gray-800 whitespace-nowrap">
                            {parseFloat(tx.amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                            <span className="ml-1 text-xs text-gray-400">{tx.currency}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_CLS[tx.status] || 'bg-gray-100 text-gray-500'}`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {tx.status === 'pending' && (
                              <div className="flex justify-center gap-2">
                                <button onClick={() => approveTx(tx.id, 'all')} disabled={actionLoading}
                                  className="bg-green-600 text-white px-2.5 py-1 rounded text-xs font-semibold hover:bg-green-700 disabled:opacity-50">
                                  Approve
                                </button>
                                <button onClick={() => rejectTx(tx.id, 'all')} disabled={actionLoading}
                                  className="bg-red-500 text-white px-2.5 py-1 rounded text-xs font-semibold hover:bg-red-600 disabled:opacity-50">
                                  Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* â•â•â•â•â•â•â•â• CUSTOMERS â•â•â•â•â•â•â•â• */}
        {tab === 'customers' && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Search by name or account numberâ€¦"
              value={custSearch}
              onChange={e => { setCustSearch(e.target.value); loadCustomers(e.target.value); }}
              className="w-full max-w-sm border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {customers.length === 0 ? (
                <p className="p-10 text-center text-gray-400 text-sm">No customers found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        <th className="px-4 py-3 text-left">Name</th>
                        <th className="px-4 py-3 text-left">Account</th>
                        <th className="px-4 py-3 text-right">Balance (ZAR)</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Member Since</th>
                        <th className="px-4 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.flatMap(c => {
                        const rows = [
                          <tr
                            key={c.id}
                            className="border-b border-gray-50 hover:bg-gray-50/70 cursor-pointer"
                            onClick={() => expandCustomer(c.id)}
                          >
                            <td className="px-4 py-3 font-medium text-gray-800">
                              {c.full_name}
                              <span className="ml-2 text-gray-300 text-xs">{expandedId === c.id ? 'â–²' : 'â–¼'}</span>
                            </td>
                            <td className="px-4 py-3 font-mono text-gray-500 text-xs tracking-widest">
                              {'â€¢â€¢â€¢â€¢ â€¢â€¢â€¢â€¢ '}{c.account_number.slice(-4)}
                            </td>
                            <td className="px-4 py-3 font-mono text-right text-gray-800">
                              {parseFloat(c.balance).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                                c.account_status === 'active'
                                  ? 'bg-green-50 text-green-700 border border-green-200'
                                  : 'bg-red-50 text-red-600 border border-red-200'
                              }`}>
                                {c.account_status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs">
                              {new Date(c.created_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => toggleStatus(c.id)}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                                  c.account_status === 'active'
                                    ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                                    : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                                }`}
                              >
                                {c.account_status === 'active' ? 'Suspend' : 'Activate'}
                              </button>
                            </td>
                          </tr>,
                        ];

                        if (expandedId === c.id) {
                          rows.push(
                            <tr key={`${c.id}-exp`} className="border-b border-gray-100">
                              <td colSpan={6} className="bg-gray-50/80 px-8 py-5">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                                  Transaction History â€” {c.full_name}
                                </p>
                                {custTx.length === 0 ? (
                                  <p className="text-sm text-gray-400 italic">No transactions on record.</p>
                                ) : (
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="text-gray-400 uppercase tracking-wide">
                                        <th className="pb-2 text-left font-semibold">Date</th>
                                        <th className="pb-2 text-left font-semibold">Payee</th>
                                        <th className="pb-2 text-left font-semibold">Bank</th>
                                        <th className="pb-2 text-right font-semibold">Amount</th>
                                        <th className="pb-2 text-left font-semibold">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {custTx.map(tx => (
                                        <tr key={tx.id}>
                                          <td className="py-2 text-gray-400">
                                            {new Date(tx.created_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
                                          </td>
                                          <td className="py-2 text-gray-700 font-medium">{tx.payee_name}</td>
                                          <td className="py-2 text-gray-500">{tx.payee_bank_name}</td>
                                          <td className="py-2 font-mono text-right text-gray-700">
                                            {parseFloat(tx.amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                                            <span className="ml-1 text-gray-400">{tx.currency}</span>
                                          </td>
                                          <td className="py-2">
                                            <span className={`inline-block px-2 py-0.5 rounded-full font-semibold capitalize ${STATUS_CLS[tx.status] || 'bg-gray-100 text-gray-500'}`}>
                                              {tx.status}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </td>
                            </tr>
                          );
                        }
                        return rows;
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* â•â•â•â•â•â•â•â• AUDIT LOG â•â•â•â•â•â•â•â• */}
        {tab === 'audit' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {auditLog.length === 0 ? (
              <p className="p-10 text-center text-gray-400 text-sm">No audit entries yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      <th className="px-4 py-3 text-left">Time</th>
                      <th className="px-4 py-3 text-left">Employee</th>
                      <th className="px-4 py-3 text-left">Action</th>
                      <th className="px-4 py-3 text-left">Entity</th>
                      <th className="px-4 py-3 text-left">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {auditLog.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50/70">
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('en-ZA', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-700">{log.employee_username}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                            log.action.includes('approve') ? 'bg-green-50 text-green-700' :
                            log.action.includes('reject')  ? 'bg-red-50 text-red-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs capitalize">{log.entity_type}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                          {log.details ? JSON.stringify(log.details) : 'â€”'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
