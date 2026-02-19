/**
 * Authentication Controller
 * Handles user registration, login, and profile operations
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../config/database');

/**
 * Register a new user
 * POST /api/auth/register
 */
async function register(req, res) {
    try {
        const { email, password, name, role = 'student' } = req.body;

        // Validation
        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                message: 'Email, password, and name are required.'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format.'
            });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long.'
            });
        }

        // Validate role
        const validRoles = ['admin', 'faculty', 'student'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be: admin, faculty, or student.'
            });
        }

        const db = getDatabase();

        // Check if user already exists
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists.'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const result = db.prepare(`
            INSERT INTO users (email, password, name, role) 
            VALUES (?, ?, ?, ?)
        `).run(email, hashedPassword, name, role);

        // Generate JWT token
        const token = jwt.sign(
            { userId: result.lastInsertRowid },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully.',
            data: {
                user: {
                    id: result.lastInsertRowid,
                    email,
                    name,
                    role
                },
                token
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during registration.'
        });
    }
}

/**
 * Login user
 * POST /api/auth/login
 */
async function login(req, res) {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required.'
            });
        }

        const db = getDatabase();

        // Find user
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful.',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                },
                token
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during login.'
        });
    }
}

/**
 * Get current user profile
 * GET /api/auth/profile
 */
function getProfile(req, res) {
    try {
        const db = getDatabase();
        const user = db.prepare(`
            SELECT id, email, name, role, avatar, created_at 
            FROM users WHERE id = ?
        `).get(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        res.json({
            success: true,
            data: { user }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
}

/**
 * Update user profile
 * PUT /api/auth/profile
 */
function updateProfile(req, res) {
    try {
        const { name, avatar } = req.body;
        const userId = req.user.id;

        const db = getDatabase();

        // Build update query dynamically
        const updates = [];
        const values = [];

        if (name) {
            updates.push('name = ?');
            values.push(name);
        }
        if (avatar !== undefined) {
            updates.push('avatar = ?');
            values.push(avatar);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update.'
            });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(userId);

        db.prepare(`
            UPDATE users SET ${updates.join(', ')} WHERE id = ?
        `).run(...values);

        // Get updated user
        const user = db.prepare(`
            SELECT id, email, name, role, avatar, created_at 
            FROM users WHERE id = ?
        `).get(userId);

        res.json({
            success: true,
            message: 'Profile updated successfully.',
            data: { user }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
}

/**
 * Get all users (Admin only)
 * GET /api/auth/users
 */
function getAllUsers(req, res) {
    try {
        const db = getDatabase();
        const users = db.prepare(`
            SELECT id, email, name, role, created_at 
            FROM users 
            ORDER BY created_at DESC
        `).all();

        res.json({
            success: true,
            data: { users }
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
}

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    getAllUsers
};
