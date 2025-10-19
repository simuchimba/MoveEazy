const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// User routes
router.post('/user/register', authController.registerUser);
router.post('/user/login', authController.loginUser);

// Driver routes
router.post('/driver/register', authController.registerDriver);
router.post('/driver/login', authController.loginDriver);

// Admin routes
router.post('/admin/login', authController.loginAdmin);

module.exports = router;
