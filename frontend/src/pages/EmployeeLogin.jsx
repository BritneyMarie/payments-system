import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

export default function EmployeeLogin() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const navigate = useNavigate();

  async function onSubmit(data) {
    try {
      await client.post('/auth/employee/login', data);
      navigate('/employee/portal');
    } catch (err) {
      alert(err.response?.data?.error || 'Login failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow w-full max-w-md">
        <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1 text-center">SAIINT BANK INC</p>
        <h1 className="text-2xl font-bold mb-2 text-center">Staff Portal</h1>
        <p className="text-center text-gray-500 text-sm mb-6">Authorised personnel only</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              className="w-full border rounded px-3 py-2"
              {...register('username', { required: true })}
            />
            {errors.username && <p className="text-red-500 text-xs mt-1">Username required</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2"
              {...register('password', { required: true })}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">Password required</p>}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gray-800 text-white py-2 rounded hover:bg-gray-900 disabled:opacity-50"
          >
            {isSubmitting ? 'Logging in…' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}
