const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateAdmin } = require('../middleware/auth');

// Public admin routes (for development - remove authentication)
router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', adminController.getUsers);
router.get('/drivers', adminController.getDrivers);
router.put('/drivers/:driverId/status', adminController.updateDriverStatus);
router.get('/rides', adminController.getRides);
router.get('/analytics/revenue', adminController.getRevenueAnalytics);
router.delete('/users/:userId', adminController.deleteUser);
router.delete('/drivers/:driverId', adminController.deleteDriver);
router.post('/create', adminController.createAdmin);

// Authenticated admin routes (for future use)
// router.get('/dashboard', authenticateAdmin, adminController.getDashboardStats);
// router.get('/users', authenticateAdmin, adminController.getUsers);
// router.get('/drivers', authenticateAdmin, adminController.getDrivers);
// router.put('/drivers/:driverId/status', authenticateAdmin, adminController.updateDriverStatus);
// router.get('/rides', authenticateAdmin, adminController.getRides);
// router.get('/analytics/revenue', authenticateAdmin, adminController.getRevenueAnalytics);
// router.delete('/users/:userId', authenticateAdmin, adminController.deleteUser);
// router.delete('/drivers/:driverId', authenticateAdmin, adminController.deleteDriver);
// router.post('/create', authenticateAdmin, adminController.createAdmin);

module.exports = router;
