const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const { authenticateUser, authenticateDriver } = require('../middleware/auth');

// User routes
router.post('/create', authenticateUser, rideController.createRide);
router.get('/user/history', authenticateUser, rideController.getUserRides);
router.get('/user/current', authenticateUser, rideController.getCurrentRide);
router.put('/cancel/:rideId', authenticateUser, rideController.cancelRide);
router.post('/rate/:rideId', authenticateUser, rideController.rateRide);

// Driver routes
router.get('/available', authenticateDriver, rideController.getAvailableRides);
router.post('/accept/:rideId', authenticateDriver, rideController.acceptRide);
router.put('/status/:rideId', authenticateDriver, rideController.updateRideStatus);
router.get('/driver/current', authenticateDriver, rideController.getDriverCurrentRide);

module.exports = router;
