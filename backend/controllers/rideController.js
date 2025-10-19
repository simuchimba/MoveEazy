const db = require('../config/database');

// Calculate fare based on distance (KMK per km)
const calculateFare = (distance) => {
  const basefare = 15; // KMK 15 base fare
  const perKm = 8; // KMK 8 per km
  return basefare + (distance * perKm);
};

// Create a ride request
exports.createRide = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      pickup_location, pickup_latitude, pickup_longitude,
      dropoff_location, dropoff_latitude, dropoff_longitude,
      distance
    } = req.body;

    const estimatedFare = calculateFare(distance);

    const [result] = await db.query(
      `INSERT INTO rides (user_id, pickup_location, pickup_latitude, pickup_longitude,
       dropoff_location, dropoff_latitude, dropoff_longitude, distance, estimated_fare)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, pickup_location, pickup_latitude, pickup_longitude,
       dropoff_location, dropoff_latitude, dropoff_longitude, distance, estimatedFare]
    );

    // Notify available drivers via Socket.IO (handled in server.js)
    global.io.emit('new_ride_request', {
      rideId: result.insertId,
      pickup_location,
      dropoff_location,
      estimated_fare: estimatedFare
    });

    res.status(201).json({
      message: 'Ride requested successfully',
      ride: {
        id: result.insertId,
        pickup_location,
        dropoff_location,
        estimated_fare: estimatedFare,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Create ride error:', error);
    res.status(500).json({ error: 'Failed to create ride request' });
  }
};

// Get user's rides
exports.getUserRides = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rides] = await db.query(
      `SELECT r.*, d.name as driver_name, d.phone as driver_phone, 
       d.vehicle_model, d.vehicle_plate, d.rating as driver_rating
       FROM rides r
       LEFT JOIN drivers d ON r.driver_id = d.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [userId]
    );

    res.json({ rides });
  } catch (error) {
    console.error('Get user rides error:', error);
    res.status(500).json({ error: 'Failed to fetch rides' });
  }
};

// Get available rides for driver
exports.getAvailableRides = async (req, res) => {
  try {
    const [rides] = await db.query(
      `SELECT r.*, u.name as user_name, u.phone as user_phone
       FROM rides r
       JOIN users u ON r.user_id = u.id
       WHERE r.status = 'pending'
       ORDER BY r.created_at DESC
       LIMIT 20`
    );

    res.json({ rides });
  } catch (error) {
    console.error('Get available rides error:', error);
    res.status(500).json({ error: 'Failed to fetch available rides' });
  }
};

// Driver accepts ride
exports.acceptRide = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { rideId } = req.params;

    // Check if ride is still available
    const [rides] = await db.query('SELECT * FROM rides WHERE id = ?', [rideId]);
    if (rides.length === 0) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    if (rides[0].status !== 'pending') {
      return res.status(400).json({ error: 'Ride no longer available' });
    }

    // Update ride
    await db.query(
      'UPDATE rides SET driver_id = ?, status = ? WHERE id = ?',
      [driverId, 'accepted', rideId]
    );

    // Update driver availability
    await db.query('UPDATE drivers SET is_available = false WHERE id = ?', [driverId]);

    // Notify user
    global.io.emit(`ride_accepted_${rides[0].user_id}`, {
      rideId,
      driverId
    });

    res.json({ message: 'Ride accepted successfully' });
  } catch (error) {
    console.error('Accept ride error:', error);
    res.status(500).json({ error: 'Failed to accept ride' });
  }
};

