/**
 * Category Routes
 * Handles category management endpoints
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');
const {
    getAllCategories,
    getCategoryBySlug,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');

// Public routes
router.get('/', getAllCategories);
router.get('/:slug', getCategoryBySlug);

// Admin only routes
router.post('/', authenticateToken, adminOnly, createCategory);
router.put('/:id', authenticateToken, adminOnly, updateCategory);
router.delete('/:id', authenticateToken, adminOnly, deleteCategory);

module.exports = router;
