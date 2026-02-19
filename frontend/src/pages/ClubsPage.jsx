import { useState, useEffect, useCallback } from 'react';
import { clubsAPI, alumniAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

// ── Category config ──────────────────────────────────────────────────────────
const CATEGORIES = [
    { id: 'All', icon: '🏛️', color: '#42a5f5' },
    { id: 'Tech', icon: '💻', color: '#00e5ff' },
    { id: 'Cultural', icon: '🎭', color: '#f06292' },
    { id: 'Literary', icon: '📚', color: '#ffb74d' },
    { id: 'Sports', icon: '⚽', color: '#66bb6a' },
    { id: 'Social', icon: '🤝', color: '#ce93d8' },
    { id: 'Academic', icon: '🔬', color: '#4dd0e1' },
];

const POST_TYPES = ['All', 'event', 'achievement', 'announcement', 'project', 'recruitment'];
const POST_TYPE_COLORS = {
    event: '#00acc1', achievement: '#ffd54f', announcement: '#42a5f5',
    project: '#66bb6a', recruitment: '#f06292',
};

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
    useEffect(() => { if (msg) { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); } }, [msg, onClose]);
    if (!msg) return null;
    return (
        <div className={`alumni-toast ${type === 'error' ? 'alumni-toast-error' : 'alumni-toast-success'}`}>
            <span>{msg}</span><button onClick={onClose}>✕</button>
        </div>
    );
}

