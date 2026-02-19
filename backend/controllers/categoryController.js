/**
 * Category Controller
 * Handles category operations
 */

const { getDatabase } = require('../config/database');

/**
 * Get all categories
 * GET /api/categories
 */
function getAllCategories(req, res) {
    try {
        const db = getDatabase();

        const categories = db.prepare(`
            SELECT 
                c.*,
                COUNT(n.id) as news_count
            FROM categories c
            LEFT JOIN news n ON c.id = n.category_id AND n.status = 'published'
            GROUP BY c.id
            ORDER BY c.name ASC
        `).all();

        res.json({
            success: true,
            data: { categories }
        });

    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
}

/**
 * Get category by slug with its news
 * GET /api/categories/:slug
 */
function getCategoryBySlug(req, res) {
    try {
        const { slug } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const db = getDatabase();

        const category = db.prepare('SELECT * FROM categories WHERE slug = ?').get(slug);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found.'
            });
        }

        // Get news for this category
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const news = db.prepare(`
            SELECT 
                n.*,
                u.name as author_name
            FROM news n
            LEFT JOIN users u ON n.author_id = u.id
            WHERE n.category_id = ? AND n.status = 'published'
            ORDER BY n.is_pinned DESC, n.priority DESC, n.created_at DESC
            LIMIT ? OFFSET ?
        `).all(category.id, parseInt(limit), offset);

        const total = db.prepare(`
            SELECT COUNT(*) as count FROM news 
            WHERE category_id = ? AND status = 'published'
        `).get(category.id).count;

        res.json({
            success: true,
            data: {
                category,
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
        console.error('Get category error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
}

/**
 * Create new category (Admin only)
 * POST /api/categories
 */
function createCategory(req, res) {
    try {
        const { name, description, icon, color } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Category name is required.'
            });
        }

        const db = getDatabase();

        // Generate slug
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        // Check if category exists
        const existing = db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug);
        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'Category with this name already exists.'
            });
        }

        const result = db.prepare(`
            INSERT INTO categories (name, slug, description, icon, color)
            VALUES (?, ?, ?, ?, ?)
        `).run(name, slug, description || '', icon || '📰', color || '#3b82f6');

        const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);

        res.status(201).json({
            success: true,
            message: 'Category created successfully.',
            data: { category }
        });

    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
}

/**
 * Update category (Admin only)
 * PUT /api/categories/:id
 */
function updateCategory(req, res) {
    try {
        const { id } = req.params;
        const { name, description, icon, color } = req.body;

        const db = getDatabase();

        const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found.'
            });
        }

        const updates = [];
        const values = [];

        if (name) {
            updates.push('name = ?');
            values.push(name);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }
        if (icon) {
            updates.push('icon = ?');
            values.push(icon);
        }
        if (color) {
            updates.push('color = ?');
            values.push(color);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update.'
            });
        }

        values.push(id);
        db.prepare(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`).run(...values);

        const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);

        res.json({
            success: true,
            message: 'Category updated successfully.',
            data: { category: updated }
        });

    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
}

/**
 * Delete category (Admin only)
 * DELETE /api/categories/:id
 */
function deleteCategory(req, res) {
    try {
        const { id } = req.params;
        const db = getDatabase();

        const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found.'
            });
        }

        // Check if category has news
        const newsCount = db.prepare('SELECT COUNT(*) as count FROM news WHERE category_id = ?').get(id).count;
        if (newsCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category with ${newsCount} news articles. Remove or reassign them first.`
            });
        }

        db.prepare('DELETE FROM categories WHERE id = ?').run(id);

        res.json({
            success: true,
            message: 'Category deleted successfully.'
        });

    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
}

module.exports = {
    getAllCategories,
    getCategoryBySlug,
    createCategory,
    updateCategory,
    deleteCategory
};
