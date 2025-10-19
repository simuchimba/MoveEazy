import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Car, Search, Filter, CheckCircle, XCircle, Clock, AlertTriangle,
  RefreshCw, Download, Eye, Trash2, MoreVertical, Phone, Mail,
  User, CreditCard, Calendar, Star, Pause, Play
} from 'lucide-react';
import api from '../../utils/api';

const DriversManagement = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedDrivers, setSelectedDrivers] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDriverModal, setShowDriverModal] = useState(false);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/drivers');
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
      toast.error('Failed to update driver status');
    }
  };

  const deleteDriver = async (driverId) => {
    if (!window.confirm('Are you sure you want to delete this driver? This action cannot be undone.')) return;

    try {
      await api.delete(`/admin/drivers/${driverId}`);
      toast.success('Driver deleted successfully');
      fetchDrivers();
    } catch (error) {
      toast.error('Failed to delete driver');
    }
  };

  const bulkUpdateStatus = async (status) => {
    if (selectedDrivers.length === 0) return;
    if (!window.confirm(`Are you sure you want to ${status} ${selectedDrivers.length} drivers?`)) return;

    try {
      await Promise.all(selectedDrivers.map(id => api.put(`/admin/drivers/${id}/status`, { status })));
      toast.success(`${selectedDrivers.length} drivers ${status} successfully`);
      setSelectedDrivers([]);
      fetchDrivers();
    } catch (error) {
      console.error('Bulk update error:', error);
      toast.error('Failed to update drivers');
    }
  };

  const exportDrivers = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'License', 'Vehicle', 'Status', 'Rating', 'Joined Date'],
      ...filteredDrivers.map(driver => [
        driver.name,
        driver.email,
        driver.phone,
        driver.license_number,
        `${driver.vehicle_model} (${driver.vehicle_plate})`,
        driver.status,
        driver.rating || '5.0',
        new Date(driver.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drivers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      suspended: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'suspended': return <Pause className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.phone.includes(searchTerm) ||
                         driver.license_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.vehicle_plate.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;

    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    
    if (sortBy === 'created_at') {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    }
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedDrivers(filteredDrivers.map(driver => driver.id));
    } else {
      setSelectedDrivers([]);
    }
  };

  const handleSelectDriver = (driverId, checked) => {
    if (checked) {
      setSelectedDrivers([...selectedDrivers, driverId]);
    } else {
      setSelectedDrivers(selectedDrivers.filter(id => id !== driverId));
    }
  };

  const viewDriverDetails = (driver) => {
    setSelectedDriver(driver);
    setShowDriverModal(true);
  };

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
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-gray-600">Loading drivers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Car className="w-6 h-6 text-primary mr-3" />
          <div>
            <h2 className="text-2xl font-bold">Drivers Management</h2>
            <p className="text-gray-600">Review applications and manage driver accounts</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportDrivers}
            className="btn-secondary flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={fetchDrivers}
            className="btn-primary flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center">
            <Car className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-blue-600">Total Drivers</p>
              <p className="text-2xl font-bold text-blue-700">{statusCounts.all}</p>
            </div>
          </div>
        </div>
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-sm text-yellow-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-700">{statusCounts.pending}</p>
            </div>
          </div>
        </div>
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-green-600">Approved</p>
              <p className="text-2xl font-bold text-green-700">{statusCounts.approved}</p>
            </div>
          </div>
        </div>
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center">
            <XCircle className="w-8 h-8 text-red-500 mr-3" />
            <div>
              <p className="text-sm text-red-600">Rejected</p>
              <p className="text-2xl font-bold text-red-700">{statusCounts.rejected}</p>
            </div>
          </div>
        </div>
        <div className="card bg-gray-50 border-gray-200">
          <div className="flex items-center">
            <Pause className="w-8 h-8 text-gray-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Suspended</p>
              <p className="text-2xl font-bold text-gray-700">{statusCounts.suspended}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center text-red-700">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <strong>Error loading drivers:</strong> {error}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search drivers by name, email, phone, license, or plate..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">All Status ({statusCounts.all})</option>
            <option value="pending">Pending ({statusCounts.pending})</option>
            <option value="approved">Approved ({statusCounts.approved})</option>
            <option value="rejected">Rejected ({statusCounts.rejected})</option>
            <option value="suspended">Suspended ({statusCounts.suspended})</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedDrivers.length > 0 && (
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <p className="text-yellow-800">
              <strong>{selectedDrivers.length}</strong> drivers selected
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => bulkUpdateStatus('approved')}
                className="btn-success flex items-center text-sm"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve
              </button>
              <button
                onClick={() => bulkUpdateStatus('rejected')}
                className="btn-danger flex items-center text-sm"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </button>
              <button
                onClick={() => bulkUpdateStatus('suspended')}
                className="btn-secondary flex items-center text-sm"
              >
                <Pause className="w-4 h-4 mr-1" />
                Suspend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drivers Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedDrivers.length === filteredDrivers.length && filteredDrivers.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded"
                  />
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  Driver {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Vehicle
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  License
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Rating
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('created_at')}
                >
                  Applied {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
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
                      <input
                        type="checkbox"
                        checked={selectedDrivers.includes(driver.id)}
                        onChange={(e) => handleSelectDriver(driver.id, e.target.checked)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center mr-3">
                          {driver.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold">{driver.name}</p>
                          <p className="text-sm text-gray-500">ID: {driver.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="truncate">{driver.email}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {driver.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="font-medium">{driver.vehicle_model}</p>
                        <p className="text-gray-500">{driver.vehicle_plate}</p>
                        <p className="text-xs text-gray-400">{driver.vehicle_color}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono">{driver.license_number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(driver.status)}`}>
                        {getStatusIcon(driver.status)}
                        <span className="ml-1 capitalize">{driver.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        <span className="text-sm font-medium">{(driver.rating || 5.0).toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(driver.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => viewDriverDetails(driver)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
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
                            className="text-orange-600 hover:text-orange-800 p-1"
                            title="Suspend"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        )}
                        {driver.status === 'suspended' && (
                          <button
                            onClick={() => updateDriverStatus(driver.id, 'approved')}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Reactivate"
                          >
                            <Play className="w-4 h-4" />
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

      {/* Driver Details Modal */}
      {showDriverModal && selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Driver Details</h3>
              <button
                onClick={() => setShowDriverModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Personal Information</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {selectedDriver.name}</p>
                  <p><strong>Email:</strong> {selectedDriver.email}</p>
                  <p><strong>Phone:</strong> {selectedDriver.phone}</p>
                  <p><strong>Joined:</strong> {new Date(selectedDriver.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Vehicle Information</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Model:</strong> {selectedDriver.vehicle_model}</p>
                  <p><strong>Type:</strong> {selectedDriver.vehicle_type}</p>
                  <p><strong>Plate:</strong> {selectedDriver.vehicle_plate}</p>
                  <p><strong>Color:</strong> {selectedDriver.vehicle_color}</p>
                  <p><strong>License:</strong> {selectedDriver.license_number}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Status & Performance</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Status:</strong> 
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedDriver.status)}`}>
                      {getStatusIcon(selectedDriver.status)}
                      <span className="ml-1 capitalize">{selectedDriver.status}</span>
                    </span>
                  </p>
                  <p><strong>Rating:</strong> {(selectedDriver.rating || 5.0).toFixed(1)} ⭐</p>
                  <p><strong>Total Rides:</strong> {selectedDriver.total_rides || 0}</p>
                  <p><strong>Available:</strong> {selectedDriver.is_available ? 'Yes' : 'No'}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  {selectedDriver.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          updateDriverStatus(selectedDriver.id, 'approved');
                          setShowDriverModal(false);
                        }}
                        className="btn-success flex items-center text-sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          updateDriverStatus(selectedDriver.id, 'rejected');
                          setShowDriverModal(false);
                        }}
                        className="btn-danger flex items-center text-sm"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </button>
                    </div>
                  )}
                  {selectedDriver.status === 'approved' && (
                    <button
                      onClick={() => {
                        updateDriverStatus(selectedDriver.id, 'suspended');
                        setShowDriverModal(false);
                      }}
                      className="btn-secondary flex items-center text-sm"
                    >
                      <Pause className="w-4 h-4 mr-1" />
                      Suspend
                    </button>
                  )}
                  {selectedDriver.status === 'suspended' && (
                    <button
                      onClick={() => {
                        updateDriverStatus(selectedDriver.id, 'approved');
                        setShowDriverModal(false);
                      }}
                      className="btn-success flex items-center text-sm"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Reactivate
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriversManagement;
