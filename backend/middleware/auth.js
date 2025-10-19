const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const authenticateUser = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (req.user.type !== 'user') {
      return res.status(403).json({ error: 'Access denied. User only.' });
    }
    next();
  });
};

const authenticateDriver = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (req.user.type !== 'driver') {
      return res.status(403).json({ error: 'Access denied. Driver only.' });
    }
    next();
  });
};

const authenticateAdmin = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (req.user.type !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    next();
  });
};

module.exports = {
  authenticateToken,
  authenticateUser,
  authenticateDriver,
  authenticateAdmin
};
