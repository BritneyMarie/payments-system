import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client';

export default function CustomerRegister() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const navigate = useNavigate();

  async function onSubmit(data) {
    try {
      await client.post('/auth/register', data);
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.error || 'Registration failed');
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-gray-950 flex-col justify-between p-12 text-white">
        <Link to="/" className="text-xs font-semibold tracking-widest text-gray-400 uppercase hover:text-gray-300 transition-colors">
          SAIINT BANK INC
        </Link>
        <div>
          <h2 className="text-3xl font-bold leading-tight mb-4">
            Open your account.<br />
            <span className="text-blue-400">Start banking today.</span>
          </h2>
          <p className="text-gray-400 text-sm mb-8">
            Join thousands of customers making secure international payments.
          </p>
          <ul className="space-y-3 text-sm text-gray-300">
            {[
              'AES-256 encrypted account data',
              'Two-factor authentication (MFA)',
              'Payments to 25+ countries',
              'Live exchange rate display',
              'Same-day transaction review',
            ].map(item => (
              <li key={item} className="flex items-center gap-3">
                <span className="text-blue-400 text-base">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-gray-700">© {new Date().getFullYear()} SAIINT BANK INC</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link to="/" className="text-xs font-semibold tracking-widest text-gray-400 uppercase">SAIINT BANK INC</Link>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Open an Account</h1>
          <p className="text-gray-500 text-sm mb-8">Complete the form below to get started.</p>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">

            {/* Personal details section */}
            <div className="p-6 space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Personal Details</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="As it appears on your ID"
                  {...register('full_name', { required: true, maxLength: 100 })}
                />
                {errors.full_name && <p className="text-red-500 text-xs mt-1">Full name is required</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="6–13 alphanumeric characters"
                  {...register('id_number', { required: true, pattern: /^[A-Za-z0-9]{6,13}$/ })}
                />
                {errors.id_number && <p className="text-red-500 text-xs mt-1">6–13 alphanumeric characters required</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="8–16 digits"
                  {...register('account_number', { required: true, pattern: /^\d{8,16}$/ })}
                />
                {errors.account_number && <p className="text-red-500 text-xs mt-1">8–16 digit account number required</p>}
              </div>
            </div>

            {/* Security section */}
            <div className="p-6 space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Security</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Minimum 12 characters"
                  {...register('password', {
                    required: true,
                    minLength: 12,
                    validate: v =>
                      (/[A-Z]/.test(v) && /[a-z]/.test(v) && /\d/.test(v) && /[^A-Za-z0-9]/.test(v)) ||
                      'Must include uppercase, lowercase, digit and special character',
                  })}
                />
                {errors.password ? (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message || 'Min 12 characters required'}</p>
                ) : (
                  <p className="text-gray-400 text-xs mt-1.5">Min. 12 chars — uppercase, lowercase, digit and special character.</p>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="p-6">
              <button
                type="submit"
                disabled={isSubmitting}
                onClick={handleSubmit(onSubmit)}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-sm transition-colors"
              >
                {isSubmitting ? 'Creating account…' : 'Create Account'}
              </button>
            </div>
          </div>

          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
