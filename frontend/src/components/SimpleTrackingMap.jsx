import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Car, Clock, Map } from 'lucide-react';

const SimpleTrackingMap = ({ pickup, dropoff, driverLocation, rideStatus = 'searching' }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calculate distance between two points
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

  // Calculate estimated time and distance
  const getRouteInfo = () => {
    if (!pickup || !dropoff) return { distance: 0, duration: '0 min' };
    
    const distance = calculateDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
    const duration = Math.round(distance * 3); // Rough estimate: 3 minutes per km
    
    return {
      distance: distance.toFixed(1),
      duration: `${duration} min`
    };
  };

  const routeInfo = getRouteInfo();

  // Get status color and message
  const getStatusInfo = () => {
    switch (rideStatus) {
      case 'searching':
        return { color: 'bg-yellow-500', message: 'Searching for driver...', icon: '🔍' };
      case 'accepted':
        return { color: 'bg-blue-500', message: 'Driver found! On the way...', icon: '🚗' };
      case 'arrived':
        return { color: 'bg-green-500', message: 'Driver has arrived', icon: '✅' };
      case 'in_progress':
        return { color: 'bg-purple-500', message: 'Trip in progress', icon: '🛣️' };
      case 'completed':
        return { color: 'bg-green-600', message: 'Trip completed', icon: '🎉' };
      default:
        return { color: 'bg-gray-500', message: 'Unknown status', icon: '❓' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg relative overflow-hidden">
      {/* Status Badge */}
      <div className="absolute top-4 left-4 z-10">
        <div className={`${statusInfo.color} text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2`}>
          <span>{statusInfo.icon}</span>
          <span className="font-medium text-sm">{statusInfo.message}</span>
        </div>
      </div>

      {/* Time Display */}
      <div className="absolute top-4 right-4 bg-white bg-opacity-90 px-3 py-2 rounded-lg shadow-lg z-10">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-gray-600" />
          <span className="font-mono">{currentTime.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-full flex flex-col justify-center items-center p-6">
        <div className="text-center space-y-6 max-w-md">
          {/* Route Visualization */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Map className="w-5 h-5 text-blue-600" />
              Live Tracking
            </h3>
            
            {/* Route Points */}
            <div className="space-y-4">
              {/* Pickup Location */}
              {pickup && (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-green-800">Pickup</div>
                    <div className="text-xs text-green-600">
                      {pickup.address || `${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)}`}
                    </div>
                  </div>
                </div>
              )}

              {/* Driver Location (if available) */}
              {driverLocation && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Car className="w-4 h-4 text-blue-600" />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-blue-800">Driver Location</div>
                    <div className="text-xs text-blue-600">
                      {driverLocation.address || `${driverLocation.lat.toFixed(4)}, ${driverLocation.lng.toFixed(4)}`}
                    </div>
                  </div>
                </div>
              )}

              {/* Dropoff Location */}
              {dropoff && (
                <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-red-800">Destination</div>
                    <div className="text-xs text-red-600">
                      {dropoff.address || `${dropoff.lat.toFixed(4)}, ${dropoff.lng.toFixed(4)}`}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Route Info */}
            {pickup && dropoff && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm">
                  <div className="text-gray-600">
                    <span className="font-medium">Distance:</span> {routeInfo.distance} km
                  </div>
                  <div className="text-gray-600">
                    <span className="font-medium">ETA:</span> {routeInfo.duration}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="text-2xl font-bold text-blue-600">{routeInfo.distance}</div>
              <div className="text-xs text-gray-600">Kilometers</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="text-2xl font-bold text-green-600">{routeInfo.duration}</div>
              <div className="text-xs text-gray-600">Estimated</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Instructions */}
      <div className="absolute bottom-4 left-4 right-4 bg-white bg-opacity-90 rounded-lg p-3 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4" />
          <span>Real-time tracking - Updates automatically</span>
        </div>
      </div>
    </div>
  );
};

export default SimpleTrackingMap;
