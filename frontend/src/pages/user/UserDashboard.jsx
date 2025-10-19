import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { LogOut, MapPin, Navigation, Clock, Star, DollarSign } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import io from 'socket.io-client';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [currentRide, setCurrentRide] = useState(null);
  const [rideHistory, setRideHistory] = useState([]);
  const [showBooking, setShowBooking] = useState(false);
  const [socket, setSocket] = useState(null);
  
  const [bookingData, setBookingData] = useState({
    pickup_location: '',
    pickup_latitude: -15.4167,
    pickup_longitude: 28.2833,
    dropoff_location: '',
    dropoff_latitude: -15.4167,
    dropoff_longitude: 28.2833,
    distance: 5
  });

  useEffect(() => {
    fetchCurrentRide();
    fetchRideHistory();

    // Setup socket connection
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    setSocket(newSocket);

    newSocket.emit('user_join', user.id);

    newSocket.on(`ride_accepted_${user.id}`, () => {
      toast.success('Driver accepted your ride!');
      fetchCurrentRide();
    });

    newSocket.on(`ride_status_${user.id}`, (data) => {
      toast.info(`Ride status updated: ${data.status}`);
      fetchCurrentRide();
    });

    return () => newSocket.close();
  }, [user.id]);

  const fetchCurrentRide = async () => {
    try {
      const response = await api.get('/rides/user/current');
      setCurrentRide(response.data.ride);
    } catch (error) {
      console.error('Error fetching current ride:', error);
    }
  };

  const fetchRideHistory = async () => {
    try {
      const response = await api.get('/rides/user/history');
      setRideHistory(response.data.rides);
    } catch (error) {
      console.error('Error fetching ride history:', error);
    }
  };

  const handleBookRide = async (e) => {
    e.preventDefault();
    try {
      await api.post('/rides/create', bookingData);
      toast.success('Ride requested! Searching for drivers...');
      setShowBooking(false);
      fetchCurrentRide();
      setBookingData({
        pickup_location: '',
        pickup_latitude: -15.4167,
        pickup_longitude: 28.2833,
        dropoff_location: '',
        dropoff_latitude: -15.4167,
        dropoff_longitude: 28.2833,
        distance: 5
      });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to book ride');
    }
  };

  const handleCancelRide = async (rideId) => {
    if (!window.confirm('Are you sure you want to cancel this ride?')) return;

    try {
      await api.put(`/rides/cancel/${rideId}`);
      toast.success('Ride cancelled');
      fetchCurrentRide();
      fetchRideHistory();
    } catch (error) {
      toast.error('Failed to cancel ride');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      picked_up: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary">MovEazy</h1>
            <p className="text-sm text-gray-600">Welcome, {user.name}</p>
          </div>
          <button onClick={handleLogout} className="flex items-center text-gray-600 hover:text-primary">
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Current Ride */}
        {currentRide ? (
          <div className="card mb-6">
            <h2 className="text-xl font-bold mb-4">Current Ride</h2>
            <div className="space-y-3">
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-green-500 mr-2 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Pickup</p>
                  <p className="font-semibold">{currentRide.pickup_location}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Navigation className="w-5 h-5 text-red-500 mr-2 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Dropoff</p>
                  <p className="font-semibold">{currentRide.dropoff_location}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(currentRide.status)}`}>
                  {currentRide.status.toUpperCase()}
                </span>
                <span className="text-lg font-bold text-primary">
                  K {currentRide.estimated_fare || currentRide.final_fare}
                </span>
              </div>
              {currentRide.driver_name && (
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-600">Driver</p>
                  <p className="font-semibold">{currentRide.driver_name}</p>
                  <p className="text-sm">{currentRide.vehicle_model} - {currentRide.vehicle_plate}</p>
                  <p className="text-sm">{currentRide.driver_phone}</p>
                </div>
              )}
              {currentRide.status === 'pending' && (
                <button
                  onClick={() => handleCancelRide(currentRide.id)}
                  className="btn-secondary w-full mt-3"
                >
                  Cancel Ride
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="card mb-6 text-center">
            <p className="text-gray-600 mb-4">No active ride</p>
            <button
              onClick={() => setShowBooking(!showBooking)}
              className="btn-primary"
            >
              Book a Ride
            </button>
          </div>
        )}

        {/* Booking Form */}
        {showBooking && !currentRide && (
          <div className="card mb-6">
            <h2 className="text-xl font-bold mb-4">Book a Ride</h2>
            <form onSubmit={handleBookRide} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Pickup Location</label>
                <input
                  type="text"
                  value={bookingData.pickup_location}
                  onChange={(e) => setBookingData({ ...bookingData, pickup_location: e.target.value })}
                  className="input-field"
                  placeholder="Enter pickup address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Dropoff Location</label>
                <input
                  type="text"
                  value={bookingData.dropoff_location}
                  onChange={(e) => setBookingData({ ...bookingData, dropoff_location: e.target.value })}
                  className="input-field"
                  placeholder="Enter destination"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Estimated Distance (km)</label>
                <input
                  type="number"
                  value={bookingData.distance}
                  onChange={(e) => setBookingData({ ...bookingData, distance: parseFloat(e.target.value) })}
                  className="input-field"
                  min="0.1"
                  step="0.1"
                  required
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Estimated Fare</p>
                <p className="text-2xl font-bold text-primary">
                  K {(15 + (bookingData.distance * 8)).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Base fare: K15 + K8 per km</p>
              </div>

              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">
                  Request Ride
                </button>
                <button
                  type="button"
                  onClick={() => setShowBooking(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Ride History */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Ride History</h2>
          {rideHistory.length === 0 ? (
            <p className="text-gray-600 text-center py-4">No rides yet</p>
          ) : (
            <div className="space-y-3">
              {rideHistory.slice(0, 10).map((ride) => (
                <div key={ride.id} className="border-b pb-3 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{ride.pickup_location} → {ride.dropoff_location}</p>
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(ride.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">K {ride.final_fare || ride.estimated_fare}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(ride.status)}`}>
                        {ride.status}
                      </span>
                    </div>
                  </div>
                  {ride.driver_name && (
                    <p className="text-xs text-gray-600">Driver: {ride.driver_name}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
