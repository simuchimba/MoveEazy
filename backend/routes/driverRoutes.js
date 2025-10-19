const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { authenticateDriver } = require('../middleware/auth');

router.post('/location', authenticateDriver, driverController.updateLocation);
router.post('/availability', authenticateDriver, driverController.updateAvailability);
router.get('/profile', authenticateDriver, driverController.getProfile);
router.get('/earnings', authenticateDriver, driverController.getEarnings);
router.get('/rides', authenticateDriver, driverController.getRideHistory);

module.exports = router;
