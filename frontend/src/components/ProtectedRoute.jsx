import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import client from '../api/client';

export default function ProtectedRoute({ children, role = 'customer' }) {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const endpoint = role === 'employee' ? '/auth/employee/me' : '/auth/me';
    client.get(endpoint)
      .then(() => setStatus('ok'))
      .catch(() => setStatus('unauth'));
  }, [role]);

  if (status === 'loading') return <div className="p-8 text-center">Loading…</div>;
  if (status === 'unauth') {
    return <Navigate to={role === 'employee' ? '/employee/login' : '/login'} replace />;
  }
  return children;
}
