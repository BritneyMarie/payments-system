import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CustomerRegister from './pages/CustomerRegister';
import CustomerLogin from './pages/CustomerLogin';
import MfaSetup from './pages/MfaSetup';
import MfaVerify from './pages/MfaVerify';
import TransactionForm from './pages/TransactionForm';
import EmployeeLogin from './pages/EmployeeLogin';
import EmployeePortal from './pages/EmployeePortal';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<CustomerRegister />} />
        <Route path="/login" element={<CustomerLogin />} />
        <Route path="/mfa/setup" element={<MfaSetup />} />
        <Route path="/mfa/verify" element={<MfaVerify />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role="customer">
              <TransactionForm />
            </ProtectedRoute>
          }
        />
        <Route path="/employee/login" element={<EmployeeLogin />} />
        <Route
          path="/employee/portal"
          element={
            <ProtectedRoute role="employee">
              <EmployeePortal />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
