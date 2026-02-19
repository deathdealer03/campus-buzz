const express = require('express');
const router = express.Router();
const {
    getSpotlights,
    createAlumni,
    deleteAlumni,
    requestMentorship,
    getMentorshipRequests,
    getIndustryPosts,
    createIndustryPost,
    deleteIndustryPost,
    likeIndustryPost,
    getQuestions,
    createQuestion,
    deleteQuestion,
    answerQuestion,
} = require('../controllers/alumniController');

// ---- Alumni Spotlight ----
router.get('/spotlights', getSpotlights);
router.post('/spotlights', createAlumni);
router.delete('/spotlights/:id', deleteAlumni);

// ---- Mentorship Match ----
router.post('/mentorship', requestMentorship);
router.get('/mentorship', getMentorshipRequests);

// ---- Industry Newsfeed ----
router.get('/industry-posts', getIndustryPosts);
router.post('/industry-posts', createIndustryPost);
router.delete('/industry-posts/:id', deleteIndustryPost);
router.post('/industry-posts/:id/like', likeIndustryPost);

// ---- Direct Q&A ----
router.get('/questions', getQuestions);
router.post('/questions', createQuestion);
router.delete('/questions/:id', deleteQuestion);
router.post('/questions/:id/answer', answerQuestion);

module.exports = router;