// ── Main ClubsPage Component ──────────────────────────────────────────────────
export default function ClubsPage() {
    const { isAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState('browse');   // browse | edit
    const [clubs, setClubs] = useState([]);
    const [allPosts, setAllPosts] = useState([]);
    const [filterCat, setFilterCat] = useState('All');
    const [filterType, setFilterType] = useState('All');
    const [expandedClub, setExpandedClub] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ msg: '', type: 'success' });

    // Edit tab state
    const [showAddClub, setShowAddClub] = useState(false);
    const [showAddPost, setShowAddPost] = useState(false);
    const [newClub, setNewClub] = useState({ name: '', slug: '', category: 'Tech', description: '', founded_year: '', member_count: '', contact_email: '' });
    const [newPost, setNewPost] = useState({ club_id: '', title: '', content: '', post_type: 'announcement' });
    const [submitting, setSubmitting] = useState(false);

    const showToast = (msg, type = 'success') => setToast({ msg, type });

    // ── Fetch Data ──────────────────────────────────────────────────────────────
    const fetchClubs = useCallback(async () => {
        const res = await clubsAPI.getClubs();
        if (res.success) setClubs(res.data);
    }, []);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        const res = await clubsAPI.getAllPosts(filterCat, filterType);
        if (res.success) setAllPosts(res.data);
        setLoading(false);
    }, [filterCat, filterType]);

    useEffect(() => { fetchClubs(); }, [fetchClubs]);
    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    // ── Group clubs by category ─────────────────────────────────────────────────
    const clubsByCategory = CATEGORIES.slice(1).reduce((acc, cat) => {
        acc[cat.id] = clubs.filter(c => c.category === cat.id);
        return acc;
    }, {});

    // ── Like post ──────────────────────────────────────────────────────────────
    const handleLike = async (postId) => {
        const res = await clubsAPI.likePost(postId);
        if (res.success) {
            setAllPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: res.likes } : p));
        }
    };

    // ── Add Club ───────────────────────────────────────────────────────────────
    const handleAddClub = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const auto_slug = newClub.slug || newClub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const res = await clubsAPI.createClub({ ...newClub, slug: auto_slug, founded_year: parseInt(newClub.founded_year) || null, member_count: parseInt(newClub.member_count) || 0 });
        setSubmitting(false);
        if (res.success) {
            showToast(`✅ ${res.data.name} added!`);
            setNewClub({ name: '', slug: '', category: 'Tech', description: '', founded_year: '', member_count: '', contact_email: '' });
            setShowAddClub(false);
            fetchClubs();
        } else { showToast(res.message || 'Failed to add club', 'error'); }
    };

    // ── Add Post ───────────────────────────────────────────────────────────────
    const handleAddPost = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const res = await clubsAPI.createPost({ ...newPost, club_id: parseInt(newPost.club_id) });
        setSubmitting(false);
        if (res.success) {
            showToast('✅ Post published!');
            setNewPost({ club_id: '', title: '', content: '', post_type: 'announcement' });
            setShowAddPost(false);
            fetchPosts();
        } else { showToast(res.message || 'Failed to publish post', 'error'); }
    };

    // ── Delete Post ────────────────────────────────────────────────────────────
    const handleDeletePost = async (postId, title) => {
        if (!window.confirm(`Delete "${title}"?`)) return;
        const res = await clubsAPI.deletePost(postId);
        if (res.success) { showToast('🗑️ Post removed'); fetchPosts(); }
        else showToast(res.message, 'error');
    };

    // ── Delete Club ────────────────────────────────────────────────────────────
    const handleDeleteClub = async (clubId, name) => {
        if (!window.confirm(`Delete club "${name}" and all its posts?`)) return;
        const res = await clubsAPI.deleteClub(clubId);
        if (res.success) { showToast('🗑️ Club removed'); fetchClubs(); fetchPosts(); }
        else showToast(res.message, 'error');
    };

    // ── Render ──────────────────────────────────────────────────────────────────
    return (
        <div className="clubs-page container">
            <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '' })} />

            {/* Hero */}
            <div className="clubs-hero">
                <div className="clubs-hero-text">
                    <h1>🏛️ Clubs &amp; Communities</h1>
                    <p>Discover student communities, follow their work, events and achievements — all in one place.</p>
                </div>
                <div className="alumni-hero-stats">
                    <div className="alumni-stat"><span className="alumni-stat-num">{clubs.length}</span><span className="alumni-stat-label">Clubs</span></div>
                    <div className="alumni-stat"><span className="alumni-stat-num">{clubs.reduce((s, c) => s + (c.member_count || 0), 0)}</span><span className="alumni-stat-label">Members</span></div>
                    <div className="alumni-stat"><span className="alumni-stat-num">{allPosts.length}</span><span className="alumni-stat-label">Posts</span></div>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="alumni-tabs">
                {[
                    { id: 'browse', label: '🔍 Browse Clubs' },
                    { id: 'feed', label: '📰 Activity Feed' },
                    { id: 'edit', label: '✏️ Edit / Manage' },
                ].filter(t => t.id !== 'edit' || isAdmin()).map(t => (
                    <button key={t.id} className={`alumni-tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="alumni-tab-content">
                {/* ── BROWSE TAB ── */}
                {activeTab === 'browse' && (
                    <div className="clubs-browse">
                        {CATEGORIES.slice(1).map(cat => {
                            const catClubs = clubsByCategory[cat.id] || [];
                            if (catClubs.length === 0) return null;
                            return (
                                <div className="club-category-section" key={cat.id} id={`cat-${cat.id}`}>
                                    <div className="club-cat-header">
                                        <span className="club-cat-icon" style={{ color: cat.color }}>{cat.icon}</span>
                                        <h2 className="club-cat-title" style={{ color: cat.color }}>{cat.id}</h2>
                                        <span className="club-cat-count">{catClubs.length} club{catClubs.length > 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="club-cards-row">
                                        {catClubs.map(club => (
                                            <div
                                                className={`club-card ${expandedClub === club.id ? 'expanded' : ''}`}
                                                key={club.id}
                                                onClick={() => setExpandedClub(expandedClub === club.id ? null : club.id)}
                                            >
                                                <div className="club-card-cover" style={{ backgroundImage: `url(${club.cover_url})` }}>
                                                    <div className="club-card-overlay" />
                                                    <img className="club-card-logo" src={club.logo_url} alt={club.name} onError={e => e.target.style.display = 'none'} />
                                                </div>
                                                <div className="club-card-body">
                                                    <h3 className="club-card-name">{club.name}</h3>
                                                    <p className="club-card-desc">{club.description}</p>
                                                    <div className="club-card-meta">
                                                        <span>👥 {club.member_count} members</span>
                                                        {club.founded_year && <span>📅 Est. {club.founded_year}</span>}
                                                    </div>
                                                    {club.contact_email && (
                                                        <a className="club-card-contact" href={`mailto:${club.contact_email}`} onClick={e => e.stopPropagation()}>
                                                            ✉️ {club.contact_email}
                                                        </a>
                                                    )}
                                                </div>
                                                <div className="club-card-badge" style={{ background: cat.color }}>{cat.icon} {cat.id}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── FEED TAB ── */}
                {activeTab === 'feed' && (
                    <div className="clubs-feed">
                        {/* Toolbar */}
                        <div className="newsfeed-toolbar">
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {CATEGORIES.map(cat => (
                                    <button key={cat.id} className={`tag-btn ${filterCat === cat.id ? 'active' : ''}`}
                                        onClick={() => setFilterCat(cat.id)}>{cat.icon} {cat.id}</button>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {POST_TYPES.map(t => (
                                    <button key={t} className={`tag-btn ${filterType === t ? 'active' : ''}`}
                                        onClick={() => setFilterType(t)} style={{ textTransform: 'capitalize' }}>{t}</button>
                                ))}
                            </div>
                        </div>

                        {loading ? (
                            <div className="alumni-loading">Loading posts…</div>
                        ) : allPosts.length === 0 ? (
                            <div className="alumni-empty">No posts found for this filter.</div>
                        ) : (
                            <div className="newsfeed-list">
                                {allPosts.map(post => (
                                    <ClubPostCard key={post.id} post={post} onLike={handleLike} />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── EDIT TAB ── */}
                {isAdmin() && activeTab === 'edit' && (
                    <div className="clubs-edit">
                        <div className="edit-section-header">
                            <h3>Manage Clubs &amp; Posts</h3>
                            <p>Add new clubs, publish posts, or remove outdated content.</p>
                        </div>

                        {/* Quick Actions */}
                        <div className="edit-quick-actions">
                            <button className="btn btn-primary" onClick={() => { setShowAddClub(true); setShowAddPost(false); }}>
                                ➕ Add New Club
                            </button>
                            <button className="btn btn-secondary" onClick={() => { setShowAddPost(true); setShowAddClub(false); }}>
                                📝 Publish Post
                            </button>
                        </div>

                        {/* Add Club Form */}
                        {showAddClub && (
                            <div className="edit-form-box">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                    <h4>➕ New Club</h4>
                                    <button className="modal-close" onClick={() => setShowAddClub(false)}>✕</button>
                                </div>
                                <form onSubmit={handleAddClub} className="alumni-form" style={{ padding: 0 }}>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Club Name *</label>
                                            <input className="form-input" required value={newClub.name} onChange={e => setNewClub(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Photography Club" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Category *</label>
                                            <select className="form-input" value={newClub.category} onChange={e => setNewClub(p => ({ ...p, category: e.target.value }))}>
                                                {CATEGORIES.slice(1).map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Description</label>
                                        <textarea className="form-input form-textarea" rows={3} value={newClub.description} onChange={e => setNewClub(p => ({ ...p, description: e.target.value }))} placeholder="What does this club do?" />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Founded Year</label>
                                            <input className="form-input" type="number" min="2000" max="2030" value={newClub.founded_year} onChange={e => setNewClub(p => ({ ...p, founded_year: e.target.value }))} placeholder="2020" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Member Count</label>
                                            <input className="form-input" type="number" min="0" value={newClub.member_count} onChange={e => setNewClub(p => ({ ...p, member_count: e.target.value }))} placeholder="50" />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Contact Email</label>
                                        <input className="form-input" type="email" value={newClub.contact_email} onChange={e => setNewClub(p => ({ ...p, contact_email: e.target.value }))} placeholder="club@upes.ac.in" />
                                    </div>
                                    <div className="modal-actions">
                                        <button type="button" className="btn btn-ghost" onClick={() => setShowAddClub(false)}>Cancel</button>
                                        <button className="btn btn-primary" disabled={submitting}>{submitting ? 'Adding…' : 'Add Club'}</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Add Post Form */}
                        {showAddPost && (
                            <div className="edit-form-box">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                    <h4>📝 New Post</h4>
                                    <button className="modal-close" onClick={() => setShowAddPost(false)}>✕</button>
                                </div>
                                <form onSubmit={handleAddPost} className="alumni-form" style={{ padding: 0 }}>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Club *</label>
                                            <select className="form-input" required value={newPost.club_id} onChange={e => setNewPost(p => ({ ...p, club_id: e.target.value }))}>
                                                <option value="">Select club…</option>
                                                {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Post Type</label>
                                            <select className="form-input" value={newPost.post_type} onChange={e => setNewPost(p => ({ ...p, post_type: e.target.value }))}>
                                                {POST_TYPES.slice(1).map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Title *</label>
                                        <input className="form-input" required value={newPost.title} onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))} placeholder="Post headline…" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Content *</label>
                                        <textarea className="form-input form-textarea" rows={5} required value={newPost.content} onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))} placeholder="Write the full post content here…" />
                                    </div>
                                    <div className="modal-actions">
                                        <button type="button" className="btn btn-ghost" onClick={() => setShowAddPost(false)}>Cancel</button>
                                        <button className="btn btn-primary" disabled={submitting}>{submitting ? 'Publishing…' : 'Publish Post'}</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Manage Clubs List */}
                        <div className="edit-list-section">
                            <h4>All Clubs</h4>
                            <div className="edit-items-grid">
                                {clubs.map(club => (
                                    <div className="edit-item-card" key={club.id}>
                                        <div className="edit-item-info">
                                            <img src={club.logo_url} alt="" className="edit-item-logo" onError={e => e.target.style.display = 'none'} />
                                            <div>
                                                <div className="edit-item-name">{club.name}</div>
                                                <div className="edit-item-meta">{club.category} · {club.member_count} members</div>
                                            </div>
                                        </div>
                                        <button className="edit-delete-btn" onClick={() => handleDeleteClub(club.id, club.name)}>🗑️ Delete</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Manage Posts */}
                        <div className="edit-list-section">
                            <h4>Recent Posts</h4>
                            <div className="edit-posts-list">
                                {allPosts.slice(0, 30).map(post => (
                                    <div className="edit-post-row" key={post.id}>
                                        <div className="edit-post-info">
                                            <span className="edit-post-type-badge" style={{ background: POST_TYPE_COLORS[post.post_type] + '22', color: POST_TYPE_COLORS[post.post_type], border: `1px solid ${POST_TYPE_COLORS[post.post_type]}44` }}>
                                                {post.post_type}
                                            </span>
                                            <span className="edit-post-club">[ {post.club_name} ]</span>
                                            <span className="edit-post-title">{post.title}</span>
                                        </div>
                                        <button className="edit-delete-btn" onClick={() => handleDeletePost(post.id, post.title)}>🗑️</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Club Post Card Sub-component ──────────────────────────────────────────────
function ClubPostCard({ post, onLike }) {
    const [expanded, setExpanded] = useState(false);
    const color = POST_TYPE_COLORS[post.post_type] || '#42a5f5';
    return (
        <div className="newsfeed-post">
            <div className="np-header">
                <img className="np-avatar" src={post.club_logo} alt="" onError={e => e.target.style.display = 'none'} />
                <div className="np-meta">
                    <span className="np-author">{post.club_name}</span>
                    <span className="np-position">{post.category} Club</span>
                    <span className="np-date">{new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <span className="np-tag-badge" style={{ background: color + '22', color, border: `1px solid ${color}44` }}>
                    {post.post_type}
                </span>
            </div>
            <div className="np-title">{post.title}</div>
            <div className={`np-content ${expanded ? 'expanded' : ''}`}>{post.content}</div>
            <button className="np-expand" onClick={() => setExpanded(!expanded)}>{expanded ? 'Show less ▲' : 'Read more ▼'}</button>
            <div className="np-actions">
                <button className="np-like-btn" onClick={() => onLike(post.id)}>👍 {post.likes > 0 ? post.likes : ''} Like</button>
            </div>
        </div>
    );
}
