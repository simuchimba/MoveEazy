const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Generate JWT token
const generateToken = (id, type) => {
  return jwt.sign({ id, type }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// User Registration
exports.registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if user exists
    const [existing] = await db.query('SELECT * FROM users WHERE email = ? OR phone = ?', [email, phone]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email or phone already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await db.query(
      'INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)',
      [name, email, phone, hashedPassword]
    );

    const token = generateToken(result.insertId, 'user');

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: result.insertId, name, email, phone }
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

    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
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
    const [existing] = await db.query(
      'SELECT * FROM drivers WHERE email = ? OR phone = ? OR license_number = ? OR vehicle_plate = ?',
      [email, phone, license_number, vehicle_plate]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email, phone, license, or vehicle plate already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert driver
    const [result] = await db.query(
      `INSERT INTO drivers (name, email, phone, password, license_number, 
       vehicle_type, vehicle_model, vehicle_plate, vehicle_color) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, phone, hashedPassword, license_number, vehicle_type, vehicle_model, vehicle_plate, vehicle_color]
    );

    res.status(201).json({
      message: 'Driver registration submitted. Awaiting admin approval.',
      driver: { id: result.insertId, name, email, status: 'pending' }
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

    const [drivers] = await db.query('SELECT * FROM drivers WHERE email = ?', [email]);
    if (drivers.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const driver = drivers[0];

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

    const [admins] = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
    if (admins.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = admins[0];
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
