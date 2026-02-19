/**
 * NewsCard Component
 * Displays a news article in card format
 */

import { Link } from 'react-router-dom';

function NewsCard({ news, featured = false }) {
    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Get priority class
    const getPriorityClass = (priority) => {
        if (priority >= 4) return 'high';
        if (priority >= 2) return 'medium';
        return 'low';
    };

    // Get category color
    const getCategoryStyle = (color) => ({
        backgroundColor: `${color}20`,
        color: color,
        borderColor: `${color}40`
    });

    return (
        <Link
            to={`/news/${news.slug || news.id}`}
            className={`card ${news.is_pinned ? 'pinned' : ''}`}
            style={{ position: 'relative', display: 'block' }}
        >
            {/* Image */}
            {news.image_url && (
                <img
                    src={news.image_url}
                    alt={news.title}
                    className="card-image"
                    onError={(e) => {
                        e.target.style.display = 'none';
                    }}
                />
            )}

            {/* Content */}
            <div className="card-content">
                {/* Meta */}
                <div className="card-meta">
                    {news.category_name && (
                        <span
                            className="card-category"
                            style={getCategoryStyle(news.category_color || '#8b5cf6')}
                        >
                            <span>{news.category_icon || '📰'}</span>
                            {news.category_name}
                        </span>
                    )}

                    <span className={`card-priority ${getPriorityClass(news.priority)}`}>
                        <span className="card-priority-dot"></span>
                        {news.priority >= 4 ? 'High' : news.priority >= 2 ? 'Medium' : 'Low'} Priority
                    </span>
                </div>

                {/* Title */}
                <h3 className="card-title">{news.title}</h3>

                {/* Description */}
                <p className="card-description">{news.description}</p>

                {/* Footer */}
                <div className="card-footer">
                    <div className="card-author">
                        <div className="user-avatar" style={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                            {news.author_name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <span>{news.author_name || 'Admin'}</span>
                    </div>
                    <span className="card-date">{formatDate(news.created_at)}</span>
                </div>
            </div>

            {/* Pinned Badge */}
            {news.is_pinned ? (
                <span style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    padding: '0.25rem 0.75rem',
                    background: 'var(--primary)',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-full)',
                    zIndex: 10
                }}>
                    📌 Pinned
                </span>
            ) : null}
        </Link>
    );
}

export default NewsCard;
