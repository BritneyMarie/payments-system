import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

export default function EmployeePortal() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  function load() {
    client.get('/portal/transactions')
      .then(res => setTransactions(res.data.transactions))
      .catch(() => alert('Failed to load transactions'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleAction(id, action) {
    try {
      await client.post(`/portal/transactions/${id}/${action}`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed');
    }
  }

  async function logout() {
    await client.post('/auth/logout');
    navigate('/employee/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Pending Transactions</h1>
          <button onClick={logout} className="text-sm text-gray-500 hover:underline">Log out</button>
        </div>

        {loading && <p className="text-gray-500">Loading…</p>}
        {!loading && transactions.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No pending transactions.
          </div>
        )}

        {!loading && transactions.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Payee</th>
                  <th className="px-4 py-3 text-left">Account</th>
                  <th className="px-4 py-3 text-left">SWIFT</th>
                  <th className="px-4 py-3 text-left">Submitted</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{tx.customer_name}</td>
                    <td className="px-4 py-3 font-mono">{tx.amount} {tx.currency}</td>
                    <td className="px-4 py-3">{tx.payee_name}</td>
                    <td className="px-4 py-3 font-mono">{tx.payee_account}</td>
                    <td className="px-4 py-3 font-mono">{tx.swift_code}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(tx.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 space-x-2">
                      <button
                        onClick={() => handleAction(tx.id, 'submit')}
                        className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                      >
                        Submit to SWIFT
                      </button>
                      <button
                        onClick={() => handleAction(tx.id, 'reject')}
                        className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
