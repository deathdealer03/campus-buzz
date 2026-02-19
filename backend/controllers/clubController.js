const { getDatabase } = require('../config/database');

// ── GET ALL CLUBS (grouped by category) ──────────────────────────────────────
const getClubs = (req, res) => {
    try {
        const db = getDatabase();
        const { category } = req.query;
        let clubs;
        if (category && category !== 'All') {
            clubs = db.prepare('SELECT * FROM clubs WHERE category = ? ORDER BY member_count DESC').all(category);
        } else {
            clubs = db.prepare('SELECT * FROM clubs ORDER BY category, member_count DESC').all();
        }
        res.json({ success: true, data: clubs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET SINGLE CLUB ───────────────────────────────────────────────────────────
const getClub = (req, res) => {
    try {
        const db = getDatabase();
        const club = db.prepare('SELECT * FROM clubs WHERE id = ? OR slug = ?').get(req.params.id, req.params.id);
        if (!club) return res.status(404).json({ success: false, message: 'Club not found' });
        const posts = db.prepare('SELECT * FROM club_posts WHERE club_id = ? ORDER BY created_at DESC').all(club.id);
        res.json({ success: true, data: { ...club, posts } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── CREATE CLUB ───────────────────────────────────────────────────────────────
const createClub = (req, res) => {
    try {
        const db = getDatabase();
        const { name, slug, category, description, logo_url, cover_url, founded_year, member_count, contact_email, instagram_url } = req.body;
        if (!name || !slug || !category) return res.status(400).json({ success: false, message: 'name, slug, category required' });
        const result = db.prepare(`
            INSERT INTO clubs (name, slug, category, description, logo_url, cover_url, founded_year, member_count, contact_email, instagram_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(name, slug, category, description, logo_url, cover_url, founded_year || null, member_count || 0, contact_email, instagram_url);
        const club = db.prepare('SELECT * FROM clubs WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json({ success: true, data: club });
    } catch (err) {
        if (err.message.includes('UNIQUE')) return res.status(409).json({ success: false, message: 'A club with this slug already exists.' });
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── DELETE CLUB ───────────────────────────────────────────────────────────────
const deleteClub = (req, res) => {
    try {
        const db = getDatabase();
        const result = db.prepare('DELETE FROM clubs WHERE id = ?').run(req.params.id);
        if (result.changes === 0) return res.status(404).json({ success: false, message: 'Club not found' });
        res.json({ success: true, message: 'Club deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET POSTS FOR A CLUB ──────────────────────────────────────────────────────
const getClubPosts = (req, res) => {
    try {
        const db = getDatabase();
        const { type } = req.query;
        let posts;
        if (type && type !== 'All') {
            posts = db.prepare('SELECT cp.*, c.name as club_name, c.category FROM club_posts cp JOIN clubs c ON cp.club_id = c.id WHERE cp.club_id = ? AND cp.post_type = ? ORDER BY cp.created_at DESC').all(req.params.clubId, type);
        } else {
            posts = db.prepare('SELECT cp.*, c.name as club_name, c.category FROM club_posts cp JOIN clubs c ON cp.club_id = c.id WHERE cp.club_id = ? ORDER BY cp.created_at DESC').all(req.params.clubId);
        }
        res.json({ success: true, data: posts });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET ALL POSTS (across clubs, filterable) ──────────────────────────────────
const getAllPosts = (req, res) => {
    try {
        const db = getDatabase();
        const { category, type, limit = 50 } = req.query;
        let sql = `SELECT cp.*, c.name as club_name, c.category, c.logo_url as club_logo FROM club_posts cp JOIN clubs c ON cp.club_id = c.id WHERE 1=1`;
        const params = [];
        if (category && category !== 'All') { sql += ` AND c.category = ?`; params.push(category); }
        if (type && type !== 'All') { sql += ` AND cp.post_type = ?`; params.push(type); }
        sql += ` ORDER BY cp.created_at DESC LIMIT ?`;
        params.push(parseInt(limit));
        const posts = db.prepare(sql).all(...params);
        res.json({ success: true, data: posts });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── CREATE CLUB POST ──────────────────────────────────────────────────────────
const createClubPost = (req, res) => {
    try {
        const db = getDatabase();
        const { club_id, title, content, image_url, post_type } = req.body;
        if (!club_id || !title || !content) return res.status(400).json({ success: false, message: 'club_id, title, content required' });
        const result = db.prepare(`
            INSERT INTO club_posts (club_id, title, content, image_url, post_type)
            VALUES (?, ?, ?, ?, ?)
        `).run(club_id, title, content, image_url || null, post_type || 'announcement');
        const post = db.prepare(`SELECT cp.*, c.name as club_name, c.category, c.logo_url as club_logo FROM club_posts cp JOIN clubs c ON cp.club_id = c.id WHERE cp.id = ?`).get(result.lastInsertRowid);
        res.status(201).json({ success: true, data: post });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── DELETE CLUB POST ──────────────────────────────────────────────────────────
const deleteClubPost = (req, res) => {
    try {
        const db = getDatabase();
        const result = db.prepare('DELETE FROM club_posts WHERE id = ?').run(req.params.postId);
        if (result.changes === 0) return res.status(404).json({ success: false, message: 'Post not found' });
        res.json({ success: true, message: 'Post deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── LIKE CLUB POST ────────────────────────────────────────────────────────────
const likeClubPost = (req, res) => {
    try {
        const db = getDatabase();
        db.prepare('UPDATE club_posts SET likes = likes + 1 WHERE id = ?').run(req.params.postId);
        const post = db.prepare('SELECT likes FROM club_posts WHERE id = ?').get(req.params.postId);
        res.json({ success: true, likes: post?.likes ?? 0 });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getClubs, getClub, createClub, deleteClub, getClubPosts, getAllPosts, createClubPost, deleteClubPost, likeClubPost };
