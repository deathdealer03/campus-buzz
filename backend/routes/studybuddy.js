/**
 * Study Buddy Routes
 * AI-powered PDF Q&A using Gemini
 */

const express = require('express');
const router = express.Router();
const { upload, chat } = require('../controllers/studyBuddyController');

// POST /api/studybuddy/chat - Upload PDF and ask a question
router.post('/chat', upload.single('pdf'), chat);

module.exports = router;
