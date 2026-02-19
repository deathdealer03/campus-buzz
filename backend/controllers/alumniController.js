/**
 * Alumni Controller
 * Handles Alumni Spotlight, Mentorship, Industry Newsfeed, and Q&A
 */

const { getDatabase } = require('../config/database');

// ==================== Alumni Spotlight ====================

/**
 * GET /api/alumni/spotlights
 * Returns all alumni profiles for the Spotlight section
 */
function getSpotlights(req, res) {
    try {
        const db = getDatabase();
        const alumni = db.prepare(`
            SELECT * FROM alumni_profiles 
            ORDER BY batch_year DESC
        `).all();
        res.json({ success: true, data: alumni });
    } catch (error) {
        console.error('getSpotlights error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch alumni spotlights.' });
    }
}

/**
 * POST /api/alumni/spotlights
 * Add a new alumni profile
 */
function createAlumni(req, res) {
    try {
        const db = getDatabase();
        const { name, batch_year, branch, company, role, avatar_url, bio, career_update, linkedin_url, email } = req.body;
        if (!name || !batch_year) {
            return res.status(400).json({ success: false, message: 'Name and batch_year are required.' });
        }
        const stmt = db.prepare(`
            INSERT INTO alumni_profiles (name, batch_year, branch, company, role, avatar_url, bio, career_update, linkedin_url, email)
            VALUES (@name, @batch_year, @branch, @company, @role, @avatar_url, @bio, @career_update, @linkedin_url, @email)
        `);
        const result = stmt.run({ name, batch_year, branch: branch || 'CSE', company, role, avatar_url, bio, career_update, linkedin_url, email });
        const newAlumni = db.prepare('SELECT * FROM alumni_profiles WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json({ success: true, data: newAlumni, message: 'Alumni profile created successfully.' });
    } catch (error) {
        console.error('createAlumni error:', error);
        res.status(500).json({ success: false, message: 'Failed to create alumni profile.' });
    }
}

// ==================== Mentorship Match ====================

/**
 * POST /api/alumni/mentorship
 * Student requests a coffee-chat with an alumni
 */
function requestMentorship(req, res) {
    try {
        const db = getDatabase();
        const { student_name, student_email, alumni_id, topic, message, scheduled_time } = req.body;
        if (!student_name || !student_email || !alumni_id || !topic) {
            return res.status(400).json({ success: false, message: 'student_name, student_email, alumni_id, and topic are required.' });
        }
        const stmt = db.prepare(`
            INSERT INTO mentorship_requests (student_name, student_email, alumni_id, topic, message, scheduled_time)
            VALUES (@student_name, @student_email, @alumni_id, @topic, @message, @scheduled_time)
        `);
        const result = stmt.run({ student_name, student_email, alumni_id, topic, message: message || '', scheduled_time: scheduled_time || '' });
        res.status(201).json({ success: true, message: 'Mentorship request sent! The alumni will reach out soon.', id: result.lastInsertRowid });
    } catch (error) {
        console.error('requestMentorship error:', error);
        res.status(500).json({ success: false, message: 'Failed to send mentorship request.' });
    }
}

/**
 * GET /api/alumni/mentorship
 * Get all mentorship requests (admin view)
 */
function getMentorshipRequests(req, res) {
    try {
        const db = getDatabase();
        const requests = db.prepare(`
            SELECT mr.*, ap.name as alumni_name, ap.company, ap.role
            FROM mentorship_requests mr
            JOIN alumni_profiles ap ON mr.alumni_id = ap.id
            ORDER BY mr.created_at DESC
        `).all();
        res.json({ success: true, data: requests });
    } catch (error) {
        console.error('getMentorshipRequests error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch mentorship requests.' });
    }
}

// ==================== Industry Newsfeed ====================

/**
 * GET /api/alumni/industry-posts
 * Returns industry posts, optionally filtered by tag
 */
function getIndustryPosts(req, res) {
    try {
        const db = getDatabase();
        const { tag } = req.query;
        let query = `
            SELECT ip.*, ap.name as alumni_name, ap.company, ap.role, ap.avatar_url, ap.batch_year
            FROM industry_posts ip
            JOIN alumni_profiles ap ON ip.alumni_id = ap.id
        `;
        if (tag && tag !== 'All') {
            query += ` WHERE ip.tags = ?`;
        }
        query += ` ORDER BY ip.created_at DESC`;

        const posts = tag && tag !== 'All'
            ? db.prepare(query).all(tag)
            : db.prepare(query).all();

        res.json({ success: true, data: posts });
    } catch (error) {
        console.error('getIndustryPosts error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch industry posts.' });
    }
}

/**
 * POST /api/alumni/industry-posts
 * Alumni creates a new industry post
 */
function createIndustryPost(req, res) {
    try {
        const db = getDatabase();
        const { alumni_id, title, content, tags } = req.body;
        if (!alumni_id || !title || !content) {
            return res.status(400).json({ success: false, message: 'alumni_id, title, and content are required.' });
        }
        const stmt = db.prepare(`
            INSERT INTO industry_posts (alumni_id, title, content, tags)
            VALUES (@alumni_id, @title, @content, @tags)
        `);
        const result = stmt.run({ alumni_id, title, content, tags: tags || 'CSE' });
        const post = db.prepare(`
            SELECT ip.*, ap.name as alumni_name, ap.company, ap.role, ap.avatar_url, ap.batch_year
            FROM industry_posts ip
            JOIN alumni_profiles ap ON ip.alumni_id = ap.id
            WHERE ip.id = ?
        `).get(result.lastInsertRowid);
        res.status(201).json({ success: true, data: post, message: 'Post published!' });
    } catch (error) {
        console.error('createIndustryPost error:', error);
        res.status(500).json({ success: false, message: 'Failed to create post.' });
    }
}

