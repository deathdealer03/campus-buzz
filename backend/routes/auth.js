/**
 * Authentication Routes
 * Handles user registration, login, and profile endpoints
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');
const {
    register,
    login,
    getProfile,
    updateProfile,
    getAllUsers
} = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

// Admin only routes
router.get('/users', authenticateToken, adminOnly, getAllUsers);

module.exports = router;
