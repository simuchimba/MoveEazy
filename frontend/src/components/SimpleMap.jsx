import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Search, Target } from 'lucide-react';

const SimpleMap = ({ onLocationSelect }) => {
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState(null);
  const [currentStep, setCurrentStep] = useState('pickup');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: 'Current Location'
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Default to Lusaka, Zambia
          setCurrentLocation({
            lat: -15.4167,
            lng: 28.2833,
            address: 'Lusaka, Zambia'
          });
        }
      );
    }
  }, []);

  // Search for locations using Nominatim API
  const searchLocation = async (query) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=zm`
      );
      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  // Handle location selection
  const handleLocationSelect = (location, step) => {
    const locationData = {
      lat: location.lat,
      lng: location.lng,
      address: location.address || location.display_name || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
    };

    if (step === 'pickup') {
      setPickupLocation(locationData);
      setCurrentStep('dropoff');
      // Notify parent component
      if (onLocationSelect) {
        onLocationSelect('pickup', locationData);
      }
    } else {
      setDropoffLocation(locationData);
      // Notify parent component
      if (onLocationSelect) {
        onLocationSelect('dropoff', locationData);
      }
      
      // Calculate distance if both locations are set
      if (pickupLocation) {
        const distance = calculateDistance(
          pickupLocation.lat,
          pickupLocation.lng,
          locationData.lat,
          locationData.lng
        );
        
        if (onLocationSelect) {
          onLocationSelect('route', { distance, duration: `${Math.round(distance * 3)} min` });
        }
      }
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

  // Handle search result selection
  const handleSearchResultSelect = (result) => {
    const location = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: result.display_name
    };
    
    handleLocationSelect(location, currentStep);
    setSearchResults([]);
    setSearchQuery('');
  };

  // Use current location
  const useCurrentLocation = () => {
    if (currentLocation) {
      handleLocationSelect(currentLocation, currentStep);
    }
  };

  return (
    <div className="w-full h-96 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border border-gray-200 relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-white bg-opacity-95 backdrop-blur-sm border-b border-gray-200 p-4 z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-3 h-3 rounded-full ${currentStep === 'pickup' ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm font-medium">
            {currentStep === 'pickup' ? 'Select Pickup Location' : 'Select Drop-off Location'}
          </span>
        </div>
        
        <div className="relative">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search for ${currentStep} location...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchLocation(searchQuery)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => searchLocation(searchQuery)}
              disabled={isSearching}
              className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {isSearching ? '...' : 'Search'}
            </button>
          </div>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto z-20">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleSearchResultSelect(result)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                >
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {result.display_name.split(',')[0]}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {result.display_name}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Current Location Button */}
        {currentLocation && (
          <button
            onClick={useCurrentLocation}
            className="mt-2 flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-md text-sm hover:bg-green-200 transition-colors"
          >
            <Target className="w-4 h-4" />
            Use Current Location
          </button>
        )}
      </div>

      {/* Map Area */}
      <div className="pt-32 p-6 h-full flex flex-col justify-center items-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Location Selection</h3>
          <p className="text-gray-600 text-sm max-w-md">
            Search for locations above or use the "Use Current Location" button to set your {currentStep} point.
          </p>
        </div>

        {/* Location Status */}
        <div className="mt-8 space-y-3 w-full max-w-md">
          {pickupLocation && (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-green-800">Pickup Location</div>
                <div className="text-xs text-green-600 truncate">{pickupLocation.address}</div>
              </div>
            </div>
          )}
          
          {dropoffLocation && (
            <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-red-800">Drop-off Location</div>
                <div className="text-xs text-red-600 truncate">{dropoffLocation.address}</div>
              </div>
            </div>
          )}
        </div>

        {/* Step Controls */}
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => setCurrentStep('pickup')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              currentStep === 'pickup' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Set Pickup
          </button>
          <button
            onClick={() => setCurrentStep('dropoff')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              currentStep === 'dropoff' 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Set Drop-off
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 right-4 bg-white bg-opacity-90 rounded-lg p-3 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4" />
          <span>Search for locations above or use current location to set your {currentStep} point</span>
        </div>
      </div>
    </div>
  );
};

export default SimpleMap;
