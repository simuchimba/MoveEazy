import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import HomePage from './pages/HomePage';
import UserLogin from './pages/user/UserLogin';
import UserRegister from './pages/user/UserRegister';
import UserDashboard from './pages/user/UserDashboardWithMap';
import DriverLogin from './pages/driver/DriverLogin';
import DriverRegister from './pages/driver/DriverRegister';
import DriverDashboard from './pages/driver/DriverDashboardWithMap';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

// Protected Route Component
const ProtectedRoute = ({ children, requiredType }) => {
  const { user, userType } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Check if userType is still loading (null/undefined)
  if (requiredType && !userType) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (requiredType && userType !== requiredType) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
            <Route path="/" element={<HomePage />} />
            
            {/* User Routes */}
            <Route path="/user/login" element={<UserLogin />} />
            <Route path="/user/register" element={<UserRegister />} />
            <Route 
              path="/user/dashboard" 
              element={
                <ProtectedRoute requiredType="user">
                  <UserDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Driver Routes */}
            <Route path="/driver/login" element={<DriverLogin />} />
            <Route path="/driver/register" element={<DriverRegister />} />
            <Route 
              path="/driver/dashboard" 
              element={
                <ProtectedRoute requiredType="driver">
                  <DriverDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute requiredType="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ToastContainer position="top-right" autoClose={3000} />
        </div>
      </Router>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
