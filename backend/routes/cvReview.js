const express = require('express');
const router = express.Router();
const { getAIReview } = require('../controllers/cvReviewController');

// POST /api/cv/review
router.post('/review', getAIReview);

module.exports = router;
