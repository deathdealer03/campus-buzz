/**
 * CAMPUS Buzz - UPES News Portal
 * Main Server Entry Point
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase, closeDatabase } = require('./config/database');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ==================== Middleware ====================

// CORS configuration
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging (development)
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

// ==================== Initialize Database ====================

initDatabase();

// ==================== Routes ====================

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'CAMPUS Buzz API is running!',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/news', require('./routes/news'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/alumni', require('./routes/alumni'));
app.use('/api/clubs', require('./routes/clubs'));


// ==================== Error Handling ====================

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found.`
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error.',
        ...(process.env.NODE_ENV !== 'production' && { error: err.message })
    });
});

// ==================== Start Server ====================

const server = app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🎓 CAMPUS Buzz - UPES News Portal                  ║
║   Server running on http://localhost:${PORT}            ║
║                                                       ║
║   API Endpoints:                                      ║
║   - POST /api/auth/register    (Register user)        ║
║   - POST /api/auth/login       (Login user)           ║
║   - GET  /api/news             (Get all news)         ║
║   - GET  /api/news/prioritized (Get top news)         ║
║   - GET  /api/categories       (Get categories)       ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    closeDatabase();
    server.close(() => {
        console.log('✅ Server closed gracefully');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 SIGTERM received, shutting down...');
    closeDatabase();
    server.close(() => {
        process.exit(0);
    });
});

module.exports = app;
