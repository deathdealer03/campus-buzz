/**
 * NewsDetail Page
 * Full view of a single news article
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { newsAPI } from '../services/api';

function NewsDetail() {
    const { slug } = useParams();
    const [news, setNews] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchNews();
    }, [slug]);

    const fetchNews = async () => {
        try {
            const response = await newsAPI.getBySlug(slug);
            setNews(response.data.news);
        } catch (err) {
            setError('Failed to load article');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <main className="main-content">
                <div className="container">
                    <div className="loading">
                        <div className="loading-spinner"></div>
                        <span>Loading article...</span>
                    </div>
                </div>
            </main>
        );
    }

    if (error || !news) {
        return (
            <main className="main-content">
                <div className="container">
                    <div className="empty-state">
                        <div className="empty-state-icon">📰</div>
                        <h3 className="empty-state-title">Article Not Found</h3>
                        <p className="empty-state-text">{error || 'The article you\'re looking for doesn\'t exist.'}</p>
                        <Link to="/" className="btn btn-primary">Back to Home</Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="main-content">
            <div className="container" style={{ maxWidth: '800px' }}>
                {/* Back Link */}
                <Link to="/" className="btn btn-ghost mb-4">
                    ← Back to News
                </Link>

                {/* Article */}
                <article className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Hero Image */}
                    {news.image_url && (
                        <img
                            src={news.image_url}
                            alt={news.title}
                            style={{
                                width: '100%',
                                height: '400px',
                                objectFit: 'cover',
                                background: 'var(--bg-secondary)'
                            }}
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                    )}

                    <div style={{ padding: '2rem' }}>
                        {/* Meta */}
                        <div className="flex items-center gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
                            {news.category_name && (
                                <span
                                    style={{
                                        padding: '0.375rem 1rem',
                                        background: `${news.category_color}20`,
                                        color: news.category_color,
                                        borderRadius: 'var(--radius-full)',
                                        fontWeight: 500,
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    {news.category_icon} {news.category_name}
                                </span>
                            )}
                            {news.is_pinned && (
                                <span style={{
                                    padding: '0.375rem 1rem',
                                    background: 'var(--primary)',
                                    color: 'white',
                                    borderRadius: 'var(--radius-full)',
                                    fontWeight: 500,
                                    fontSize: '0.875rem'
                                }}>
                                    📌 Pinned
                                </span>
                            )}
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                {news.views} views
                            </span>
                        </div>

                        {/* Title */}
                        <h1 style={{ fontSize: '2rem', marginBottom: '1rem', lineHeight: 1.3 }}>
                            {news.title}
                        </h1>

                        {/* Description */}
                        <p style={{
                            fontSize: '1.125rem',
                            color: 'var(--text-secondary)',
                            marginBottom: '2rem',
                            lineHeight: 1.6
                        }}>
                            {news.description}
                        </p>

                        {/* Author & Date */}
                        <div className="flex items-center justify-between mb-5" style={{
                            padding: '1rem',
                            background: 'var(--bg-glass)',
                            borderRadius: 'var(--radius-lg)'
                        }}>
                            <div className="flex items-center gap-3">
                                <div className="user-avatar" style={{ width: 48, height: 48, fontSize: '1.25rem' }}>
                                    {news.author_name?.charAt(0).toUpperCase() || 'A'}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{news.author_name}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                                        {news.author_role}
                                    </div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Published on</div>
                                <div style={{ fontWeight: 500 }}>{formatDate(news.created_at)}</div>
                            </div>
                        </div>

                        {/* Content */}
                        {news.content && (
                            <div style={{
                                lineHeight: 1.8,
                                fontSize: '1.05rem',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {news.content}
                            </div>
                        )}
                    </div>
                </article>
            </div>
        </main>
    );
}

export default NewsDetail;
