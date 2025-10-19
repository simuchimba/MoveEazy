import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'lucide-react';
import api from '../../utils/api';

const DriverRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    license_number: '',
    vehicle_type: 'sedan',
    vehicle_model: '',
    vehicle_plate: '',
    vehicle_color: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      await api.post('/auth/driver/register', registerData);
      toast.success('Registration submitted! Awaiting admin approval.');
      setTimeout(() => navigate('/driver/login'), 2000);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-orange-700 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <Link to="/" className="inline-flex items-center text-white mb-6 hover:underline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <div className="card">
          <h2 className="text-3xl font-bold text-center mb-6">Driver Registration</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="+260..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">License Number</label>
                <input
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Vehicle Type</label>
                <select
                  name="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="hatchback">Hatchback</option>
                  <option value="van">Van</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Vehicle Model</label>
                <input
                  type="text"
                  name="vehicle_model"
                  value={formData.vehicle_model}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Toyota Corolla"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Vehicle Plate Number</label>
                <input
                  type="text"
                  name="vehicle_plate"
                  value={formData.vehicle_plate}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., ABC 1234"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Vehicle Color</label>
                <input
                  type="text"
                  name="vehicle_color"
                  value={formData.vehicle_color}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field"
                  required
                  minLength="6"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Your application will be reviewed by our admin team. 
                You'll be notified once approved.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            Already registered?{' '}
            <Link to="/driver/login" className="text-primary font-semibold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DriverRegister;
