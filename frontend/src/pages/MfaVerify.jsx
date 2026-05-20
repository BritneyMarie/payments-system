import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

export default function MfaVerify() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const navigate = useNavigate();

  async function onSubmit({ otp }) {
    try {
      await client.post('/auth/mfa/verify', { otp });
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.error || 'OTP verification failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold mb-4">Two-Factor Verification</h1>
        <p className="text-gray-600 mb-6">Enter the 6-digit code from your authenticator app.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input
            className="w-full border rounded px-3 py-2 text-center text-2xl tracking-widest"
            maxLength={6}
            placeholder="000000"
            {...register('otp', { required: true, pattern: /^\d{6}$/ })}
          />
          {errors.otp && <p className="text-red-500 text-xs">Enter a valid 6-digit code</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Verifying…' : 'Verify'}
          </button>
        </form>
      </div>
    </div>
  );
}
