import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { LogOut, MapPin, Navigation, Clock, Star, DollarSign, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import io from 'socket.io-client';
import SimpleMap from '../../components/SimpleMap';
import SimpleTrackingMap from '../../components/SimpleTrackingMap';
import { calculateFare } from '../../config/maps';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [currentRide, setCurrentRide] = useState(null);
  const [rideHistory, setRideHistory] = useState([]);
  const [showBooking, setShowBooking] = useState(false);
  const [socket, setSocket] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  
  const [bookingData, setBookingData] = useState({
    pickup_location: '',
    pickup_latitude: null,
    pickup_longitude: null,
    dropoff_location: '',
    dropoff_latitude: null,
    dropoff_longitude: null,
    distance: 0
  });

  useEffect(() => {
    fetchCurrentRide();
    fetchRideHistory();

    // Setup socket connection
    const newSocket = io('http://localhost:5000');
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

    // Listen for driver location updates
    newSocket.on('driver_location_update', (data) => {
      if (currentRide && data.driverId === currentRide.driver_id) {
        setDriverLocation({
          lat: data.latitude,
          lng: data.longitude
        });
      }
    });

    return () => newSocket.close();
  }, [user.id]);

  const fetchCurrentRide = async () => {
    try {
      const response = await api.get('/rides/user/current');
      setCurrentRide(response.data.ride);
      
      // If ride has driver location, set it
      if (response.data.ride?.driver_latitude && response.data.ride?.driver_longitude) {
        setDriverLocation({
          lat: response.data.ride.driver_latitude,
          lng: response.data.ride.driver_longitude
        });
      }
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

  const handleLocationSelect = (type, data) => {
    if (type === 'pickup') {
      setBookingData(prev => ({
        ...prev,
        pickup_location: data.address,
        pickup_latitude: data.lat,
        pickup_longitude: data.lng
      }));
    } else if (type === 'dropoff') {
      setBookingData(prev => ({
        ...prev,
        dropoff_location: data.address,
        dropoff_latitude: data.lat,
        dropoff_longitude: data.lng
      }));
    } else if (type === 'route') {
      setBookingData(prev => ({
        ...prev,
        distance: data.distance
      }));
      toast.info(`Distance: ${data.distance.toFixed(2)} km, Duration: ${data.duration}`);
    }
  };

  // Simple distance calculation using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleBookRide = async (e) => {
    e.preventDefault();

    if (!bookingData.pickup_latitude || !bookingData.dropoff_latitude) {
      toast.error('Please select both pickup and dropoff locations on the map');
      return;
    }

    if (bookingData.distance === 0) {
      toast.error('Distance calculation failed. Please reselect locations.');
      return;
    }

    try {
      await api.post('/rides/create', bookingData);
      toast.success('Ride requested! Searching for drivers...');
      setShowBooking(false);
      fetchCurrentRide();
      // Reset booking data
      setBookingData({
        pickup_location: '',
        pickup_latitude: null,
        pickup_longitude: null,
        dropoff_location: '',
        dropoff_latitude: null,
        dropoff_longitude: null,
        distance: 0
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

  const estimatedFare = bookingData.distance > 0 ? calculateFare(bookingData.distance) : 0;

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

      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left Column - Ride Information */}
          <div className="lg:col-span-1 space-y-4">
            {/* Current Ride */}
            {currentRide ? (
              <div className="card">
                <h2 className="text-xl font-bold mb-4">Current Ride</h2>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-600">Pickup</p>
                      <p className="font-semibold text-sm break-words">{currentRide.pickup_location}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Navigation className="w-5 h-5 text-red-500 mr-2 mt-1 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-600">Dropoff</p>
                      <p className="font-semibold text-sm break-words">{currentRide.dropoff_location}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className={`px-3 py-1 rounded-full text-xs md:text-sm font-semibold ${getStatusColor(currentRide.status)}`}>
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
              <div className="card text-center">
                <p className="text-gray-600 mb-4">No active ride</p>
                <button
                  onClick={() => setShowBooking(true)}
                  className="btn-primary w-full"
                >
                  Book a Ride
                </button>
              </div>
            )}

            {/* Ride History - Compact for mobile */}
            <div className="card hidden lg:block">
              <h2 className="text-xl font-bold mb-4">Ride History</h2>
              {rideHistory.length === 0 ? (
                <p className="text-gray-600 text-center py-4">No rides yet</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {rideHistory.slice(0, 10).map((ride) => (
                    <div key={ride.id} className="border-b pb-3 last:border-b-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{ride.pickup_location}</p>
                          <p className="text-xs text-gray-500 truncate">→ {ride.dropoff_location}</p>
                          <p className="text-xs text-gray-500 flex items-center mt-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(ride.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right ml-2">
                          <p className="font-bold text-primary">K {ride.final_fare || ride.estimated_fare}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(ride.status)}`}>
                            {ride.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Map */}
          <div className="lg:col-span-2">
            {currentRide ? (
              <div className="card p-0 overflow-hidden" style={{ height: '600px' }}>
                <SimpleTrackingMap
                  pickup={{
                    lat: currentRide.pickup_latitude,
                    lng: currentRide.pickup_longitude,
                    address: currentRide.pickup_location
                  }}
                  dropoff={{
                    lat: currentRide.dropoff_latitude,
                    lng: currentRide.dropoff_longitude,
                    address: currentRide.dropoff_location
                  }}
                  driverLocation={driverLocation}
                  rideStatus={currentRide.status}
                />
              </div>
            ) : (
              <div className="card">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Book Your Ride</h2>
                  {showBooking && (
                    <button
                      onClick={() => setShowBooking(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  )}
                </div>

                {showBooking || !currentRide ? (
                  <form onSubmit={handleBookRide} className="space-y-4">
                    <SimpleMap
                      onLocationSelect={handleLocationSelect}
                    />

                    {bookingData.pickup_location && bookingData.dropoff_location && (
                      <div className="bg-gradient-to-r from-primary to-orange-600 text-white p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm opacity-90">Estimated Fare</p>
                            <p className="text-3xl font-bold">K {estimatedFare.toFixed(2)}</p>
                            <p className="text-xs opacity-75 mt-1">
                              Distance: {bookingData.distance.toFixed(2)} km
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs opacity-75">Base: K15</p>
                            <p className="text-xs opacity-75">Per km: K8</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button 
                        type="submit" 
                        className="btn-primary flex-1"
                        disabled={!bookingData.pickup_latitude || !bookingData.dropoff_latitude}
                      >
                        Request Ride
                      </button>
                      {!currentRide && (
                        <button
                          type="button"
                          onClick={() => setShowBooking(false)}
                          className="btn-secondary flex-1"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600 mb-4">Click "Book a Ride" to get started</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Ride History */}
        <div className="card lg:hidden mt-4">
          <h2 className="text-xl font-bold mb-4">Ride History</h2>
          {rideHistory.length === 0 ? (
            <p className="text-gray-600 text-center py-4">No rides yet</p>
          ) : (
            <div className="space-y-3">
              {rideHistory.slice(0, 5).map((ride) => (
                <div key={ride.id} className="border-b pb-3 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{ride.pickup_location}</p>
                      <p className="text-xs text-gray-500 truncate">→ {ride.dropoff_location}</p>
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(ride.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right ml-2">
                      <p className="font-bold text-primary text-sm">K {ride.final_fare || ride.estimated_fare}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(ride.status)}`}>
                        {ride.status}
                      </span>
                    </div>
                  </div>
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