/**
 * POST /api/alumni/industry-posts/:id/like
 * Toggle like on a post
 */
function likeIndustryPost(req, res) {
    try {
        const db = getDatabase();
        const { id } = req.params;
        const post = db.prepare('SELECT * FROM industry_posts WHERE id = ?').get(id);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
        db.prepare('UPDATE industry_posts SET likes = likes + 1 WHERE id = ?').run(id);
        const updated = db.prepare('SELECT likes FROM industry_posts WHERE id = ?').get(id);
        res.json({ success: true, likes: updated.likes });
    } catch (error) {
        console.error('likeIndustryPost error:', error);
        res.status(500).json({ success: false, message: 'Failed to like post.' });
    }
}

// ==================== Direct Q&A ====================

/**
 * GET /api/alumni/questions
 * Returns all Q&A questions with their answers
 */
function getQuestions(req, res) {
    try {
        const db = getDatabase();
        const questions = db.prepare(`
            SELECT * FROM qa_questions ORDER BY created_at DESC
        `).all();

        // Attach answers to each question
        const questionsWithAnswers = questions.map(q => {
            const answers = db.prepare(`
                SELECT qa.*, ap.name as alumni_name, ap.company, ap.role, ap.avatar_url
                FROM qa_answers qa
                JOIN alumni_profiles ap ON qa.alumni_id = ap.id
                WHERE qa.question_id = ?
                ORDER BY qa.created_at ASC
            `).all(q.id);
            return { ...q, answers };
        });

        res.json({ success: true, data: questionsWithAnswers });
    } catch (error) {
        console.error('getQuestions error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch questions.' });
    }
}

/**
 * POST /api/alumni/questions
 * Student posts a new question
 */
function createQuestion(req, res) {
    try {
        const db = getDatabase();
        const { student_name, question, company_context } = req.body;
        if (!student_name || !question) {
            return res.status(400).json({ success: false, message: 'student_name and question are required.' });
        }
        const result = db.prepare(`
            INSERT INTO qa_questions (student_name, question, company_context)
            VALUES (@student_name, @question, @company_context)
        `).run({ student_name, question, company_context: company_context || '' });
        const newQ = db.prepare('SELECT * FROM qa_questions WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json({ success: true, data: { ...newQ, answers: [] }, message: 'Question posted!' });
    } catch (error) {
        console.error('createQuestion error:', error);
        res.status(500).json({ success: false, message: 'Failed to post question.' });
    }
}

/**
 * POST /api/alumni/questions/:id/answer
 * Alumni answers a question
 */
function answerQuestion(req, res) {
    try {
        const db = getDatabase();
        const { id } = req.params;
        const { alumni_id, answer } = req.body;
        if (!alumni_id || !answer) {
            return res.status(400).json({ success: false, message: 'alumni_id and answer are required.' });
        }
        const question = db.prepare('SELECT * FROM qa_questions WHERE id = ?').get(id);
        if (!question) return res.status(404).json({ success: false, message: 'Question not found.' });

        const result = db.prepare(`
            INSERT INTO qa_answers (question_id, alumni_id, answer)
            VALUES (?, ?, ?)
        `).run(id, alumni_id, answer);

        const newAnswer = db.prepare(`
            SELECT qa.*, ap.name as alumni_name, ap.company, ap.role, ap.avatar_url
            FROM qa_answers qa
            JOIN alumni_profiles ap ON qa.alumni_id = ap.id
            WHERE qa.id = ?
        `).get(result.lastInsertRowid);

        res.status(201).json({ success: true, data: newAnswer, message: 'Answer posted!' });
    } catch (error) {
        console.error('answerQuestion error:', error);
        res.status(500).json({ success: false, message: 'Failed to post answer.' });
    }
}

function deleteAlumni(req, res) {
    try {
        const db = getDatabase();
        const result = db.prepare('DELETE FROM alumni_profiles WHERE id = ?').run(req.params.id);
        if (result.changes === 0) return res.status(404).json({ success: false, message: 'Alumni not found.' });
        res.json({ success: true, message: 'Alumni profile removed.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete alumni.' });
    }
}

function deleteIndustryPost(req, res) {
    try {
        const db = getDatabase();
        const result = db.prepare('DELETE FROM industry_posts WHERE id = ?').run(req.params.id);
        if (result.changes === 0) return res.status(404).json({ success: false, message: 'Post not found.' });
        res.json({ success: true, message: 'Post deleted.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete post.' });
    }
}

function deleteQuestion(req, res) {
    try {
        const db = getDatabase();
        const result = db.prepare('DELETE FROM qa_questions WHERE id = ?').run(req.params.id);
        if (result.changes === 0) return res.status(404).json({ success: false, message: 'Question not found.' });
        res.json({ success: true, message: 'Question deleted.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete question.' });
    }
}

module.exports = {
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
};

