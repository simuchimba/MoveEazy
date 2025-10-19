import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  TrendingUp, Search, Filter, MapPin, Navigation, Clock, DollarSign,
  RefreshCw, Download, Eye, Calendar, User, Car, CheckCircle, XCircle,
  AlertTriangle, Pause, Play, MoreVertical
} from 'lucide-react';
import api from '../../utils/api';

const RidesManagement = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedRide, setSelectedRide] = useState(null);
  const [showRideModal, setShowRideModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    minFare: '',
    maxFare: '',
    paymentMethod: 'all'
  });

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/rides');
      setRides(response.data.rides || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching rides:', error);
      setError(error.response?.data?.error || error.message);
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  const exportRides = () => {
    const csvContent = [
      ['ID', 'User', 'Driver', 'Pickup', 'Dropoff', 'Distance', 'Fare', 'Status', 'Payment', 'Date'],
      ...filteredRides.map(ride => [
        ride.id,
        ride.user_name,
        ride.driver_name || 'N/A',
        ride.pickup_location,
        ride.dropoff_location,
        ride.distance || 'N/A',
        ride.final_fare || ride.estimated_fare,
        ride.status,
        ride.payment_method,
        new Date(ride.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rides_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      accepted: 'bg-blue-100 text-blue-800 border-blue-200',
      picked_up: 'bg-purple-100 text-purple-800 border-purple-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'picked_up': return <Car className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getPaymentStatusColor = (status) => {
    return status === 'completed' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-yellow-100 text-yellow-800';
  };

  const filteredRides = rides.filter(ride => {
    const matchesSearch = ride.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ride.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ride.pickup_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ride.dropoff_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ride.id.toString().includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || ride.status === statusFilter;
    
    const matchesDate = (() => {
      const rideDate = new Date(ride.created_at);
      const now = new Date();
      switch (dateFilter) {
        case 'today':
          return rideDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return rideDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return rideDate >= monthAgo;
        default:
          return true;
      }
    })();

    const matchesDateFrom = !filters.dateFrom || new Date(ride.created_at) >= new Date(filters.dateFrom);
    const matchesDateTo = !filters.dateTo || new Date(ride.created_at) <= new Date(filters.dateTo);
    const matchesMinFare = !filters.minFare || (ride.final_fare || ride.estimated_fare) >= parseFloat(filters.minFare);
    const matchesMaxFare = !filters.maxFare || (ride.final_fare || ride.estimated_fare) <= parseFloat(filters.maxFare);
    const matchesPayment = filters.paymentMethod === 'all' || ride.payment_method === filters.paymentMethod;

    return matchesSearch && matchesStatus && matchesDate && matchesDateFrom && 
           matchesDateTo && matchesMinFare && matchesMaxFare && matchesPayment;
  }).sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    
    if (sortBy === 'created_at') {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    } else if (sortBy === 'final_fare') {
      aVal = a.final_fare || a.estimated_fare || 0;
      bVal = b.final_fare || b.estimated_fare || 0;
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

  const viewRideDetails = (ride) => {
    setSelectedRide(ride);
    setShowRideModal(true);
  };

  const statusCounts = {
    all: rides.length,
    pending: rides.filter(r => r.status === 'pending').length,
    accepted: rides.filter(r => r.status === 'accepted').length,
    picked_up: rides.filter(r => r.status === 'picked_up').length,
    completed: rides.filter(r => r.status === 'completed').length,
    cancelled: rides.filter(r => r.status === 'cancelled').length
  };

  const totalRevenue = rides
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + (r.final_fare || 0), 0);

  const todayRevenue = rides
    .filter(r => r.status === 'completed' && new Date(r.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, r) => sum + (r.final_fare || 0), 0);

  if (loading) {
    return (
      <div className="card text-center py-8">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-gray-600">Loading rides...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <TrendingUp className="w-6 h-6 text-primary mr-3" />
          <div>
            <h2 className="text-2xl font-bold">Rides Management</h2>
            <p className="text-gray-600">Monitor all ride activities and transactions</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportRides}
            className="btn-secondary flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={fetchRides}
            className="btn-primary flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-blue-600">Total Rides</p>
              <p className="text-2xl font-bold text-blue-700">{statusCounts.all}</p>
            </div>
          </div>
        </div>
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-green-600">Completed</p>
              <p className="text-2xl font-bold text-green-700">{statusCounts.completed}</p>
            </div>
          </div>
        </div>
        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-purple-500 mr-3" />
            <div>
              <p className="text-sm text-purple-600">Total Revenue</p>
              <p className="text-2xl font-bold text-purple-700">K {totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="card bg-orange-50 border-orange-200">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-orange-500 mr-3" />
            <div>
              <p className="text-sm text-orange-600">Today's Revenue</p>
              <p className="text-2xl font-bold text-orange-700">K {todayRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center text-red-700">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <strong>Error loading rides:</strong> {error}
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
              placeholder="Search rides by ID, user, driver, or location..."
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
            <option value="accepted">Accepted ({statusCounts.accepted})</option>
            <option value="picked_up">Picked Up ({statusCounts.picked_up})</option>
            <option value="completed">Completed ({statusCounts.completed})</option>
            <option value="cancelled">Cancelled ({statusCounts.cancelled})</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center ${showFilters ? 'bg-primary text-white' : ''}`}
          >
            <Filter className="w-4 h-4 mr-2" />
            More Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium mb-1">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min Fare (K)</label>
              <input
                type="number"
                value={filters.minFare}
                onChange={(e) => setFilters({...filters, minFare: e.target.value})}
                className="input-field"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Fare (K)</label>
              <input
                type="number"
                value={filters.maxFare}
                onChange={(e) => setFilters({...filters, maxFare: e.target.value})}
                className="input-field"
                placeholder="1000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment Method</label>
              <select
                value={filters.paymentMethod}
                onChange={(e) => setFilters({...filters, paymentMethod: e.target.value})}
                className="input-field"
              >
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="mobile_money">Mobile Money</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Rides Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('id')}
                >
                  Ride ID {sortBy === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Participants
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Route
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('final_fare')}
                >
                  Fare {sortBy === 'final_fare' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Payment
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('created_at')}
                >
                  Date {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRides.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium">No rides found</p>
                    <p className="text-sm">
                      {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' || Object.values(filters).some(f => f)
                        ? 'Try adjusting your search or filters' 
                        : 'Rides will appear here when users book trips'
                      }
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRides.map((ride) => (
                  <tr key={ride.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-mono text-sm">
                        <p className="font-semibold">#{ride.id}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(ride.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <User className="w-4 h-4 mr-2 text-blue-500" />
                          <span className="font-medium">{ride.user_name}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Car className="w-4 h-4 mr-2 text-green-500" />
                          <span className="text-gray-600">{ride.driver_name || 'No driver'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1 text-sm">
                        <div className="flex items-start">
                          <MapPin className="w-4 h-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="truncate max-w-xs">{ride.pickup_location}</span>
                        </div>
                        <div className="flex items-start">
                          <Navigation className="w-4 h-4 mr-2 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="truncate max-w-xs">{ride.dropoff_location}</span>
                        </div>
                        {ride.distance && (
                          <p className="text-xs text-gray-500 ml-6">{ride.distance} km</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="font-semibold">K {(ride.final_fare || ride.estimated_fare || 0).toFixed(2)}</p>
                        {ride.final_fare && ride.estimated_fare && ride.final_fare !== ride.estimated_fare && (
                          <p className="text-xs text-gray-500">Est: K {ride.estimated_fare.toFixed(2)}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(ride.status)}`}>
                        {getStatusIcon(ride.status)}
                        <span className="ml-1 capitalize">{ride.status.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="capitalize">{ride.payment_method?.replace('_', ' ')}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(ride.payment_status)}`}>
                          {ride.payment_status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(ride.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => viewRideDetails(ride)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ride Details Modal */}
      {showRideModal && selectedRide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Ride Details - #{selectedRide.id}</h3>
              <button
                onClick={() => setShowRideModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Ride Information</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Ride ID:</strong> #{selectedRide.id}</p>
                  <p><strong>Status:</strong> 
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedRide.status)}`}>
                      {getStatusIcon(selectedRide.status)}
                      <span className="ml-1 capitalize">{selectedRide.status.replace('_', ' ')}</span>
                    </span>
                  </p>
                  <p><strong>Distance:</strong> {selectedRide.distance || 'N/A'} km</p>
                  <p><strong>Created:</strong> {new Date(selectedRide.created_at).toLocaleString()}</p>
                  {selectedRide.updated_at && (
                    <p><strong>Updated:</strong> {new Date(selectedRide.updated_at).toLocaleString()}</p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Participants</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <p><strong>User:</strong> {selectedRide.user_name}</p>
                    <p className="text-gray-600">Phone: {selectedRide.user_phone}</p>
                  </div>
                  <div>
                    <p><strong>Driver:</strong> {selectedRide.driver_name || 'Not assigned'}</p>
                    {selectedRide.driver_phone && (
                      <p className="text-gray-600">Phone: {selectedRide.driver_phone}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Payment Details</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Method:</strong> {selectedRide.payment_method?.replace('_', ' ')}</p>
                  <p><strong>Status:</strong> 
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(selectedRide.payment_status)}`}>
                      {selectedRide.payment_status}
                    </span>
                  </p>
                  <p><strong>Estimated Fare:</strong> K {(selectedRide.estimated_fare || 0).toFixed(2)}</p>
                  <p><strong>Final Fare:</strong> K {(selectedRide.final_fare || selectedRide.estimated_fare || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="font-semibold mb-3">Route Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800">Pickup Location</p>
                      <p className="text-sm text-green-700">{selectedRide.pickup_location}</p>
                      {selectedRide.pickup_latitude && selectedRide.pickup_longitude && (
                        <p className="text-xs text-green-600 mt-1">
                          {selectedRide.pickup_latitude}, {selectedRide.pickup_longitude}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex items-start">
                    <Navigation className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800">Dropoff Location</p>
                      <p className="text-sm text-red-700">{selectedRide.dropoff_location}</p>
                      {selectedRide.dropoff_latitude && selectedRide.dropoff_longitude && (
                        <p className="text-xs text-red-600 mt-1">
                          {selectedRide.dropoff_latitude}, {selectedRide.dropoff_longitude}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {selectedRide.rating && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Feedback</h4>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p><strong>Rating:</strong> {selectedRide.rating}/5 ⭐</p>
                  {selectedRide.feedback && (
                    <p className="mt-2"><strong>Feedback:</strong> {selectedRide.feedback}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RidesManagement;
