/**
 * Categories Page
 * Browse all categories with their news
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { categoriesAPI } from '../services/api';

function Categories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await categoriesAPI.getAll();
            setCategories(response.data.categories);
        } catch (err) {
            setError('Failed to load categories');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <main className="main-content">
                <div className="container">
                    <div className="loading">
                        <div className="loading-spinner"></div>
                        <span>Loading categories...</span>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="main-content">
            <div className="container">
                <div className="dashboard-header">
                    <h1 className="dashboard-title">Browse Categories</h1>
                    <p className="dashboard-subtitle">
                        Explore news by category
                    </p>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <span>⚠️</span>
                        {error}
                    </div>
                )}

                <div className="news-grid">
                    {categories.map((category) => (
                        <Link
                            key={category.id}
                            to={`/?category=${category.slug}`}
                            className="card"
                            style={{ textDecoration: 'none' }}
                        >
                            <div
                                className="card-image"
                                style={{
                                    background: `linear-gradient(135deg, ${category.color}40 0%, ${category.color}10 100%)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '4rem'
                                }}
                            >
                                {category.icon}
                            </div>
                            <div className="card-content">
                                <h3 className="card-title" style={{ color: category.color }}>
                                    {category.name}
                                </h3>
                                <p className="card-description">
                                    {category.description}
                                </p>
                                <div className="card-footer">
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        background: `${category.color}20`,
                                        color: category.color,
                                        borderRadius: 'var(--radius-full)',
                                        fontSize: '0.875rem',
                                        fontWeight: 500
                                    }}>
                                        {category.news_count} {category.news_count === 1 ? 'article' : 'articles'}
                                    </span>
                                    <span style={{ color: 'var(--primary-light)' }}>
                                        View All →
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    );
}

export default Categories;
