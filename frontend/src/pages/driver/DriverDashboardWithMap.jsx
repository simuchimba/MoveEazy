import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { LogOut, DollarSign, Star, Car, MapPin, Navigation, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import io from 'socket.io-client';
import SimpleTrackingMap from '../../components/SimpleTrackingMap';

const DriverDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isAvailable, setIsAvailable] = useState(false);
  const [currentRide, setCurrentRide] = useState(null);
  const [availableRides, setAvailableRides] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [rideHistory, setRideHistory] = useState([]);
  const [socket, setSocket] = useState(null);
  const [myLocation, setMyLocation] = useState(null);

  useEffect(() => {
    fetchDriverProfile();
    fetchCurrentRide();
    fetchEarnings();
    fetchRideHistory();
    getCurrentLocation();

    // Setup socket connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.emit('driver_join', user.id);

    newSocket.on('new_ride_request', () => {
      toast.info('New ride available!');
      if (isAvailable && !currentRide) {
        fetchAvailableRides();
      }
    });

    newSocket.on(`ride_cancelled_${user.id}`, () => {
      toast.warning('Rider cancelled the trip');
      fetchCurrentRide();
    });

    return () => newSocket.close();
  }, [user.id]);

  useEffect(() => {
    if (isAvailable && !currentRide) {
      fetchAvailableRides();
      const interval = setInterval(fetchAvailableRides, 10000);
      return () => clearInterval(interval);
    }
  }, [isAvailable, currentRide]);

  // Track location and send updates
  useEffect(() => {
    if (!isAvailable) return;

    const locationInterval = setInterval(() => {
      getCurrentLocation();
    }, 10000); // Update every 10 seconds

    return () => clearInterval(locationInterval);
  }, [isAvailable]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setMyLocation(location);

          // Send location to server if online
          if (isAvailable) {
            try {
              await api.post('/driver/location', {
                latitude: location.lat,
                longitude: location.lng
              });
            } catch (error) {
              console.error('Error updating location:', error);
            }
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  const fetchDriverProfile = async () => {
    try {
      const response = await api.get('/driver/profile');
      setIsAvailable(response.data.driver.is_available);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchCurrentRide = async () => {
    try {
      const response = await api.get('/rides/driver/current');
      setCurrentRide(response.data.ride);
    } catch (error) {
      console.error('Error fetching current ride:', error);
    }
  };

  const fetchAvailableRides = async () => {
    try {
      const response = await api.get('/rides/available');
      setAvailableRides(response.data.rides);
    } catch (error) {
      console.error('Error fetching available rides:', error);
    }
  };

  const fetchEarnings = async () => {
    try {
      const response = await api.get('/driver/earnings');
      setEarnings(response.data);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    }
  };

  const fetchRideHistory = async () => {
    try {
      const response = await api.get('/driver/rides');
      setRideHistory(response.data.rides);
    } catch (error) {
      console.error('Error fetching ride history:', error);
    }
  };

  const toggleAvailability = async () => {
    try {
      const newStatus = !isAvailable;
      await api.post('/driver/availability', { is_available: newStatus });
      setIsAvailable(newStatus);
      toast.success(newStatus ? 'You are now available' : 'You are now offline');
      if (newStatus) {
        getCurrentLocation();
        fetchAvailableRides();
      }
    } catch (error) {
      toast.error('Failed to update availability');
    }
  };

  const acceptRide = async (rideId) => {
    try {
      await api.post(`/rides/accept/${rideId}`);
      toast.success('Ride accepted!');
      fetchCurrentRide();
      setAvailableRides([]);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to accept ride');
    }
  };

  const updateRideStatus = async (status) => {
    try {
      console.log(`Updating ride ${currentRide.id} status to ${status}`);
      await api.put(`/rides/status/${currentRide.id}`, { status });
      toast.success(`Ride status updated to ${status}`);
      
      // Refresh current ride data
      await fetchCurrentRide();
      
      if (status === 'completed') {
        console.log('Ride completed, refreshing earnings and history');
        try {
          await fetchEarnings();
          await fetchRideHistory();
          toast.success('Revenue recorded successfully!');
        } catch (refreshError) {
          console.error('Error refreshing data after completion:', refreshError);
          toast.warning('Ride completed but failed to refresh data');
        }
      }
    } catch (error) {
      console.error('Failed to update ride status:', error);
      toast.error(`Failed to update ride status: ${error.response?.data?.error || error.message}`);
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
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-primary">MovEazy Driver</h1>
              <p className="text-sm text-gray-600">Welcome, {user.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleAvailability}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  isAvailable
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              >
                {isAvailable ? '🟢 Online' : '⚫ Offline'}
              </button>
              <button onClick={handleLogout} className="flex items-center text-gray-600 hover:text-primary">
                <LogOut className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Earnings Stats */}
        {earnings && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600">Today's Earnings</p>
                  <p className="text-xl md:text-2xl font-bold text-primary">K {formatCurrency(earnings.earnings_today)}</p>
                </div>
                <DollarSign className="w-8 h-8 md:w-10 md:h-10 text-primary opacity-20" />
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600">Total Earnings</p>
                  <p className="text-xl md:text-2xl font-bold">K {formatCurrency(earnings.total_earnings)}</p>
                </div>
                <DollarSign className="w-8 h-8 md:w-10 md:h-10 text-green-500 opacity-20" />
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600">Total Rides</p>
                  <p className="text-xl md:text-2xl font-bold">{earnings.total_rides || 0}</p>
                </div>
                <Car className="w-8 h-8 md:w-10 md:h-10 text-blue-500 opacity-20" />
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600">Rating</p>
                  <p className="text-xl md:text-2xl font-bold flex items-center">
                    {user.rating || '5.0'}
                    <Star className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 ml-1" />
                  </p>
                </div>
                <Star className="w-8 h-8 md:w-10 md:h-10 text-yellow-400 opacity-20" />
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left Column - Ride Info */}
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

                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-600">Passenger</p>
                    <p className="font-semibold">{currentRide.user_name}</p>
                    <p className="text-sm">{currentRide.user_phone}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(currentRide.status)}`}>
                      {currentRide.status.toUpperCase()}
                    </span>
                    <span className="text-lg font-bold text-primary">
                      K {currentRide.estimated_fare}
                    </span>
                  </div>

                  <div className="pt-3 space-y-2">
                    {currentRide.status === 'accepted' && (
                      <button
                        onClick={() => updateRideStatus('picked_up')}
                        className="btn-primary w-full"
                      >
                        Mark as Picked Up
                      </button>
                    )}
                    {currentRide.status === 'picked_up' && (
                      <button
                        onClick={() => updateRideStatus('completed')}
                        className="btn-primary w-full"
                      >
                        Complete Ride
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : isAvailable ? (
              <div className="card">
                <h2 className="text-xl font-bold mb-4">Available Rides</h2>
                {availableRides.length === 0 ? (
                  <div className="text-center py-8">
                    <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 text-sm">
                      No rides available at the moment. You'll be notified when new rides come in.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {availableRides.map((ride) => (
                      <div key={ride.id} className="border rounded-lg p-3 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start mb-2">
                              <MapPin className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs text-gray-600">Pickup</p>
                                <p className="font-semibold text-sm truncate">{ride.pickup_location}</p>
                              </div>
                            </div>
                            <div className="flex items-start">
                              <Navigation className="w-4 h-4 text-red-500 mr-2 mt-1 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs text-gray-600">Dropoff</p>
                                <p className="font-semibold text-sm truncate">{ride.dropoff_location}</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right ml-2">
                            <p className="text-lg font-bold text-primary">K {ride.estimated_fare}</p>
                            <p className="text-xs text-gray-500">{typeof ride.distance === 'number' ? ride.distance.toFixed(1) : ride.distance || '0'} km</p>
                          </div>
                        </div>
                        <button
                          onClick={() => acceptRide(ride.id)}
                          className="btn-primary w-full text-sm"
                        >
                          Accept Ride
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="card text-center py-12">
                <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">You are currently offline</p>
                <p className="text-sm text-gray-500">Toggle to Online to start receiving ride requests</p>
              </div>
            )}

            {/* Recent Rides - Desktop only */}
            <div className="card hidden lg:block">
              <h2 className="text-xl font-bold mb-4">Recent Rides</h2>
              {rideHistory.length === 0 ? (
                <p className="text-gray-600 text-center py-4">No completed rides yet</p>
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
                  driverLocation={myLocation}
                  rideStatus={currentRide.status}
                />
              </div>
            ) : (
              <div className="card">
                <h2 className="text-xl font-bold mb-4">
                  {isAvailable ? 'Waiting for Rides' : 'Go Online to Start'}
                </h2>
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <Car className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                  {isAvailable ? (
                    <>
                      <p className="text-gray-600 mb-2">You are online and ready to accept rides</p>
                      <p className="text-sm text-gray-500">New ride requests will appear automatically</p>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-600 mb-2">You are currently offline</p>
                      <p className="text-sm text-gray-500">Toggle the "Online" button to start receiving rides</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Recent Rides */}
        <div className="card lg:hidden mt-4">
          <h2 className="text-xl font-bold mb-4">Recent Rides</h2>
          {rideHistory.length === 0 ? (
            <p className="text-gray-600 text-center py-4">No completed rides yet</p>
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

export default DriverDashboard;
