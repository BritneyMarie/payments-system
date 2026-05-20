import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client';

export default function CustomerLogin() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const navigate = useNavigate();

  async function onSubmit(data) {
    try {
      const res = await client.post('/auth/login', data);
      if (res.data.mfa_required) {
        navigate('/mfa/verify');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Login failed');
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
          <h2 className="text-3xl font-bold leading-tight mb-3">
            Welcome back.<br />
            <span className="text-blue-400">Your money, secured.</span>
          </h2>
          <p className="text-gray-500 text-sm">Log in to access your account and make international payments.</p>
        </div>
        <p className="text-xs text-gray-700">© {new Date().getFullYear()} SAIINT BANK INC</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link to="/" className="text-xs font-semibold tracking-widest text-gray-400 uppercase">SAIINT BANK INC</Link>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Online Banking</h1>
          <p className="text-gray-500 text-sm mb-8">Sign in to your account.</p>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Enter your account number"
                  {...register('account_number', { required: true, pattern: /^\d{8,16}$/ })}
                />
                {errors.account_number && <p className="text-red-500 text-xs mt-1">Valid account number required</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  {...register('password', { required: true })}
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">Password is required</p>}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-sm transition-colors"
              >
                {isSubmitting ? 'Logging in…' : 'Log In'}
              </button>
            </form>
          </div>

          <p className="mt-5 text-center text-sm text-gray-500">
            No account?{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">Open one now</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
