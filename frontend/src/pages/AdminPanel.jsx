/**
 * Admin Panel Page
 * News management for Admin and Faculty
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { newsAPI, categoriesAPI } from '../services/api';

function AdminPanel() {
    const { user, isAdmin } = useAuth();
    const [news, setNews] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingNews, setEditingNews] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        content: '',
        category_id: '',
        priority: 3,
        image_url: '',
        is_pinned: false,
        status: 'published'
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [newsRes, catRes] = await Promise.all([
                newsAPI.getAll({ limit: 100 }),
                categoriesAPI.getAll()
            ]);
            setNews(newsRes.data.news);
            setCategories(catRes.data.categories);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const openModal = (newsItem = null) => {
        if (newsItem) {
            setEditingNews(newsItem);
            setFormData({
                title: newsItem.title,
                description: newsItem.description,
                content: newsItem.content || '',
                category_id: newsItem.category_id,
                priority: newsItem.priority,
                image_url: newsItem.image_url || '',
                is_pinned: newsItem.is_pinned,
                status: newsItem.status
            });
        } else {
            setEditingNews(null);
            setFormData({
                title: '',
                description: '',
                content: '',
                category_id: categories[0]?.id || '',
                priority: 3,
                image_url: '',
                is_pinned: false,
                status: 'published'
            });
        }
        setShowModal(true);
        setError('');
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingNews(null);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            if (editingNews) {
                await newsAPI.update(editingNews.id, formData);
                setSuccess('News updated successfully!');
            } else {
                await newsAPI.create(formData);
                setSuccess('News created successfully!');
            }
            closeModal();
            fetchData();
        } catch (err) {
            setError(err.message || 'Failed to save news');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this article?')) return;

        try {
            await newsAPI.delete(id);
            setSuccess('News deleted successfully!');
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <main className="main-content">
                <div className="container">
                    <div className="loading">
                        <div className="loading-spinner"></div>
                        <span>Loading...</span>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="main-content">
            <div className="container">
                <div className="admin-layout">
                    {/* Sidebar */}
                    <aside className="admin-sidebar">
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Admin Panel</h3>
                        <nav className="admin-nav">
                            <button className="admin-nav-item active">
                                📰 News
                            </button>
                            {isAdmin() && (
                                <button className="admin-nav-item">
                                    📁 Categories
                                </button>
                            )}
                            {isAdmin() && (
                                <button className="admin-nav-item">
                                    👥 Users
                                </button>
                            )}
                        </nav>

                        <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-lg)' }}>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Logged in as</div>
                            <div style={{ fontWeight: 600 }}>{user?.name}</div>
                            <span className={`badge badge-${user?.role}`}>{user?.role}</span>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="admin-content">
                        <div className="admin-header">
                            <div>
                                <h2>Manage News</h2>
                                <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    Create, edit, and delete news articles
                                </p>
                            </div>
                            <button className="btn btn-primary" onClick={() => openModal()}>
                                ➕ Create News
                            </button>
                        </div>

                        {/* Alerts */}
                        {success && (
                            <div className="alert alert-success">✅ {success}</div>
                        )}
                        {error && !showModal && (
                            <div className="alert alert-error">⚠️ {error}</div>
                        )}

                        {/* News Table */}
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Category</th>
                                        <th>Priority</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {news.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                <div style={{ maxWidth: '300px' }}>
                                                    <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
                                                        {item.is_pinned && '📌 '}{item.title}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                        by {item.author_name}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    background: `${item.category_color}20`,
                                                    color: item.category_color,
                                                    borderRadius: 'var(--radius-full)',
                                                    fontSize: '0.8rem'
                                                }}>
                                                    {item.category_icon} {item.category_name}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem'
                                                }}>
                                                    {'⭐'.repeat(Math.min(item.priority, 5))}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge badge-${item.status}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td style={{ whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                                                {formatDate(item.created_at)}
                                            </td>
                                            <td>
                                                <div className="table-actions">
                                                    <button
                                                        className="btn btn-sm btn-secondary"
                                                        onClick={() => openModal(item)}
                                                    >
                                                        ✏️ Edit
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleDelete(item.id)}
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {news.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-state-icon">📰</div>
                                <h3 className="empty-state-title">No News Yet</h3>
                                <p className="empty-state-text">Create your first news article to get started.</p>
                                <button className="btn btn-primary" onClick={() => openModal()}>
                                    Create News
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {editingNews ? 'Edit News' : 'Create News'}
                            </h3>
                            <button className="modal-close" onClick={closeModal}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {error && (
                                    <div className="alert alert-error">⚠️ {error}</div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Title *</label>
                                    <input
                                        type="text"
                                        name="title"
                                        className="form-input"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="Enter news title"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description *</label>
                                    <textarea
                                        name="description"
                                        className="form-textarea"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Brief description of the news"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Full Content</label>
                                    <textarea
                                        name="content"
                                        className="form-textarea"
                                        value={formData.content}
                                        onChange={handleChange}
                                        placeholder="Full article content (optional)"
                                        style={{ minHeight: '150px' }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Category *</label>
                                        <select
                                            name="category_id"
                                            className="form-select"
                                            value={formData.category_id}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Select category</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.icon} {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Priority (1-5)</label>
                                        <select
                                            name="priority"
                                            className="form-select"
                                            value={formData.priority}
                                            onChange={handleChange}
                                        >
                                            {[1, 2, 3, 4, 5].map(p => (
                                                <option key={p} value={p}>
                                                    {'⭐'.repeat(p)} ({p})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Image URL</label>
                                    <input
                                        type="url"
                                        name="image_url"
                                        className="form-input"
                                        value={formData.image_url}
                                        onChange={handleChange}
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Status</label>
                                        <select
                                            name="status"
                                            className="form-select"
                                            value={formData.status}
                                            onChange={handleChange}
                                        >
                                            <option value="published">Published</option>
                                            <option value="draft">Draft</option>
                                            <option value="archived">Archived</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">&nbsp;</label>
                                        <div className="form-checkbox-group" style={{ height: '100%', alignItems: 'center' }}>
                                            <input
                                                type="checkbox"
                                                id="is_pinned"
                                                name="is_pinned"
                                                className="form-checkbox"
                                                checked={formData.is_pinned}
                                                onChange={handleChange}
                                            />
                                            <label htmlFor="is_pinned">📌 Pin this article</label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingNews ? 'Update News' : 'Create News'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}

export default AdminPanel;
