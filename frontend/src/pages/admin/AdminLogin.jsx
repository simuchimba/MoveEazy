import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  // Check for stored credentials
  const getStoredCredentials = () => {
    const stored = localStorage.getItem('adminCredentials');
    return stored ? JSON.parse(stored) : null;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if custom credentials are stored
      const storedCredentials = localStorage.getItem('adminCredentials');
      
      if (storedCredentials) {
        const credentials = JSON.parse(storedCredentials);
        
        // If credentials are provided, validate them
        if (formData.email || formData.password) {
          if (formData.email !== credentials.email || formData.password !== credentials.password) {
            toast.error('Invalid credentials. Please check your email and password.');
            setLoading(false);
            return;
          }
        }
        
        // Use stored credentials
        const adminUser = {
          id: 1,
          name: credentials.name,
          email: credentials.email,
          role: 'admin'
        };
        
        const token = 'admin-access-token-' + Date.now();
        login(adminUser, token, 'admin');
        toast.success(`Welcome back, ${credentials.name}!`);
      } else {
        // No stored credentials - direct access
        const mockAdmin = {
          id: 1,
          name: 'Admin',
          email: formData.email || 'admin@yango.com',
          role: 'admin'
        };
        
        const mockToken = 'admin-access-token-' + Date.now();
        login(mockAdmin, mockToken, 'admin');
        toast.success('Admin access granted! Set up your credentials in Settings.');
      }
      
      // Navigate to dashboard
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 100);
    } catch (error) {
      toast.error('Access failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center text-white mb-6 hover:underline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <div className="card">
          <div className="flex justify-center mb-6">
            <div className="bg-gray-100 p-4 rounded-full">
              <Shield className="w-12 h-12 text-gray-800" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-center mb-6">Admin Portal</h2>
          <p className="text-center text-gray-600 mb-6">Direct access to admin dashboard</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email (Optional)</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="admin@yango.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password (Optional)</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter any password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Accessing Dashboard...' : 'Access Admin Dashboard'}
            </button>
          </form>
          
          {getStoredCredentials() && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Stored Credentials Found</h4>
              <p className="text-sm text-green-700 mb-2">
                <strong>Email:</strong> {getStoredCredentials().email}
              </p>
              <p className="text-xs text-green-600">
                Enter your credentials above to login, or click the button to access directly.
              </p>
            </div>
          )}
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 text-center">
              <strong>Note:</strong> Click the button above to access the admin dashboard directly. 
              You can set your custom login credentials from the dashboard settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
