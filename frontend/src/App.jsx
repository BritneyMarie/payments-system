import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CustomerRegister from './pages/CustomerRegister';
import CustomerLogin from './pages/CustomerLogin';
import MfaSetup from './pages/MfaSetup';
import MfaVerify from './pages/MfaVerify';
import CustomerDashboard from './pages/CustomerDashboard';
import CustomerProfile from './pages/CustomerProfile';
import TransactionForm from './pages/TransactionForm';
import EmployeeLogin from './pages/EmployeeLogin';
import EmployeePortal from './pages/EmployeePortal';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<CustomerRegister />} />
        <Route path="/login" element={<CustomerLogin />} />
        <Route path="/mfa/setup" element={<MfaSetup />} />
        <Route path="/mfa/verify" element={<MfaVerify />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role="customer">
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/pay"
          element={
            <ProtectedRoute role="customer">
              <TransactionForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/profile"
          element={
            <ProtectedRoute role="customer">
              <CustomerProfile />
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


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<CustomerRegister />} />
        <Route path="/login" element={<CustomerLogin />} />
        <Route path="/mfa/setup" element={<MfaSetup />} />
        <Route path="/mfa/verify" element={<MfaVerify />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role="customer">
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/pay"
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
