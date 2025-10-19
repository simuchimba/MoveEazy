const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Generate JWT token
const generateToken = (id, type) => {
  return jwt.sign({ id, type }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// User Registration
exports.registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if user exists
    const existing = await query('SELECT * FROM users WHERE email = $1 OR phone = $2', [email, phone]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email or phone already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await query(
      'INSERT INTO users (name, email, phone, password) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, email, phone, hashedPassword]
    );

    const token = generateToken(result.rows[0].id, 'user');

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: result.rows[0].id, name, email, phone }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// User Login
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const users = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (users.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id, 'user');

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profile_image: user.profile_image
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Driver Registration
exports.registerDriver = async (req, res) => {
  try {
    const {
      name, email, phone, password,
      license_number, vehicle_type, vehicle_model,
      vehicle_plate, vehicle_color
    } = req.body;

    // Check if driver exists
    const existing = await query(
      'SELECT * FROM drivers WHERE email = $1 OR phone = $2 OR license_number = $3 OR vehicle_plate = $4',
      [email, phone, license_number, vehicle_plate]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email, phone, license, or vehicle plate already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert driver
    const result = await query(
      `INSERT INTO drivers (name, email, phone, password, license_number, 
       vehicle_type, vehicle_model, vehicle_plate, vehicle_color) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [name, email, phone, hashedPassword, license_number, vehicle_type, vehicle_model, vehicle_plate, vehicle_color]
    );

    res.status(201).json({
      message: 'Driver registration submitted. Awaiting admin approval.',
      driver: { id: result.rows[0].id, name, email, status: 'pending' }
    });
  } catch (error) {
    console.error('Driver registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Driver Login
exports.loginDriver = async (req, res) => {
  try {
    const { email, password } = req.body;

    const drivers = await query('SELECT * FROM drivers WHERE email = $1', [email]);
    if (drivers.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const driver = drivers.rows[0];

    if (driver.status === 'pending') {
      return res.status(403).json({ error: 'Account pending approval' });
    }
    if (driver.status === 'rejected' || driver.status === 'suspended') {
      return res.status(403).json({ error: 'Account not active. Contact admin.' });
    }

    const validPassword = await bcrypt.compare(password, driver.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(driver.id, 'driver');

    res.json({
      message: 'Login successful',
      token,
      driver: {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        vehicle_type: driver.vehicle_type,
        vehicle_model: driver.vehicle_model,
        vehicle_plate: driver.vehicle_plate,
        rating: driver.rating,
        is_available: driver.is_available
      }
    });
  } catch (error) {
    console.error('Driver login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Admin Login
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admins = await query('SELECT * FROM admins WHERE email = $1', [email]);
    if (admins.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = admins.rows[0];
    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(admin.id, 'admin');

    res.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};
