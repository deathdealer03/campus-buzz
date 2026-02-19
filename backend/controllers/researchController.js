/**
 * Research & Achievements Controller
 */
const { getDatabase } = require('../config/database');

const db = getDatabase();

// ─── Research Papers ─────────────────────────────────────────────────────────

exports.getAllResearch = (req, res) => {
    try {
        const papers = db.prepare(`
            SELECT r.*, u.name as author_name, u.avatar as author_avatar
            FROM research_papers r
            JOIN users u ON r.author_id = u.id
            ORDER BY r.publication_date DESC
        `).all();
        res.json(papers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createResearch = (req, res) => {
    try {
        const { title, abstract, journal_conference, publication_date, pdf_link, looking_for_assistants } = req.body;
        const author_id = req.user.id; // From auth middleware

        const stmt = db.prepare(`
            INSERT INTO research_papers (title, abstract, journal_conference, publication_date, pdf_link, looking_for_assistants, author_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(title, abstract, journal_conference, publication_date, pdf_link, looking_for_assistants ? 1 : 0, author_id);

        const newPaper = db.prepare(`
            SELECT r.*, u.name as author_name, u.avatar as author_avatar
            FROM research_papers r
            JOIN users u ON r.author_id = u.id
            WHERE r.id = ?
        `).get(result.lastInsertRowid);

        res.status(201).json(newPaper);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.incrementCitation = (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('UPDATE research_papers SET citation_count = citation_count + 1 WHERE id = ?').run(id);
        const updated = db.prepare('SELECT citation_count FROM research_papers WHERE id = ?').get(id);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteResearch = (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const paper = db.prepare('SELECT author_id FROM research_papers WHERE id = ?').get(id);
        if (!paper) return res.status(404).json({ error: 'Paper not found' });

        // Allow admin or the author to delete
        if (userRole !== 'admin' && paper.author_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized to delete this paper' });
        }

        db.prepare('DELETE FROM research_papers WHERE id = ?').run(id);
        res.json({ message: 'Paper deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── Achievements ────────────────────────────────────────────────────────────

exports.getAllAchievements = (req, res) => {
    try {
        const achievements = db.prepare(`
            SELECT a.*, u.name as student_name, u.avatar as student_avatar
            FROM achievements a
            JOIN users u ON a.student_id = u.id
            ORDER BY a.date DESC
        `).all();
        res.json(achievements);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createAchievement = (req, res) => {
    try {
        const { title, description, date, image_url } = req.body;
        const student_id = req.user.id;

        const stmt = db.prepare(`
            INSERT INTO achievements (title, description, date, image_url, student_id)
            VALUES (?, ?, ?, ?, ?)
        `);
        const result = stmt.run(title, description, date, image_url, student_id);

        const newAch = db.prepare(`
            SELECT a.*, u.name as student_name, u.avatar as student_avatar
            FROM achievements a
            JOIN users u ON a.student_id = u.id
            WHERE a.id = ?
        `).get(result.lastInsertRowid);

        res.status(201).json(newAch);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.congratulateAchievement = (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('UPDATE achievements SET claps_count = claps_count + 1 WHERE id = ?').run(id);
        const updated = db.prepare('SELECT claps_count FROM achievements WHERE id = ?').get(id);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteAchievement = (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const achievement = db.prepare('SELECT student_id FROM achievements WHERE id = ?').get(id);
        if (!achievement) return res.status(404).json({ error: 'Achievement not found' });

        // Allow admin or the student owner to delete
        if (userRole !== 'admin' && achievement.student_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized to delete this achievement' });
        }

        db.prepare('DELETE FROM achievements WHERE id = ?').run(id);
        res.json({ message: 'Achievement deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── Leaderboard ─────────────────────────────────────────────────────────────

exports.getLeaderboard = (req, res) => {
    try {
        // Top Researchers (by paper count)
        const topResearchers = db.prepare(`
            SELECT u.id, u.name, u.avatar, u.role, COUNT(r.id) as count
            FROM users u
            JOIN research_papers r ON u.id = r.author_id
            GROUP BY u.id
            ORDER BY count DESC
            LIMIT 3
        `).all();

        // Top Achievers (by achievement count)
        const topAchievers = db.prepare(`
            SELECT u.id, u.name, u.avatar, u.role, COUNT(a.id) as count
            FROM users u
            JOIN achievements a ON u.id = a.student_id
            GROUP BY u.id
            ORDER BY count DESC
            LIMIT 3
        `).all();

        res.json({ researchers: topResearchers, achievers: topAchievers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
