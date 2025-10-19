import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const DriversTest = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('DriversTest component mounted');
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    console.log('Fetching drivers...');
    setLoading(true);
    
    try {
      console.log('Making API call to /admin/drivers');
      const response = await api.get('/admin/drivers');
      console.log('API Response:', response);
      console.log('Response data:', response.data);
      
      const driversData = response.data.drivers || response.data || [];
      console.log('Drivers data:', driversData);
      
      setDrivers(driversData);
      setError(null);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      console.error('Error response:', error.response);
      setError(error.message);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  console.log('Rendering DriversTest - loading:', loading, 'error:', error, 'drivers:', drivers);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading Drivers...</h2>
        <p>Please wait while we fetch driver data from the database.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#fee', border: '1px solid #fcc' }}>
        <h2>Error Loading Drivers</h2>
        <p><strong>Error:</strong> {error}</p>
        <button onClick={fetchDrivers} style={{ padding: '10px 20px', marginTop: '10px' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Drivers Management - TEST VERSION</h1>
      <p>This is a test component to verify the drivers section is working.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={fetchDrivers}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refresh Drivers
        </button>
      </div>

      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', marginBottom: '20px' }}>
        <h3>Database Status</h3>
        <p><strong>Total Drivers Found:</strong> {drivers.length}</p>
        <p><strong>API Endpoint:</strong> /admin/drivers</p>
        <p><strong>Last Updated:</strong> {new Date().toLocaleString()}</p>
      </div>

      {drivers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7' }}>
          <h3>No Drivers Found</h3>
          <p>There are no drivers in the database yet.</p>
          <p>Register as a driver to see data here.</p>
        </div>
      ) : (
        <div>
          <h3>Drivers List ({drivers.length} found)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ border: '1px solid #dee2e6', padding: '12px', textAlign: 'left' }}>ID</th>
                <th style={{ border: '1px solid #dee2e6', padding: '12px', textAlign: 'left' }}>Name</th>
                <th style={{ border: '1px solid #dee2e6', padding: '12px', textAlign: 'left' }}>Email</th>
                <th style={{ border: '1px solid #dee2e6', padding: '12px', textAlign: 'left' }}>Phone</th>
                <th style={{ border: '1px solid #dee2e6', padding: '12px', textAlign: 'left' }}>Vehicle</th>
                <th style={{ border: '1px solid #dee2e6', padding: '12px', textAlign: 'left' }}>Status</th>
                <th style={{ border: '1px solid #dee2e6', padding: '12px', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver, index) => (
                <tr key={driver.id || index} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ border: '1px solid #dee2e6', padding: '12px' }}>{driver.id || 'N/A'}</td>
                  <td style={{ border: '1px solid #dee2e6', padding: '12px' }}>{driver.name || 'N/A'}</td>
                  <td style={{ border: '1px solid #dee2e6', padding: '12px' }}>{driver.email || 'N/A'}</td>
                  <td style={{ border: '1px solid #dee2e6', padding: '12px' }}>{driver.phone || 'N/A'}</td>
                  <td style={{ border: '1px solid #dee2e6', padding: '12px' }}>
                    {driver.vehicle_model || 'N/A'} - {driver.vehicle_plate || 'N/A'}
                  </td>
                  <td style={{ border: '1px solid #dee2e6', padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: driver.status === 'pending' ? '#fff3cd' : 
                                     driver.status === 'approved' ? '#d4edda' : 
                                     driver.status === 'rejected' ? '#f8d7da' : '#e2e3e5',
                      color: driver.status === 'pending' ? '#856404' : 
                             driver.status === 'approved' ? '#155724' : 
                             driver.status === 'rejected' ? '#721c24' : '#383d41'
                    }}>
                      {driver.status || 'unknown'}
                    </span>
                  </td>
                  <td style={{ border: '1px solid #dee2e6', padding: '12px' }}>
                    {driver.status === 'pending' && (
                      <div>
                        <button 
                          onClick={() => updateDriverStatus(driver.id, 'approved')}
                          style={{ 
                            padding: '4px 8px', 
                            marginRight: '5px', 
                            backgroundColor: '#28a745', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '3px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => updateDriverStatus(driver.id, 'rejected')}
                          style={{ 
                            padding: '4px 8px', 
                            backgroundColor: '#dc3545', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '3px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {driver.status === 'approved' && (
                      <button 
                        onClick={() => updateDriverStatus(driver.id, 'suspended')}
                        style={{ 
                          padding: '4px 8px', 
                          backgroundColor: '#ffc107', 
                          color: 'black', 
                          border: 'none', 
                          borderRadius: '3px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Suspend
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  async function updateDriverStatus(driverId, status) {
    try {
      console.log(`Updating driver ${driverId} to status: ${status}`);
      await api.put(`/admin/drivers/${driverId}/status`, { status });
      alert(`Driver ${status} successfully!`);
      fetchDrivers(); // Refresh the list
    } catch (error) {
      console.error('Error updating driver status:', error);
      alert('Failed to update driver status');
    }
  }
};

export default DriversTest;
