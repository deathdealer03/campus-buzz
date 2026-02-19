/**
 * News Controller
 * Handles all news CRUD operations and filtering
 */

const { getDatabase } = require('../config/database');
const { analyzePriority } = require('../utils/priorityAnalyzer');

/**
 * Generate URL-friendly slug from title
 */
function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        + '-' + Date.now().toString(36);
}

/**
 * Get all news with filters
 * GET /api/news
 */
function getAllNews(req, res) {
    try {
        const {
            category,
            search,
            priority,
            status = 'published',
            page = 1,
            limit = 10,
            sortBy = 'created_at',
            order = 'DESC'
        } = req.query;

        const db = getDatabase();

        // Build query
        let query = `
            SELECT 
                n.*,
                c.name as category_name,
                c.slug as category_slug,
                c.icon as category_icon,
                c.color as category_color,
                u.name as author_name,
                u.role as author_role
            FROM news n
            LEFT JOIN categories c ON n.category_id = c.id
            LEFT JOIN users u ON n.author_id = u.id
            WHERE 1=1
        `;
        const params = [];

        // Filter by status
        if (status) {
            query += ' AND n.status = ?';
            params.push(status);
        }

        // Filter by category
        if (category) {
            query += ' AND c.slug = ?';
            params.push(category);
        }

        // Filter by priority
        if (priority) {
            query += ' AND n.priority >= ?';
            params.push(parseInt(priority));
        }

        // Search in title and description
        if (search) {
            query += ' AND (n.title LIKE ? OR n.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        // Ordering - pinned items first, then by specified criteria
        const validSortColumns = ['created_at', 'priority', 'views', 'title'];
        const validOrders = ['ASC', 'DESC'];

        const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
        const sortOrder = validOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';

        query += ` ORDER BY n.is_pinned DESC, n.${sortColumn} ${sortOrder}`;

        // Get total count for pagination
        const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
        const totalResult = db.prepare(countQuery.split('ORDER BY')[0]).get(...params);
        const total = totalResult.total;

        // Pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const news = db.prepare(query).all(...params);

        res.json({
            success: true,
            data: {
                news,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });

    } catch (error) {
        console.error('Get all news error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
}

/**
 * Get prioritized news for dashboard
 * GET /api/news/prioritized
 */
function getPrioritizedNews(req, res) {
    try {
        const db = getDatabase();

        // Get pinned/high priority news
        const prioritizedNews = db.prepare(`
            SELECT 
                n.*,
                c.name as category_name,
                c.slug as category_slug,
                c.icon as category_icon,
                c.color as category_color,
                u.name as author_name
            FROM news n
            LEFT JOIN categories c ON n.category_id = c.id
            LEFT JOIN users u ON n.author_id = u.id
            WHERE n.status = 'published'
            ORDER BY n.is_pinned DESC, n.priority DESC, n.created_at DESC
            LIMIT 10
        `).all();

        res.json({
            success: true,
            data: { news: prioritizedNews }
        });

    } catch (error) {
        console.error('Get prioritized news error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
}

/**
 * Get single news by ID or slug
 * GET /api/news/:identifier
 */
function getNewsById(req, res) {
    try {
        const { identifier } = req.params;
        const db = getDatabase();

        // Check if identifier is ID or slug
        const isId = /^\d+$/.test(identifier);

        const news = db.prepare(`
            SELECT 
                n.*,
                c.name as category_name,
                c.slug as category_slug,
                c.icon as category_icon,
                c.color as category_color,
                u.name as author_name,
                u.email as author_email,
                u.role as author_role
            FROM news n
            LEFT JOIN categories c ON n.category_id = c.id
            LEFT JOIN users u ON n.author_id = u.id
            WHERE ${isId ? 'n.id' : 'n.slug'} = ?
        `).get(identifier);

        if (!news) {
            return res.status(404).json({
                success: false,
                message: 'News article not found.'
            });
        }

        // Increment view count
        db.prepare('UPDATE news SET views = views + 1 WHERE id = ?').run(news.id);

        res.json({
            success: true,
            data: { news }
        });

    } catch (error) {
        console.error('Get news by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
}

/**
 * Create new news article
 * POST /api/news
 */
function createNews(req, res) {
    try {
        const {
            title,
            description,
            content,
            category_id,
            priority,
            image_url,
            is_pinned = false,
            status = 'published'
        } = req.body;

        // Validation
        if (!title || !description || !category_id) {
            return res.status(400).json({
                success: false,
                message: 'Title, description, and category are required.'
            });
        }

        const db = getDatabase();

        // Verify category exists
        const category = db.prepare('SELECT id FROM categories WHERE id = ?').get(category_id);
        if (!category) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID.'
            });
        }

        // Generate slug
        const slug = generateSlug(title);

        // Analyze priority if not provided
        const finalPriority = priority || analyzePriority(title, description, content);

        // Insert news
        const result = db.prepare(`
            INSERT INTO news (title, slug, description, content, category_id, priority, author_id, image_url, is_pinned, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(title, slug, description, content || '', category_id, finalPriority, req.user.id, image_url || null, is_pinned ? 1 : 0, status);

        // Get the created news
        const news = db.prepare(`
            SELECT 
                n.*,
                c.name as category_name,
                c.slug as category_slug,
                u.name as author_name
            FROM news n
            LEFT JOIN categories c ON n.category_id = c.id
            LEFT JOIN users u ON n.author_id = u.id
            WHERE n.id = ?
        `).get(result.lastInsertRowid);

        res.status(201).json({
            success: true,
            message: 'News article created successfully.',
            data: { news }
        });

    } catch (error) {
        console.error('Create news error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
}

/**
 * Update news article
 * PUT /api/news/:id
 */
function updateNews(req, res) {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            content,
            category_id,
            priority,
            image_url,
            is_pinned,
            status
        } = req.body;

        const db = getDatabase();

        // Check if news exists
        const existingNews = db.prepare('SELECT * FROM news WHERE id = ?').get(id);
        if (!existingNews) {
            return res.status(404).json({
                success: false,
                message: 'News article not found.'
            });
        }

        // Check permissions (only author or admin can edit)
        if (req.user.role !== 'admin' && existingNews.author_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only edit your own articles.'
            });
        }

        // Build update query
        const updates = [];
        const values = [];

        if (title) {
            updates.push('title = ?');
            values.push(title);
        }
        if (description) {
            updates.push('description = ?');
            values.push(description);
        }
        if (content !== undefined) {
            updates.push('content = ?');
            values.push(content);
        }
        if (category_id) {
            updates.push('category_id = ?');
            values.push(category_id);
        }
        if (priority) {
            updates.push('priority = ?');
            values.push(priority);
        }
        if (image_url !== undefined) {
            updates.push('image_url = ?');
            values.push(image_url);
        }
        if (is_pinned !== undefined) {
            updates.push('is_pinned = ?');
            values.push(is_pinned ? 1 : 0);
        }
        if (status) {
            updates.push('status = ?');
            values.push(status);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update.'
            });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        db.prepare(`UPDATE news SET ${updates.join(', ')} WHERE id = ?`).run(...values);

        // Get updated news
        const news = db.prepare(`
            SELECT 
                n.*,
                c.name as category_name,
                c.slug as category_slug,
                u.name as author_name
            FROM news n
            LEFT JOIN categories c ON n.category_id = c.id
            LEFT JOIN users u ON n.author_id = u.id
            WHERE n.id = ?
        `).get(id);

        res.json({
            success: true,
            message: 'News article updated successfully.',
            data: { news }
        });

    } catch (error) {
        console.error('Update news error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
}

/**
 * Delete news article
 * DELETE /api/news/:id
 */
function deleteNews(req, res) {
    try {
        const { id } = req.params;
        const db = getDatabase();

        // Check if news exists
        const news = db.prepare('SELECT * FROM news WHERE id = ?').get(id);
        if (!news) {
            return res.status(404).json({
                success: false,
                message: 'News article not found.'
            });
        }

        // Only admin can delete, or author can delete their own
        if (req.user.role !== 'admin' && news.author_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can delete articles.'
            });
        }

        db.prepare('DELETE FROM news WHERE id = ?').run(id);

        res.json({
            success: true,
            message: 'News article deleted successfully.'
        });

    } catch (error) {
        console.error('Delete news error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
}

/**
 * Get news statistics (Admin only)
 * GET /api/news/stats
 */
function getNewsStats(req, res) {
    try {
        const db = getDatabase();

        const stats = {
            totalNews: db.prepare('SELECT COUNT(*) as count FROM news').get().count,
            publishedNews: db.prepare("SELECT COUNT(*) as count FROM news WHERE status = 'published'").get().count,
            totalViews: db.prepare('SELECT SUM(views) as total FROM news').get().total || 0,
            byCategory: db.prepare(`
                SELECT c.name, c.icon, COUNT(n.id) as count
                FROM categories c
                LEFT JOIN news n ON c.id = n.category_id AND n.status = 'published'
                GROUP BY c.id
            `).all(),
            recentNews: db.prepare(`
                SELECT id, title, views, created_at 
                FROM news 
                WHERE status = 'published' 
                ORDER BY created_at DESC 
                LIMIT 5
            `).all()
        };

        res.json({
            success: true,
            data: { stats }
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
}

module.exports = {
    getAllNews,
    getPrioritizedNews,
    getNewsById,
    createNews,
    updateNews,
    deleteNews,
    getNewsStats
};
