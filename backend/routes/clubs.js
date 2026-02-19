const express = require('express');
const router = express.Router();
const {
    getClubs, getClub, createClub, deleteClub,
    getClubPosts, getAllPosts, createClubPost, deleteClubPost, likeClubPost
} = require('../controllers/clubController');

// Clubs
router.get('/', getClubs);                          // GET /api/clubs?category=Tech
router.post('/', createClub);                       // POST /api/clubs
router.get('/posts', getAllPosts);                   // GET /api/clubs/posts?category=Tech&type=event
router.get('/:id', getClub);                        // GET /api/clubs/:id
router.delete('/:id', deleteClub);                  // DELETE /api/clubs/:id

// Club Posts
router.get('/:clubId/posts', getClubPosts);         // GET /api/clubs/:clubId/posts
router.post('/posts/create', createClubPost);       // POST /api/clubs/posts/create
router.delete('/posts/:postId', deleteClubPost);    // DELETE /api/clubs/posts/:postId
router.post('/posts/:postId/like', likeClubPost);   // POST /api/clubs/posts/:postId/like

module.exports = router;
