import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

const CURRENCIES = [
  'ZAR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY',
  'SGD', 'HKD', 'NZD', 'SEK', 'NOK', 'DKK', 'INR', 'MXN', 'BRL', 'PLN',
];

const COUNTRIES = [
  { code: 'AU', name: 'Australia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CA', name: 'Canada' },
  { code: 'CN', name: 'China' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'IN', name: 'India' },
  { code: 'KE', name: 'Kenya' },
  { code: 'JP', name: 'Japan' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'NO', name: 'Norway' },
  { code: 'PL', name: 'Poland' },
  { code: 'SG', name: 'Singapore' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'ZW', name: 'Zimbabwe' },
];

export default function TransactionForm() {
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { currency: 'USD' },
  });
  const [zarRate, setZarRate] = useState(null);
  const [rateLoading, setRateLoading] = useState(false);
  const navigate = useNavigate();

  const selectedCurrency = watch('currency');

  useEffect(() => {
    if (!selectedCurrency || selectedCurrency === 'ZAR') {
      setZarRate(null);
      return;
    }
    setRateLoading(true);
    setZarRate(null);
    client.get(`/exchange-rates?from=${selectedCurrency}`)
      .then(res => {
        const rate = res.data?.rates?.ZAR;
        setZarRate(rate ?? null);
      })
      .catch(() => setZarRate(null))
      .finally(() => setRateLoading(false));
  }, [selectedCurrency]);

  async function onSubmit(data) {
    try {
      await client.post('/transactions', { ...data, amount: parseFloat(data.amount) });
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.error || 'Transaction submission failed');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-6 py-4 flex justify-between items-center">
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">SAIINT BANK INC</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">New Payment</h1>
        <p className="text-gray-500 text-sm mb-6">Send an international payment securely.</p>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Amount + Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  {...register('amount', { required: true, min: 0.01, max: 1000000 })}
                />
                {errors.amount && <p className="text-red-500 text-xs mt-1">0.01 – 1,000,000</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  {...register('currency', { required: true })}
                >
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* ZAR exchange rate hint */}
            {selectedCurrency && selectedCurrency !== 'ZAR' && (
              <div className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 -mt-2">
                {rateLoading && 'Fetching exchange rate…'}
                {!rateLoading && zarRate !== null && (
                  <span>Indicative rate: 1 {selectedCurrency} ≈ <strong>{zarRate.toFixed(4)}</strong> ZAR</span>
                )}
                {!rateLoading && zarRate === null && 'Exchange rate unavailable'}
              </div>
            )}

            {/* Payee details */}
            <fieldset className="space-y-4">
              <legend className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Payee Details</legend>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payee Full Name</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  {...register('payee_name', { required: true, maxLength: 100 })}
                />
                {errors.payee_name && <p className="text-red-500 text-xs mt-1">Required</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payee Account Number</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="8–34 digits"
                  {...register('payee_account', { required: true, pattern: /^\d{8,34}$/ })}
                />
                {errors.payee_account && <p className="text-red-500 text-xs mt-1">8–34 digit number required</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payee Bank Name</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  {...register('payee_bank_name', { required: true, maxLength: 100 })}
                />
                {errors.payee_bank_name && <p className="text-red-500 text-xs mt-1">Required</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch / Routing Code</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="4–11 digits"
                    {...register('payee_branch_code', { required: true, pattern: /^\d{4,11}$/ })}
                  />
                  {errors.payee_branch_code && <p className="text-red-500 text-xs mt-1">4–11 digits required</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payee Country</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    {...register('payee_country', { required: true })}
                  >
                    <option value="">Select…</option>
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                  {errors.payee_country && <p className="text-red-500 text-xs mt-1">Required</p>}
                </div>
              </div>
            </fieldset>

            {/* References */}
            <fieldset className="space-y-4">
              <legend className="text-xs font-semibold text-gray-400 uppercase tracking-widest">References <span className="font-normal normal-case text-gray-400">(optional)</span></legend>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sender Reference</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Max 35 chars"
                    {...register('sender_reference', { maxLength: 35 })}
                  />
                  {errors.sender_reference && <p className="text-red-500 text-xs mt-1">Max 35 characters</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Receiver Reference</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Max 35 chars"
                    {...register('receiver_reference', { maxLength: 35 })}
                  />
                  {errors.receiver_reference && <p className="text-red-500 text-xs mt-1">Max 35 characters</p>}
                </div>
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-sm transition-colors"
            >
              {isSubmitting ? 'Submitting…' : 'Submit Payment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

