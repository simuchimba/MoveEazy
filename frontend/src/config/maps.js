// Google Maps Configuration
// Get your API key from: https://console.cloud.google.com/google/maps-apis

export const GOOGLE_MAPS_CONFIG = {
  // IMPORTANT: Replace with your actual Google Maps API key
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  
  // Default center (Lusaka, Zambia)
  defaultCenter: {
    lat: -15.4167,
    lng: 28.2833
  },
  
  // Map options
  defaultZoom: 13,
  
  // Libraries to load - correct format for @react-google-maps/api
  libraries: ['places', 'geometry', 'directions'],
  
  // Map styles - light theme
  mapStyles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'on' }]
    }
  ],
  
  // Distance calculation options
  distanceMatrixOptions: {
    travelMode: 'DRIVING',
    unitSystem: 'METRIC'
  }
};

// Calculate distance between two points using Haversine formula (fallback)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
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

// Calculate fare based on distance
export const calculateFare = (distanceInKm) => {
  const baseFare = 15; // K15
  const perKm = 8; // K8 per km
  return baseFare + (distanceInKm * perKm);
};

// Format address for display
export const formatAddress = (address) => {
  if (!address) return '';
  return address.split(',').slice(0, 2).join(',');
};

// Geocode address to coordinates
export const geocodeAddress = async (address, geocoder) => {
  return new Promise((resolve, reject) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        resolve({
          lat: location.lat(),
          lng: location.lng(),
          formattedAddress: results[0].formatted_address
        });
      } else {
        reject(new Error('Geocoding failed'));
      }
    });
  });
};

// Calculate route distance using Google Maps Directions API
export const calculateRouteDistance = async (origin, destination, directionsService) => {
  return new Promise((resolve, reject) => {
    directionsService.route(
      {
        origin,
        destination,
        travelMode: 'DRIVING'
      },
      (result, status) => {
        if (status === 'OK' && result.routes[0]) {
          const distanceInMeters = result.routes[0].legs[0].distance.value;
          const distanceInKm = distanceInMeters / 1000;
          const duration = result.routes[0].legs[0].duration.text;
          resolve({
            distance: distanceInKm,
            duration,
            route: result
          });
        } else {
          reject(new Error('Route calculation failed'));
        }
      }
    );
  });
};

export default GOOGLE_MAPS_CONFIG;
