import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  LogOut, Users, Car, DollarSign, TrendingUp, CheckCircle, XCircle,
  Clock, AlertCircle, Settings, RefreshCw, Database
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AdminProfileSettings from '../../components/AdminProfileSettings';
import ConnectionStatus from '../../components/ConnectionStatus';
import UsersManagement from '../../components/admin/UsersManagement';
import DriversManagement from '../../components/admin/DriversTest';
import RidesManagement from '../../components/admin/RidesManagement';
import api from '../../utils/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [rides, setRides] = useState([]);
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [connectionStatus, setConnectionStatus] = useState(null);

  useEffect(() => {
    if (connectionStatus?.database === 'connected') {
      fetchAllData();
    }
  }, [connectionStatus]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchDashboardStats(),
      fetchUsers(),
      fetchDrivers(),
      fetchRides()
    ]);
    setLoading(false);
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      setStats(response.data);
      setErrors(prev => ({ ...prev, stats: null }));
    } catch (error) {
      console.error('Error fetching stats:', error);
      setErrors(prev => ({ ...prev, stats: error.response?.data?.error || error.message }));
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data.users || []);
      setErrors(prev => ({ ...prev, users: null }));
    } catch (error) {
      console.error('Error fetching users:', error);
      setErrors(prev => ({ ...prev, users: error.response?.data?.error || error.message }));
      setUsers([]);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await api.get('/admin/drivers');
      const driversData = response.data.drivers || [];
      setDrivers(driversData);
      setPendingDrivers(driversData.filter(d => d.status === 'pending'));
      setErrors(prev => ({ ...prev, drivers: null }));
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setErrors(prev => ({ ...prev, drivers: error.response?.data?.error || error.message }));
      setDrivers([]);
      setPendingDrivers([]);
    }
  };

  const fetchRides = async () => {
    try {
      const response = await api.get('/admin/rides');
      setRides(response.data.rides || []);
      setErrors(prev => ({ ...prev, rides: null }));
    } catch (error) {
      console.error('Error fetching rides:', error);
      setErrors(prev => ({ ...prev, rides: error.response?.data?.error || error.message }));
      setRides([]);
    }
  };

  const updateDriverStatus = async (driverId, status) => {
    try {
      await api.put(`/admin/drivers/${driverId}/status`, { status });
      toast.success(`Driver ${status} successfully`);
      fetchDrivers();
      fetchDashboardStats();
    } catch (error) {
      toast.error('Failed to update driver status');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted successfully');
      fetchUsers();
      fetchDashboardStats();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const deleteDriver = async (driverId) => {
    if (!window.confirm('Are you sure you want to delete this driver?')) return;

    try {
      await api.delete(`/admin/drivers/${driverId}`);
      toast.success('Driver deleted successfully');
      fetchDrivers();
      fetchDashboardStats();
    } catch (error) {
      toast.error('Failed to delete driver');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Helper function to safely format currency
  const formatCurrency = (value) => {
    return typeof value === 'number' ? value.toFixed(2) : '0.00';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      suspended: 'bg-gray-100 text-gray-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      accepted: 'bg-blue-100 text-blue-800',
      picked_up: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-800 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">MovEazy Admin Dashboard</h1>
              <p className="text-sm text-gray-300">Welcome, {user.name}</p>
            </div>
            <button onClick={handleLogout} className="flex items-center hover:text-gray-300">
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Connection Status */}
        <ConnectionStatus onConnectionChange={setConnectionStatus} />

        {/* Loading State */}
        {loading && connectionStatus?.database === 'connected' && (
          <div className="card text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        )}

        {/* Database Connection Required */}
        {connectionStatus?.database !== 'connected' && !loading && (
          <div className="card bg-yellow-50 border border-yellow-200 text-center py-8">
            <Database className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Database Connection Required</h3>
            <p className="text-yellow-700 mb-4">
              The admin dashboard requires a database connection to display real data.
            </p>
            <p className="text-sm text-yellow-600">
              Please check the connection status above and follow the troubleshooting steps.
            </p>
          </div>
        )}

        {/* Stats Overview */}
        {stats && connectionStatus?.database === 'connected' && (
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Users</p>
                  <p className="text-3xl font-bold">{stats.users}</p>
                </div>
                <Users className="w-12 h-12 opacity-50" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Drivers</p>
                  <p className="text-3xl font-bold">{stats.drivers}</p>
                  <p className="text-xs opacity-75">{stats.active_drivers} active</p>
                </div>
                <Car className="w-12 h-12 opacity-50" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Rides</p>
                  <p className="text-3xl font-bold">{stats.total_rides}</p>
                  <p className="text-xs opacity-75">{stats.completed_rides} completed</p>
                </div>
                <TrendingUp className="w-12 h-12 opacity-50" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Revenue</p>
                  <p className="text-3xl font-bold">K {formatCurrency(stats.total_revenue)}</p>
                  <p className="text-xs opacity-75">Today: K {formatCurrency(stats.today_revenue)}</p>
                </div>
                <DollarSign className="w-12 h-12 opacity-50" />
              </div>
            </div>
          </div>
        )}

        {/* Pending Drivers Alert */}
        {pendingDrivers.length > 0 && (
          <div className="card bg-yellow-50 border border-yellow-200 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-6 h-6 text-yellow-600 mr-3" />
              <div>
                <p className="font-semibold text-yellow-800">
                  {pendingDrivers.length} driver application{pendingDrivers.length > 1 ? 's' : ''} pending approval
                </p>
                <button
                  onClick={() => setActiveTab('drivers')}
                  className="text-sm text-yellow-700 hover:underline"
                >
                  Review now →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        {connectionStatus?.database === 'connected' && (
          <div className="mb-6">
            <div className="flex space-x-1 border-b">
              {['overview', 'users', 'drivers', 'rides', 'settings'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 font-semibold capitalize flex items-center ${
                    activeTab === tab
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {tab === 'settings' && <Settings className="w-4 h-4 mr-2" />}
                  {tab}
                  {/* Show error indicator */}
                  {errors[tab] && tab !== 'settings' && (
                    <AlertCircle className="w-3 h-3 ml-1 text-red-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && stats && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-bold mb-4">Today's Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Rides Today</span>
                  <span className="font-semibold">{stats.today_rides}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Revenue Today</span>
                  <span className="font-semibold">K {formatCurrency(stats.today_revenue)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Active Rides</span>
                  <span className="font-semibold">{stats.active_rides}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pending Drivers</span>
                  <span className="font-semibold">{stats.pending_drivers}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-bold mb-4">Platform Health</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Active Drivers</span>
                  <span className="font-semibold text-green-600">{stats.active_drivers}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Total Users</span>
                  <span className="font-semibold">{stats.users}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Total Drivers</span>
                  <span className="font-semibold">{stats.drivers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Completion Rate</span>
                  <span className="font-semibold">
                    {stats.total_rides > 0 ? ((stats.completed_rides / stats.total_rides) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && connectionStatus?.database === 'connected' && (
          <UsersManagement />
        )}

        {activeTab === 'drivers' && connectionStatus?.database === 'connected' && (
          <DriversManagement />
        )}

        {activeTab === 'rides' && connectionStatus?.database === 'connected' && (
          <RidesManagement />
        )}

        {activeTab === 'settings' && (
          <AdminProfileSettings />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
