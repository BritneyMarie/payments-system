import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CHF', 'AUD', 'CAD', 'ZAR', 'NGN'];

export default function TransactionForm() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  async function onSubmit(data) {
    try {
      const res = await client.post('/transactions', { ...data, amount: parseFloat(data.amount) });
      setSuccess(res.data.transaction);
      reset();
    } catch (err) {
      alert(err.response?.data?.error || 'Transaction submission failed');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">International Payment</h1>
          <button
            onClick={() => { client.post('/auth/logout'); navigate('/login'); }}
            className="text-sm text-gray-500 hover:underline"
          >
            Log out
          </button>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded p-4 mb-6 text-green-800">
            Payment submitted successfully. Transaction ID: <strong>{success.id}</strong>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border rounded px-3 py-2"
                  {...register('amount', { required: true, min: 0.01, max: 999999999.99 })}
                />
                {errors.amount && <p className="text-red-500 text-xs mt-1">Valid amount required</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Currency</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  {...register('currency', { required: true })}
                >
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payee Full Name</label>
              <input
                className="w-full border rounded px-3 py-2"
                {...register('payee_name', { required: true, maxLength: 100 })}
              />
              {errors.payee_name && <p className="text-red-500 text-xs mt-1">Payee name is required</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payee Account Number</label>
              <input
                className="w-full border rounded px-3 py-2"
                {...register('payee_account', { required: true, pattern: /^\d{8,34}$/ })}
              />
              {errors.payee_account && <p className="text-red-500 text-xs mt-1">8–34 digit account number</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SWIFT / BIC Code</label>
              <input
                className="w-full border rounded px-3 py-2 uppercase"
                placeholder="AAAABBCC"
                {...register('swift_code', {
                  required: true,
                  pattern: { value: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, message: 'Invalid SWIFT code' },
                  setValueAs: v => v.toUpperCase(),
                })}
              />
              {errors.swift_code && <p className="text-red-500 text-xs mt-1">{errors.swift_code.message || 'Required'}</p>}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting…' : 'Submit Payment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
