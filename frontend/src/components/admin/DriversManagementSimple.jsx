import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Car, Search, CheckCircle, XCircle, Clock, AlertTriangle,
  RefreshCw, Eye, Trash2, Phone, Mail, Star
} from 'lucide-react';
import api from '../../utils/api';

const DriversManagementSimple = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/drivers');
      console.log('Drivers response:', response.data);
      setDrivers(response.data.drivers || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setError(error.response?.data?.error || error.message);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  const updateDriverStatus = async (driverId, status) => {
    try {
      await api.put(`/admin/drivers/${driverId}/status`, { status });
      toast.success(`Driver ${status} successfully`);
      fetchDrivers();
    } catch (error) {
      console.error('Update status error:', error);
      toast.error('Failed to update driver status');
    }
  };

  const deleteDriver = async (driverId) => {
    if (!window.confirm('Are you sure you want to delete this driver?')) return;

    try {
      await api.delete(`/admin/drivers/${driverId}`);
      toast.success('Driver deleted successfully');
      fetchDrivers();
    } catch (error) {
      console.error('Delete driver error:', error);
      toast.error('Failed to delete driver');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      suspended: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.phone?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: drivers.length,
    pending: drivers.filter(d => d.status === 'pending').length,
    approved: drivers.filter(d => d.status === 'approved').length,
    rejected: drivers.filter(d => d.status === 'rejected').length,
    suspended: drivers.filter(d => d.status === 'suspended').length
  };

  if (loading) {
    return (
      <div className="card text-center py-8">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
        <p className="text-gray-600">Loading drivers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Car className="w-6 h-6 text-blue-500 mr-3" />
          <div>
            <h2 className="text-2xl font-bold">Drivers Management</h2>
            <p className="text-gray-600">Review applications and manage driver accounts</p>
          </div>
        </div>
        <button
          onClick={fetchDrivers}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Car className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-blue-600">Total Drivers</p>
              <p className="text-2xl font-bold text-blue-700">{statusCounts.all}</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-sm text-yellow-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-700">{statusCounts.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-green-600">Approved</p>
              <p className="text-2xl font-bold text-green-700">{statusCounts.approved}</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="w-8 h-8 text-red-500 mr-3" />
            <div>
              <p className="text-sm text-red-600">Rejected</p>
              <p className="text-2xl font-bold text-red-700">{statusCounts.rejected}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-gray-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Suspended</p>
              <p className="text-2xl font-bold text-gray-700">{statusCounts.suspended}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center text-red-700">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <strong>Error loading drivers:</strong> {error}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search drivers by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status ({statusCounts.all})</option>
            <option value="pending">Pending ({statusCounts.pending})</option>
            <option value="approved">Approved ({statusCounts.approved})</option>
            <option value="rejected">Rejected ({statusCounts.rejected})</option>
            <option value="suspended">Suspended ({statusCounts.suspended})</option>
          </select>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Driver</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Vehicle</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">License</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rating</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    <Car className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium">No drivers found</p>
                    <p className="text-sm">
                      {searchTerm || statusFilter !== 'all'
                        ? 'Try adjusting your search or filters' 
                        : 'Drivers will appear here when they register'
                      }
                    </p>
                  </td>
                </tr>
              ) : (
                filteredDrivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center mr-3">
                          {driver.name?.charAt(0).toUpperCase() || 'D'}
                        </div>
                        <div>
                          <p className="font-semibold">{driver.name || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">ID: {driver.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="truncate">{driver.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {driver.phone || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="font-medium">{driver.vehicle_model || 'N/A'}</p>
                        <p className="text-gray-500">{driver.vehicle_plate || 'N/A'}</p>
                        <p className="text-xs text-gray-400">{driver.vehicle_color || ''}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono">{driver.license_number || 'N/A'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                        <span className="capitalize">{driver.status || 'unknown'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        <span className="text-sm font-medium">{(driver.rating || 5.0).toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        {driver.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateDriverStatus(driver.id, 'approved')}
                              className="text-green-600 hover:text-green-800 p-1"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updateDriverStatus(driver.id, 'rejected')}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {driver.status === 'approved' && (
                          <button
                            onClick={() => updateDriverStatus(driver.id, 'suspended')}
                            className="text-orange-600 hover:text-orange-800 p-1 text-xs"
                            title="Suspend"
                          >
                            Suspend
                          </button>
                        )}
                        <button
                          onClick={() => deleteDriver(driver.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete Driver"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DriversManagementSimple;
