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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              className="w-full border rounded px-3 py-2"
              {...register('full_name', { required: true, maxLength: 100 })}
            />
            {errors.full_name && <p className="text-red-500 text-xs mt-1">Full name is required</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ID Number</label>
            <input
              className="w-full border rounded px-3 py-2"
              {...register('id_number', { required: true, pattern: /^[A-Za-z0-9]{6,13}$/ })}
            />
            {errors.id_number && <p className="text-red-500 text-xs mt-1">6–13 alphanumeric characters</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Account Number</label>
            <input
              className="w-full border rounded px-3 py-2"
              {...register('account_number', { required: true, pattern: /^\d{8,16}$/ })}
            />
            {errors.account_number && <p className="text-red-500 text-xs mt-1">8–16 digits</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2"
              {...register('password', {
                required: true,
                minLength: 12,
                validate: v =>
                  (/[A-Z]/.test(v) && /[a-z]/.test(v) && /\d/.test(v) && /[^A-Za-z0-9]/.test(v)) ||
                  'Must contain upper, lower, digit, and special character',
              })}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message || 'Min 12 chars with upper, lower, digit, and special character'}</p>}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Registering…' : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