// Update ride status
exports.updateRideStatus = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { status } = req.body;
    const driverId = req.user.id;

    // Verify driver owns this ride
    const [rides] = await db.query(
      'SELECT * FROM rides WHERE id = ? AND driver_id = ?',
      [rideId, driverId]
    );

    if (rides.length === 0) {
      return res.status(404).json({ error: 'Ride not found or unauthorized' });
    }

    await db.query('UPDATE rides SET status = ? WHERE id = ?', [status, rideId]);

    // If completed, make driver available again and record earnings
    if (status === 'completed') {
      try {
        const ride = rides[0];
        const fare = ride.estimated_fare;
        
        console.log(`Completing ride ${rideId} for driver ${driverId} with fare ${fare}`);
        
        // Update driver stats
        await db.query(
          'UPDATE drivers SET is_available = true, total_rides = total_rides + 1 WHERE id = ?',
          [driverId]
        );
        console.log('Driver stats updated');
        
        // Record the earning in transactions table
        await db.query(
          `INSERT INTO transactions (ride_id, amount, transaction_type, description) 
           VALUES (?, ?, 'driver_earning', 'Driver earning for completed ride')`,
          [rideId, fare]
        );
        console.log('Transaction recorded');
        
        // Update ride with final fare
        await db.query('UPDATE rides SET final_fare = ? WHERE id = ?', [fare, rideId]);
        console.log('Final fare updated');
        
      } catch (completionError) {
        console.error('Error in ride completion process:', completionError);
        // Don't throw the error, just log it so the main status update still works
      }
    }

    // Notify user
    global.io.emit(`ride_status_${rides[0].user_id}`, { rideId, status });

    res.json({ message: 'Ride status updated' });
  } catch (error) {
    console.error('Update ride status error:', error);
    res.status(500).json({ error: 'Failed to update ride status' });
  }
};

// Cancel ride
exports.cancelRide = async (req, res) => {
  try {
    const userId = req.user.id;
    const { rideId } = req.params;

    const [rides] = await db.query(
      'SELECT * FROM rides WHERE id = ? AND user_id = ?',
      [rideId, userId]
    );

    if (rides.length === 0) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    if (rides[0].status === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel completed ride' });
    }

    await db.query('UPDATE rides SET status = ? WHERE id = ?', ['cancelled', rideId]);

    // If driver assigned, make them available
    if (rides[0].driver_id) {
      await db.query('UPDATE drivers SET is_available = true WHERE id = ?', [rides[0].driver_id]);
      global.io.emit(`ride_cancelled_${rides[0].driver_id}`, { rideId });
    }

    res.json({ message: 'Ride cancelled successfully' });
  } catch (error) {
    console.error('Cancel ride error:', error);
    res.status(500).json({ error: 'Failed to cancel ride' });
  }
};

// Rate ride
exports.rateRide = async (req, res) => {
  try {
    const userId = req.user.id;
    const { rideId } = req.params;
    const { rating, feedback } = req.body;

    const [rides] = await db.query(
      'SELECT * FROM rides WHERE id = ? AND user_id = ? AND status = ?',
      [rideId, userId, 'completed']
    );

    if (rides.length === 0) {
      return res.status(404).json({ error: 'Ride not found or not completed' });
    }

    await db.query(
      'UPDATE rides SET rating = ?, feedback = ? WHERE id = ?',
      [rating, feedback, rideId]
    );

    // Update driver rating
    const [avgRating] = await db.query(
      'SELECT AVG(rating) as avg_rating FROM rides WHERE driver_id = ? AND rating IS NOT NULL',
      [rides[0].driver_id]
    );

    await db.query(
      'UPDATE drivers SET rating = ? WHERE id = ?',
      [avgRating[0].avg_rating || 5, rides[0].driver_id]
    );

    res.json({ message: 'Rating submitted successfully' });
  } catch (error) {
    console.error('Rate ride error:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
};

// Get current active ride
exports.getCurrentRide = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rides] = await db.query(
      `SELECT r.*, d.name as driver_name, d.phone as driver_phone,
       d.vehicle_model, d.vehicle_plate, d.current_latitude as driver_latitude,
       d.current_longitude as driver_longitude
       FROM rides r
       LEFT JOIN drivers d ON r.driver_id = d.id
       WHERE r.user_id = ? AND r.status IN ('pending', 'accepted', 'picked_up')
       ORDER BY r.created_at DESC
       LIMIT 1`,
      [userId]
    );

    res.json({ ride: rides[0] || null });
  } catch (error) {
    console.error('Get current ride error:', error);
    res.status(500).json({ error: 'Failed to fetch current ride' });
  }
};

// Get driver's current ride
exports.getDriverCurrentRide = async (req, res) => {
  try {
    const driverId = req.user.id;
    const [rides] = await db.query(
      `SELECT r.*, u.name as user_name, u.phone as user_phone
       FROM rides r
       JOIN users u ON r.user_id = u.id
       WHERE r.driver_id = ? AND r.status IN ('accepted', 'picked_up')
       ORDER BY r.created_at DESC
       LIMIT 1`,
      [driverId]
    );

    res.json({ ride: rides[0] || null });
  } catch (error) {
    console.error('Get driver current ride error:', error);
    res.status(500).json({ error: 'Failed to fetch current ride' });
  }
};
