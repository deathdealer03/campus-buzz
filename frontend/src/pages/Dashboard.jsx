/**
 * Dashboard Page
 * Main news feed with category filters and search
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { newsAPI, categoriesAPI } from '../services/api';
import NewsCard from '../components/NewsCard';
import CategoryFilter from '../components/CategoryFilter';

function Dashboard() {
    const { user } = useAuth();
    const [news, setNews] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeCategory, setActiveCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch initial data
    useEffect(() => {
        fetchCategories();
        fetchNews();
    }, [activeCategory]);

    // Fetch categories
    const fetchCategories = async () => {
        try {
            const response = await categoriesAPI.getAll();
            setCategories(response.data.categories);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    // Fetch news
    const fetchNews = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (activeCategory) params.category = activeCategory;
            if (searchQuery) params.search = searchQuery;

            const response = await newsAPI.getAll(params);
            setNews(response.data.news);
        } catch (err) {
            setError('Failed to load news. Please try again.');
            console.error('Failed to fetch news:', err);
        } finally {
            setLoading(false);
        }
    };

    // Handle search
    const handleSearch = (e) => {
        e.preventDefault();
        fetchNews();
    };

    // Get pinned news
    const pinnedNews = news.filter(n => n.is_pinned);
    const regularNews = news.filter(n => !n.is_pinned);

    return (
        <main className="main-content">
            <div className="container">
                {/* Header */}
                <div className="dashboard-header">
                    <h1 className="dashboard-title">
                        {user ? `Welcome, ${user.name.split(' ')[0]}!` : 'Latest News'}
                    </h1>
                    <p className="dashboard-subtitle">
                        Stay updated with the latest happenings at UPES
                    </p>
                </div>

                {/* Search */}
                <form onSubmit={handleSearch} className="search-container mb-4">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search news..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </form>

                {/* Category Filter */}
                <CategoryFilter
                    categories={categories}
                    activeCategory={activeCategory}
                    onCategoryChange={setActiveCategory}
                />

                {/* Error State */}
                {error && (
                    <div className="alert alert-error">
                        <span>⚠️</span>
                        {error}
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="loading">
                        <div className="loading-spinner"></div>
                        <span>Loading news...</span>
                    </div>
                ) : news.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📰</div>
                        <h3 className="empty-state-title">No News Found</h3>
                        <p className="empty-state-text">
                            {activeCategory
                                ? 'No news in this category yet.'
                                : 'No news articles available at the moment.'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Pinned News (Featured) */}
                        {pinnedNews.length > 0 && (
                            <section className="mb-5">
                                <h2 className="mb-3" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    📌 Important Announcements
                                </h2>
                                <div className="news-grid">
                                    {pinnedNews.map((item) => (
                                        <NewsCard key={item.id} news={item} featured />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Regular News */}
                        <section>
                            <h2 className="mb-3">
                                {activeCategory
                                    ? `${categories.find(c => c.slug === activeCategory)?.icon || ''} ${categories.find(c => c.slug === activeCategory)?.name || 'News'}`
                                    : '📰 Latest Updates'}
                            </h2>
                            <div className="news-grid">
                                {regularNews.map((item) => (
                                    <NewsCard key={item.id} news={item} />
                                ))}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </main>
    );
}

export default Dashboard;
