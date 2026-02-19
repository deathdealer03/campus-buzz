/**
 * Authentication Middleware
 * Verifies JWT tokens and extracts user information
 */

const jwt = require('jsonwebtoken');
const { getDatabase } = require('../config/database');

/**
 * Verify JWT token middleware
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const db = getDatabase();
        const user = db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. User not found.'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token.'
        });
    }
}

/**
 * Optional authentication - doesn't fail if no token
 */
function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const db = getDatabase();
        const user = db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(decoded.userId);
        req.user = user || null;
    } catch (error) {
        req.user = null;
    }

    next();
}

module.exports = {
    authenticateToken,
    optionalAuth
};
