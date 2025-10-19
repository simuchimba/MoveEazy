const db = require('../config/database');

// Update driver location
exports.updateLocation = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { latitude, longitude } = req.body;

    await db.query(
      'UPDATE drivers SET current_latitude = ?, current_longitude = ? WHERE id = ?',
      [latitude, longitude, driverId]
    );

    // Broadcast location to users tracking this driver
    global.io.emit(`driver_location_${driverId}`, { latitude, longitude });

    res.json({ message: 'Location updated' });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
};

// Update driver availability
exports.updateAvailability = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { is_available } = req.body;

    await db.query(
      'UPDATE drivers SET is_available = ? WHERE id = ?',
      [is_available, driverId]
    );

    res.json({ message: 'Availability updated', is_available });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
};

// Get driver profile
exports.getProfile = async (req, res) => {
  try {
    const driverId = req.user.id;
    const [drivers] = await db.query(
      'SELECT id, name, email, phone, license_number, vehicle_type, vehicle_model, vehicle_plate, vehicle_color, rating, total_rides, is_available, status FROM drivers WHERE id = ?',
      [driverId]
    );

    if (drivers.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({ driver: drivers[0] });
  } catch (error) {
    console.error('Get driver profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// Get driver earnings
exports.getEarnings = async (req, res) => {
  try {
    const driverId = req.user.id;
    console.log(`Getting earnings for driver ${driverId}`);

    // Get total earnings (fallback to estimated_fare if final_fare is null)
    const [earnings] = await db.query(
      `SELECT 
        COUNT(*) as total_rides,
        SUM(COALESCE(final_fare, estimated_fare)) as total_earnings,
        AVG(COALESCE(final_fare, estimated_fare)) as avg_fare
       FROM rides 
       WHERE driver_id = ? AND status = 'completed'`,
      [driverId]
    );

    // Get today's earnings (fallback to estimated_fare if final_fare is null)
    const [todayEarnings] = await db.query(
      `SELECT 
        COUNT(*) as rides_today,
        SUM(COALESCE(final_fare, estimated_fare)) as earnings_today
       FROM rides 
       WHERE driver_id = ? AND status = 'completed' AND DATE(created_at) = CURDATE()`,
      [driverId]
    );

    console.log('Earnings data:', earnings[0]);
    console.log('Today earnings data:', todayEarnings[0]);

    const result = {
      total_rides: earnings[0].total_rides || 0,
      total_earnings: earnings[0].total_earnings || 0,
      avg_fare: earnings[0].avg_fare || 0,
      rides_today: todayEarnings[0].rides_today || 0,
      earnings_today: todayEarnings[0].earnings_today || 0
    };

    console.log('Sending earnings response:', result);
    res.json(result);
  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
};

// Get driver ride history
exports.getRideHistory = async (req, res) => {
  try {
    const driverId = req.user.id;
    const [rides] = await db.query(
      `SELECT r.*, u.name as user_name 
       FROM rides r
       JOIN users u ON r.user_id = u.id
       WHERE r.driver_id = ?
       ORDER BY r.created_at DESC
       LIMIT 50`,
      [driverId]
    );

    res.json({ rides });
  } catch (error) {
    console.error('Get ride history error:', error);
    res.status(500).json({ error: 'Failed to fetch ride history' });
  }
};
