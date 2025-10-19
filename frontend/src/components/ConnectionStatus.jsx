import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import api from '../utils/api';

const ConnectionStatus = ({ onConnectionChange }) => {
  const [status, setStatus] = useState({
    backend: 'checking',
    database: 'checking',
    lastChecked: null,
    error: null
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    const newStatus = {
      backend: 'checking',
      database: 'checking',
      lastChecked: new Date(),
      error: null
    };

    try {
      // Check backend health
      const healthResponse = await api.get('/health');
      newStatus.backend = healthResponse.status === 200 ? 'connected' : 'error';
      
      // Check database by trying to fetch dashboard stats
      try {
        const dashboardResponse = await api.get('/admin/dashboard');
        newStatus.database = dashboardResponse.status === 200 ? 'connected' : 'error';
      } catch (dbError) {
        newStatus.database = 'error';
        newStatus.error = {
          type: 'database',
          message: dbError.response?.data?.error || dbError.message,
          details: dbError.response?.status ? `HTTP ${dbError.response.status}` : 'Connection failed'
        };
      }
    } catch (backendError) {
      newStatus.backend = 'error';
      newStatus.database = 'error';
      newStatus.error = {
        type: 'backend',
        message: 'Backend server not responding',
        details: backendError.code === 'ECONNREFUSED' ? 'Server not running on port 5000' : backendError.message
      };
    }

    setStatus(newStatus);
    setIsChecking(false);
    
    if (onConnectionChange) {
      onConnectionChange(newStatus);
    }
  };

  useEffect(() => {
    checkConnection();
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (statusType) => {
    switch (statusType) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'checking':
        return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (statusType) => {
    switch (statusType) {
      case 'connected':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'checking':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const overallStatus = status.backend === 'connected' && status.database === 'connected' ? 'connected' : 
                      status.backend === 'checking' || status.database === 'checking' ? 'checking' : 'error';

  return (
    <div className={`p-4 rounded-lg border ${getStatusColor(overallStatus)} mb-6`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          {overallStatus === 'connected' ? 
            <Wifi className="w-5 h-5 text-green-500 mr-2" /> : 
            <WifiOff className="w-5 h-5 text-red-500 mr-2" />
          }
          <h3 className="font-semibold">System Status</h3>
        </div>
        <button
          onClick={checkConnection}
          disabled={isChecking}
          className="flex items-center text-sm hover:underline disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${isChecking ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="flex items-center">
          {getStatusIcon(status.backend)}
          <span className="ml-2 text-sm">
            Backend Server: <strong>{status.backend}</strong>
          </span>
        </div>
        <div className="flex items-center">
          {getStatusIcon(status.database)}
          <span className="ml-2 text-sm">
            Database: <strong>{status.database}</strong>
          </span>
        </div>
      </div>

      {status.error && (
        <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded text-sm">
          <p className="font-semibold text-red-800">Connection Error:</p>
          <p className="text-red-700">{status.error.message}</p>
          <p className="text-red-600 text-xs mt-1">{status.error.details}</p>
          
          {status.error.type === 'backend' && (
            <div className="mt-2 text-xs text-red-600">
              <p><strong>To fix:</strong></p>
              <ul className="list-disc list-inside ml-2">
                <li>Make sure the backend server is running: <code>npm start</code> in backend folder</li>
                <li>Check if port 5000 is available</li>
                <li>Verify backend URL in frontend/src/utils/api.js</li>
              </ul>
            </div>
          )}
          
          {status.error.type === 'database' && (
            <div className="mt-2 text-xs text-red-600">
              <p><strong>To fix:</strong></p>
              <ul className="list-disc list-inside ml-2">
                <li>Ensure MySQL/XAMPP is running</li>
                <li>Check database connection in backend/.env</li>
                <li>Run database schema: database/schema.sql</li>
                <li>Verify database name: yango_db</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {status.lastChecked && (
        <p className="text-xs text-gray-500 mt-2">
          Last checked: {status.lastChecked.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
};

export default ConnectionStatus;
