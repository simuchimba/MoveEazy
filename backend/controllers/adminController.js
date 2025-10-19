const db = require('../config/database');
const bcrypt = require('bcrypt');

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Total users
    const [users] = await db.query('SELECT COUNT(*) as count FROM users');
    
    // Total drivers
    const [drivers] = await db.query('SELECT COUNT(*) as count FROM drivers');
    
    // Pending drivers
    const [pendingDrivers] = await db.query(
      'SELECT COUNT(*) as count FROM drivers WHERE status = "pending"'
    );
    
    // Active drivers
    const [activeDrivers] = await db.query(
      'SELECT COUNT(*) as count FROM drivers WHERE is_available = true AND status = "approved"'
    );
    
    // Total rides
    const [totalRides] = await db.query('SELECT COUNT(*) as count FROM rides');
    
    // Completed rides
    const [completedRides] = await db.query(
      'SELECT COUNT(*) as count FROM rides WHERE status = "completed"'
    );
    
    // Active rides
    const [activeRides] = await db.query(
      'SELECT COUNT(*) as count FROM rides WHERE status IN ("pending", "accepted", "picked_up")'
    );
    
    // Total revenue
    const [revenue] = await db.query(
      'SELECT SUM(final_fare) as total FROM rides WHERE status = "completed"'
    );
    
    // Today's revenue
    const [todayRevenue] = await db.query(
      'SELECT SUM(final_fare) as total FROM rides WHERE status = "completed" AND DATE(created_at) = CURDATE()'
    );
    
    // Today's rides
    const [todayRides] = await db.query(
      'SELECT COUNT(*) as count FROM rides WHERE DATE(created_at) = CURDATE()'
    );

    res.json({
      users: users[0].count,
      drivers: drivers[0].count,
      pending_drivers: pendingDrivers[0].count,
      active_drivers: activeDrivers[0].count,
      total_rides: totalRides[0].count,
      completed_rides: completedRides[0].count,
      active_rides: activeRides[0].count,
      total_revenue: revenue[0].total || 0,
      today_revenue: todayRevenue[0].total || 0,
      today_rides: todayRides[0].count
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT u.id, u.name, u.email, u.phone, u.created_at,
       COUNT(r.id) as total_rides
       FROM users u
       LEFT JOIN rides r ON u.id = r.user_id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get all drivers
exports.getDrivers = async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = `
      SELECT d.*, COUNT(r.id) as completed_rides
      FROM drivers d
      LEFT JOIN rides r ON d.id = r.driver_id AND r.status = 'completed'
    `;
    
    const params = [];
    if (status) {
      query += ' WHERE d.status = ?';
      params.push(status);
    }
    
    query += ' GROUP BY d.id ORDER BY d.created_at DESC';
    
    const [drivers] = await db.query(query, params);

    res.json({ drivers });
  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
};

// Approve/Reject driver
exports.updateDriverStatus = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await db.query('UPDATE drivers SET status = ? WHERE id = ?', [status, driverId]);

    // Notify driver via socket
    global.io.emit(`driver_status_${driverId}`, { status });

    res.json({ message: `Driver ${status} successfully` });
  } catch (error) {
    console.error('Update driver status error:', error);
    res.status(500).json({ error: 'Failed to update driver status' });
  }
};

// Get all rides
exports.getRides = async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = `
      SELECT r.*, 
             u.name as user_name, u.phone as user_phone,
             d.name as driver_name, d.phone as driver_phone
      FROM rides r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN drivers d ON r.driver_id = d.id
    `;
    
    const params = [];
    if (status) {
      query += ' WHERE r.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY r.created_at DESC LIMIT 100';
    
    const [rides] = await db.query(query, params);

    res.json({ rides });
  } catch (error) {
    console.error('Get rides error:', error);
    res.status(500).json({ error: 'Failed to fetch rides' });
  }
};

// Get revenue analytics
exports.getRevenueAnalytics = async (req, res) => {
  try {
    // Revenue by day for last 7 days
    const [dailyRevenue] = await db.query(
      `SELECT DATE(created_at) as date, 
              COUNT(*) as rides,
              SUM(final_fare) as revenue
       FROM rides 
       WHERE status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date DESC`
    );

    // Revenue by month for last 6 months
    const [monthlyRevenue] = await db.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') as month,
              COUNT(*) as rides,
              SUM(final_fare) as revenue
       FROM rides 
       WHERE status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month DESC`
    );

    res.json({
      daily: dailyRevenue,
      monthly: monthlyRevenue
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await db.query('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Delete driver
exports.deleteDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    await db.query('DELETE FROM drivers WHERE id = ?', [driverId]);
    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Delete driver error:', error);
    res.status(500).json({ error: 'Failed to delete driver' });
  }
};

// Create admin account
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if email exists
    const [existing] = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      'INSERT INTO admins (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role || 'admin']
    );

    res.status(201).json({ message: 'Admin created successfully' });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: 'Failed to create admin' });
  }
};
