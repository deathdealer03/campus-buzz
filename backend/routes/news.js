/**
 * News Routes
 * Handles all news-related endpoints
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { staffOnly, adminOnly } = require('../middleware/roleCheck');
const {
    getAllNews,
    getPrioritizedNews,
    getNewsById,
    createNews,
    updateNews,
    deleteNews,
    getNewsStats
} = require('../controllers/newsController');

// Public routes
router.get('/', optionalAuth, getAllNews);
router.get('/prioritized', getPrioritizedNews);
router.get('/stats', authenticateToken, staffOnly, getNewsStats);
router.get('/:identifier', getNewsById);

// Protected routes (Admin & Faculty)
router.post('/', authenticateToken, staffOnly, createNews);
router.put('/:id', authenticateToken, staffOnly, updateNews);
router.delete('/:id', authenticateToken, staffOnly, deleteNews);

module.exports = router;
