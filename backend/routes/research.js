const express = require('express');
const router = express.Router();
const researchController = require('../controllers/researchController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Research Papers
router.get('/papers', researchController.getAllResearch);
router.post('/papers', authenticateToken, authorizeRole(['admin', 'faculty']), researchController.createResearch);
router.post('/papers/:id/cite', researchController.incrementCitation);
router.delete('/papers/:id', authenticateToken, researchController.deleteResearch);

// Achievements
router.get('/achievements', researchController.getAllAchievements);
router.post('/achievements', authenticateToken, researchController.createAchievement);
router.post('/achievements/:id/congratulate', authenticateToken, researchController.congratulateAchievement);
router.delete('/achievements/:id', authenticateToken, researchController.deleteAchievement);

// Leaderboard
router.get('/leaderboard', researchController.getLeaderboard);

module.exports = router;
