/**
 * Alumni Page
 * Features: Spotlight, Mentorship Match, Industry Newsfeed, Direct Q&A
 */

import { useState, useEffect } from 'react';
import { alumniAPI } from '../services/api';

// ─── Simple Toast ────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, 3500);
        return () => clearTimeout(t);
    }, [onClose]);
    return (
        <div className={`alumni-toast alumni-toast-${type}`}>
            <span>{message}</span>
            <button onClick={onClose}>✕</button>
        </div>
    );
}

// ─── Tab: Alumni Spotlight ────────────────────────────────────────────────────
function SpotlightTab() {
    const [alumni, setAlumni] = useState([]);
    const [loading, setLoading] = useState(true);
    const [active, setActive] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', batch_year: '', branch: 'CSE', company: '', role: '', bio: '', career_update: '', avatar_url: '', email: '' });
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        alumniAPI.getSpotlights()
            .then(r => { setAlumni(r.data); if (r.data.length) setActive(r.data[0]); })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await alumniAPI.createAlumni({ ...form, batch_year: parseInt(form.batch_year) });
            setAlumni(prev => [res.data, ...prev]);
            setActive(res.data);
            setToast({ message: 'Alumni profile added! 🎉', type: 'success' });
            setShowForm(false);
            setForm({ name: '', batch_year: '', branch: 'CSE', company: '', role: '', bio: '', career_update: '', avatar_url: '', email: '' });
        } catch {
            setToast({ message: 'Failed to add profile. Try again.', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="alumni-loading">Loading spotlights…</div>;

    return (
        <div className="spotlight-container">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Story Strip */}
            <div className="story-strip">
                <div className="story-strip-inner">
                    {alumni.map(a => (
                        <button
                            key={a.id}
                            onClick={() => setActive(a)}
                            className={`story-bubble ${active?.id === a.id ? 'active' : ''}`}
                        >
                            <div className="story-ring">
                                <img src={a.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.name)}&background=1565c0&color=fff&size=80`} alt={a.name} />
                            </div>
                            <span className="story-name">{a.name.split(' ')[0]}</span>
                        </button>
                    ))}
                    <button className="story-bubble add-story" onClick={() => setShowForm(true)}>
                        <div className="story-ring add-ring">
                            <div className="story-add-icon">+</div>
                        </div>
                        <span className="story-name">Add</span>
                    </button>
                </div>
            </div>

            {/* Active Story Card */}
            {active && (
                <div className="spotlight-card">
                    <div className="spotlight-card-left">
                        <img
                            src={active.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(active.name)}&background=1565c0&color=fff&size=200`}
                            alt={active.name}
                            className="spotlight-avatar"
                        />
                        <div className="spotlight-basic">
                            <h3 className="spotlight-name">{active.name}</h3>
                            <p className="spotlight-role">{active.role} @ {active.company}</p>
                            <div className="spotlight-badges">
                                <span className="alumni-badge badge-batch">Batch {active.batch_year}</span>
                                <span className="alumni-badge badge-branch">{active.branch}</span>
                            </div>
                            {active.email && (
                                <a href={`mailto:${active.email}`} className="spotlight-contact">✉ {active.email}</a>
                            )}
                            {active.linkedin_url && (
                                <a href={active.linkedin_url} target="_blank" rel="noreferrer" className="spotlight-linkedin">🔗 LinkedIn</a>
                            )}
                        </div>
                    </div>
                    <div className="spotlight-card-right">
                        <div className="spotlight-update-label">📢 Latest Career Update</div>
                        <blockquote className="spotlight-update">"{active.career_update}"</blockquote>
                        {active.bio && <p className="spotlight-bio">{active.bio}</p>}
                    </div>
                </div>
            )}

            {/* Add Alumni Form Modal */}
            {showForm && (
                <div className="alumni-modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="alumni-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add Alumni Profile</h3>
                            <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="alumni-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Full Name *</label>
                                    <input className="form-input" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Priya Sharma" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Batch Year *</label>
                                    <input className="form-input" required type="number" min="1990" max="2030" value={form.batch_year} onChange={e => setForm(p => ({ ...p, batch_year: e.target.value }))} placeholder="e.g. 2021" />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Company</label>
                                    <input className="form-input" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="e.g. Google" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Role/Designation</label>
                                    <input className="form-input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} placeholder="e.g. Software Engineer" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Career Update / Spotlight Message</label>
                                <textarea className="form-textarea" value={form.career_update} onChange={e => setForm(p => ({ ...p, career_update: e.target.value }))} placeholder="Share a recent milestone or career update…" rows={3} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Short Bio</label>
                                <textarea className="form-textarea" value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} placeholder="A brief bio about yourself…" rows={2} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input className="form-input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Photo URL</label>
                                    <input className="form-input" value={form.avatar_url} onChange={e => setForm(p => ({ ...p, avatar_url: e.target.value }))} placeholder="https://…" />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Saving…' : '🎓 Add Alumni'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Tab: Mentorship Match ────────────────────────────────────────────────────
function MentorshipTab() {
    const [alumni, setAlumni] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState({ student_name: '', student_email: '', topic: '', message: '', scheduled_time: '' });
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        alumniAPI.getSpotlights()
            .then(r => setAlumni(r.data.filter(a => a.is_mentor)))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const handleRequest = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await alumniAPI.requestMentorship({ ...form, alumni_id: selected.id });
            setToast({ message: `Coffee Chat request sent to ${selected.name} ☕`, type: 'success' });
            setSelected(null);
            setForm({ student_name: '', student_email: '', topic: '', message: '', scheduled_time: '' });
        } catch {
            setToast({ message: 'Request failed. Try again.', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="alumni-loading">Finding mentors…</div>;

    return (
        <div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div className="mentorship-intro">
                <h3>☕ Request a Coffee Chat</h3>
                <p>Connect with our alumni for a quick 15-minute career guidance session. Pick a mentor below!</p>
            </div>
            <div className="mentorship-grid">
                {alumni.map(a => (
                    <div key={a.id} className="mentorship-card">
                        <div className="mc-top">
                            <img
                                src={a.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.name)}&background=1565c0&color=fff&size=80`}
                                alt={a.name}
                                className="mc-avatar"
                            />
                            <div className="mc-info">
                                <h4 className="mc-name">{a.name}</h4>
                                <p className="mc-role">{a.role}</p>
                                <p className="mc-company">@ {a.company}</p>
                            </div>
                        </div>
                        <div className="mc-badges">
                            <span className="alumni-badge badge-batch">Batch {a.batch_year}</span>
                            <span className="alumni-badge badge-branch">{a.branch}</span>
                        </div>
                        {a.bio && <p className="mc-bio">{a.bio}</p>}
                        <button
                            className="btn btn-primary mc-btn"
                            onClick={() => setSelected(a)}
                        >
                            ☕ Request Coffee Chat
                        </button>
                    </div>
                ))}
            </div>

            {/* Coffee Chat Modal */}
            {selected && (
                <div className="alumni-modal-overlay" onClick={() => setSelected(null)}>
                    <div className="alumni-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3>☕ Schedule Coffee Chat</h3>
                                <p style={{ color: 'var(--alumni-text-muted)', fontSize: '0.9rem' }}>with {selected.name} · {selected.role} @ {selected.company}</p>
                            </div>
                            <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
                        </div>
                        <form onSubmit={handleRequest} className="alumni-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Your Name *</label>
                                    <input className="form-input" required value={form.student_name} onChange={e => setForm(p => ({ ...p, student_name: e.target.value }))} placeholder="Your full name" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Your Email *</label>
                                    <input className="form-input" required type="email" value={form.student_email} onChange={e => setForm(p => ({ ...p, student_email: e.target.value }))} placeholder="you@upes.ac.in" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Topic / What you'd like to discuss *</label>
                                <input className="form-input" required value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))} placeholder="e.g. FAANG preparation, resume review, career switch to ML…" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Preferred Date & Time</label>
                                <input className="form-input" type="datetime-local" value={form.scheduled_time} onChange={e => setForm(p => ({ ...p, scheduled_time: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Message (Optional)</label>
                                <textarea className="form-textarea" value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Any additional context that would help the alumni prepare…" rows={3} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setSelected(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Sending…' : '☕ Send Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Tab: Industry Newsfeed ────────────────────────────────────────────────────
function NewsfeedTab() {
    const TAGS = ['All', 'CSE', 'Data Science', 'Machine Learning'];
    const [posts, setPosts] = useState([]);
    const [activeTag, setActiveTag] = useState('All');
    const [loading, setLoading] = useState(true);
    const [showPostForm, setShowPostForm] = useState(false);
    const [form, setForm] = useState({ alumni_id: '', title: '', content: '', tags: 'CSE' });
    const [alumni, setAlumni] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [liking, setLiking] = useState({});
    const [toast, setToast] = useState(null);
    const [expandedPosts, setExpandedPosts] = useState({});

    const fetchPosts = (tag) => {
        setLoading(true);
        alumniAPI.getIndustryPosts(tag)
            .then(r => setPosts(r.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        alumniAPI.getSpotlights().then(r => setAlumni(r.data)).catch(() => { });
        fetchPosts('All');
    }, []);

    const handleTagChange = (tag) => {
        setActiveTag(tag);
        fetchPosts(tag);
    };

    const handleLike = async (postId) => {
        if (liking[postId]) return;
        setLiking(p => ({ ...p, [postId]: true }));
        try {
            const res = await alumniAPI.likePost(postId);
            setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: res.likes } : p));
        } catch {
            setToast({ message: 'Could not like post.', type: 'error' });
        } finally {
            setLiking(p => ({ ...p, [postId]: false }));
        }
    };

    const handlePost = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await alumniAPI.createIndustryPost({ ...form, alumni_id: parseInt(form.alumni_id) });
            setPosts(prev => [res.data, ...prev]);
            setToast({ message: 'Post published! 🚀', type: 'success' });
            setShowPostForm(false);
            setForm({ alumni_id: '', title: '', content: '', tags: 'CSE' });
        } catch {
            setToast({ message: 'Failed to publish. Try again.', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const toggleExpand = (id) => setExpandedPosts(p => ({ ...p, [id]: !p[id] }));

    const formatDate = (dt) => {
        const d = new Date(dt);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div className="newsfeed-toolbar">
                <div className="newsfeed-tags">
                    {TAGS.map(tag => (
                        <button
                            key={tag}
                            className={`tag-btn ${activeTag === tag ? 'active' : ''}`}
                            onClick={() => handleTagChange(tag)}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
                <button className="btn btn-primary" onClick={() => setShowPostForm(true)}>+ Post</button>
            </div>

            {loading ? (
                <div className="alumni-loading">Loading feed…</div>
            ) : posts.length === 0 ? (
                <div className="alumni-empty">No posts for this topic yet. Be the first!</div>
            ) : (
                <div className="newsfeed-list">
                    {posts.map(post => (
                        <div key={post.id} className="newsfeed-post">
                            <div className="np-header">
                                <img
                                    src={post.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.alumni_name || 'A')}&background=1565c0&color=fff&size=60`}
                                    alt={post.alumni_name}
                                    className="np-avatar"
                                />
                                <div className="np-meta">
                                    <span className="np-author">{post.alumni_name}</span>
                                    <span className="np-position">{post.role} @ {post.company}</span>
                                    <span className="np-date">{formatDate(post.created_at)}</span>
                                </div>
                                <span className="np-tag-badge">{post.tags}</span>
                            </div>
                            <h4 className="np-title">{post.title}</h4>
                            <p className={`np-content ${expandedPosts[post.id] ? 'expanded' : ''}`}>
                                {post.content}
                            </p>
                            {post.content.length > 250 && (
                                <button className="np-expand" onClick={() => toggleExpand(post.id)}>
                                    {expandedPosts[post.id] ? 'Show less ▲' : 'Read more ▼'}
                                </button>
                            )}
                            <div className="np-actions">
                                <button
                                    className={`np-like-btn ${liking[post.id] ? 'liking' : ''}`}
                                    onClick={() => handleLike(post.id)}
                                >
                                    👍 {post.likes > 0 ? post.likes : ''} Like
                                </button>
                                <button className="np-share-btn">↗ Share</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Post Form Modal */}
            {showPostForm && (
                <div className="alumni-modal-overlay" onClick={() => setShowPostForm(false)}>
                    <div className="alumni-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>📡 Share Industry Insight</h3>
                            <button className="modal-close" onClick={() => setShowPostForm(false)}>✕</button>
                        </div>
                        <form onSubmit={handlePost} className="alumni-form">
                            <div className="form-group">
                                <label className="form-label">Post as Alumni *</label>
                                <select className="form-select" required value={form.alumni_id} onChange={e => setForm(p => ({ ...p, alumni_id: e.target.value }))}>
                                    <option value="">Select alumni…</option>
                                    {alumni.map(a => <option key={a.id} value={a.id}>{a.name} ({a.company})</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category *</label>
                                <select className="form-select" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}>
                                    <option value="CSE">CSE</option>
                                    <option value="Data Science">Data Science</option>
                                    <option value="Machine Learning">Machine Learning</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Title *</label>
                                <input className="form-input" required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="A compelling headline…" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Content *</label>
                                <textarea className="form-textarea" required rows={5} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Share your industry insight, trend, or experience…" />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowPostForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Publishing…' : '🚀 Publish'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Tab: Direct Q&A ─────────────────────────────────────────────────────────
function QandATab() {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [qForm, setQForm] = useState({ student_name: '', question: '', company_context: '' });
    const [answeringId, setAnsweringId] = useState(null);
    const [answerForm, setAnswerForm] = useState({ alumni_id: '', answer: '' });
    const [alumni, setAlumni] = useState([]);
    const [submittingQ, setSubmittingQ] = useState(false);
    const [submittingA, setSubmittingA] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        Promise.all([alumniAPI.getQuestions(), alumniAPI.getSpotlights()])
            .then(([qRes, aRes]) => { setQuestions(qRes.data); setAlumni(aRes.data); })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const handleAskQuestion = async (e) => {
        e.preventDefault();
        setSubmittingQ(true);
        try {
            const res = await alumniAPI.createQuestion(qForm);
            setQuestions(prev => [res.data, ...prev]);
            setToast({ message: 'Question posted! Alumni will answer soon.', type: 'success' });
            setQForm({ student_name: '', question: '', company_context: '' });
        } catch {
            setToast({ message: 'Could not post question.', type: 'error' });
        } finally {
            setSubmittingQ(false);
        }
    };

    const handleAnswer = async (e, qId) => {
        e.preventDefault();
        setSubmittingA(true);
        try {
            const res = await alumniAPI.answerQuestion(qId, { alumni_id: parseInt(answerForm.alumni_id), answer: answerForm.answer });
            setQuestions(prev => prev.map(q =>
                q.id === qId ? { ...q, answers: [...q.answers, res.data] } : q
            ));
            setToast({ message: 'Answer posted! 🎓', type: 'success' });
            setAnsweringId(null);
            setAnswerForm({ alumni_id: '', answer: '' });
        } catch {
            setToast({ message: 'Could not post answer.', type: 'error' });
        } finally {
            setSubmittingA(false);
        }
    };

    const formatDate = (dt) => {
        const d = new Date(dt);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    if (loading) return <div className="alumni-loading">Loading Q&A…</div>;

    return (
        <div className="qa-container">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Ask a Question */}
            <div className="qa-ask-box">
                <h3>❓ Ask the Alumni Network</h3>
                <p>Got a question about interviews, career paths, or company culture? Ask our alumni directly!</p>
                <form onSubmit={handleAskQuestion} className="qa-ask-form">
                    <div className="form-row">
                        <div className="form-group">
                            <input className="form-input" required value={qForm.student_name} onChange={e => setQForm(p => ({ ...p, student_name: e.target.value }))} placeholder="Your name *" />
                        </div>
                        <div className="form-group">
                            <input className="form-input" value={qForm.company_context} onChange={e => setQForm(p => ({ ...p, company_context: e.target.value }))} placeholder="Company / Topic context (optional)" />
                        </div>
                    </div>
                    <div className="qa-ask-row">
                        <input className="form-input" required value={qForm.question} onChange={e => setQForm(p => ({ ...p, question: e.target.value }))} placeholder="What would you like to ask the alumni? *" />
                        <button type="submit" className="btn btn-primary" disabled={submittingQ}>
                            {submittingQ ? '…' : '↪ Ask'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Question Wall */}
            <div className="qa-wall">
                {questions.length === 0 ? (
                    <div className="alumni-empty">No questions yet. Be the first to ask!</div>
                ) : questions.map(q => (
                    <div key={q.id} className="qa-question-card">
                        <div className="qa-q-header">
                            <div className="qa-avatar-placeholder">{q.student_name.charAt(0).toUpperCase()}</div>
                            <div>
                                <div className="qa-student-name">{q.student_name}</div>
                                {q.company_context && (
                                    <span className="qa-context-tag">{q.company_context}</span>
                                )}
                            </div>
                            <span className="qa-date">{formatDate(q.created_at)}</span>
                        </div>
                        <p className="qa-question-text">"{q.question}"</p>

                        {/* Answers */}
                        {q.answers && q.answers.length > 0 && (
                            <div className="qa-answers">
                                {q.answers.map(ans => (
                                    <div key={ans.id} className="qa-answer">
                                        <div className="qa-ans-header">
                                            <img
                                                src={ans.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(ans.alumni_name || 'A')}&background=00838f&color=fff&size=40`}
                                                alt={ans.alumni_name}
                                                className="qa-ans-avatar"
                                            />
                                            <div>
                                                <span className="qa-ans-name">{ans.alumni_name}</span>
                                                <span className="qa-ans-role">{ans.role} @ {ans.company}</span>
                                            </div>
                                            <span className="qa-date">{formatDate(ans.created_at)}</span>
                                        </div>
                                        <p className="qa-answer-text">{ans.answer}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Answer Input */}
                        {answeringId === q.id ? (
                            <form onSubmit={e => handleAnswer(e, q.id)} className="qa-answer-form">
                                <select className="form-select" required value={answerForm.alumni_id} onChange={e => setAnswerForm(p => ({ ...p, alumni_id: e.target.value }))}>
                                    <option value="">Answer as Alumni…</option>
                                    {alumni.map(a => <option key={a.id} value={a.id}>{a.name} ({a.company})</option>)}
                                </select>
                                <textarea className="form-textarea" required rows={3} value={answerForm.answer} onChange={e => setAnswerForm(p => ({ ...p, answer: e.target.value }))} placeholder="Write your answer here…" />
                                <div className="qa-form-btns">
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAnsweringId(null)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary btn-sm" disabled={submittingA}>
                                        {submittingA ? 'Posting…' : '✓ Post Answer'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <button className="qa-answer-btn" onClick={() => { setAnsweringId(q.id); setAnswerForm({ alumni_id: '', answer: '' }); }}>
                                🎓 Answer this question
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Tab: Edit / Manage ──────────────────────────────────────────────────────
function EditTab() {
    const [alumni, setAlumni] = useState([]);
    const [posts, setPosts] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    const load = () => {
        Promise.all([alumniAPI.getSpotlights(), alumniAPI.getIndustryPosts('All'), alumniAPI.getQuestions()])
            .then(([aRes, pRes, qRes]) => { setAlumni(aRes.data); setPosts(pRes.data); setQuestions(qRes.data); })
            .catch(() => { })
            .finally(() => setLoading(false));
    };
    useEffect(() => { load(); }, []);

    const deleteAlumni = async (id, name) => {
        if (!window.confirm(`Remove ${name} from the network?`)) return;
        const res = await alumniAPI.deleteAlumni(id);
        if (res.success) { setToast({ message: '🗑️ Alumni removed', type: 'success' }); setAlumni(p => p.filter(a => a.id !== id)); }
        else setToast({ message: res.message, type: 'error' });
    };
    const deletePost = async (id, title) => {
        if (!window.confirm(`Delete post "${title}"?`)) return;
        const res = await alumniAPI.deletePost(id);
        if (res.success) { setToast({ message: '🗑️ Post deleted', type: 'success' }); setPosts(p => p.filter(x => x.id !== id)); }
        else setToast({ message: res.message, type: 'error' });
    };
    const deleteQuestion = async (id, text) => {
        if (!window.confirm(`Delete question "${text.substring(0, 50)}…"?`)) return;
        const res = await alumniAPI.deleteQuestion(id);
        if (res.success) { setToast({ message: '🗑️ Question deleted', type: 'success' }); setQuestions(p => p.filter(q => q.id !== id)); }
        else setToast({ message: res.message, type: 'error' });
    };

    if (loading) return <div className="alumni-loading">Loading data…</div>;

    return (
        <div className="alumni-edit">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="edit-section-header">
                <h3>✏️ Manage Alumni Content</h3>
                <p>Remove outdated alumni profiles, industry posts, or Q&amp;A questions.</p>
            </div>

            {/* Alumni Profiles */}
            <div className="edit-list-section">
                <h4>👥 Alumni Profiles ({alumni.length})</h4>
                <div className="edit-items-grid">
                    {alumni.map(a => (
                        <div className="edit-item-card" key={a.id}>
                            <div className="edit-item-info">
                                <img src={a.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.name)}&background=1565c0&color=fff&size=60`} alt="" className="edit-item-logo" />
                                <div>
                                    <div className="edit-item-name">{a.name}</div>
                                    <div className="edit-item-meta">{a.role} @ {a.company} · Batch {a.batch_year}</div>
                                </div>
                            </div>
                            <button className="edit-delete-btn" onClick={() => deleteAlumni(a.id, a.name)}>🗑️ Remove</button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Industry Posts */}
            <div className="edit-list-section">
                <h4>📡 Industry Posts ({posts.length})</h4>
                <div className="edit-posts-list">
                    {posts.map(p => (
                        <div className="edit-post-row" key={p.id}>
                            <div className="edit-post-info">
                                <span className="edit-post-type-badge" style={{ background: 'rgba(0,172,193,0.15)', color: '#00e5ff', border: '1px solid rgba(0,229,255,0.3)' }}>{p.tags}</span>
                                <span className="edit-post-club">[{p.alumni_name}]</span>
                                <span className="edit-post-title">{p.title}</span>
                            </div>
                            <button className="edit-delete-btn" onClick={() => deletePost(p.id, p.title)}>🗑️</button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Q&A Questions */}
            <div className="edit-list-section">
                <h4>❓ Q&amp;A Questions ({questions.length})</h4>
                <div className="edit-posts-list">
                    {questions.map(q => (
                        <div className="edit-post-row" key={q.id}>
                            <div className="edit-post-info">
                                <span className="edit-post-club">[{q.student_name}]</span>
                                <span className="edit-post-title">{q.question}</span>
                            </div>
                            <button className="edit-delete-btn" onClick={() => deleteQuestion(q.id, q.question)}>🗑️</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Main Alumni Page ─────────────────────────────────────────────────────────
const TABS = [
    { id: 'spotlight', label: '🎓 Alumni Spotlight' },
    { id: 'mentorship', label: '🤝 Mentorship Match' },
    { id: 'newsfeed', label: '📡 Industry Newsfeed' },
    { id: 'qa', label: '❓ Direct Q&A' },
    { id: 'edit', label: '✏️ Edit / Manage' },
];


import { useAuth } from '../context/AuthContext';

function AlumniPage() {
    const { isAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState('spotlight');

    const visibleTabs = TABS.filter(tab => tab.id !== 'edit' || isAdmin());

    return (
        <main className="main-content alumni-page">
            <div className="container">
                {/* Hero */}
                <div className="alumni-hero">
                    <div className="alumni-hero-text">
                        <h1>🎓 Alumni Network</h1>
                        <p>Connect with UPES graduates working at Google, Microsoft, Flipkart and more. Get mentored, stay updated, and grow your career.</p>
                    </div>
                    <div className="alumni-hero-stats">
                        <div className="alumni-stat">
                            <span className="alumni-stat-num">500+</span>
                            <span className="alumni-stat-label">Alumni</span>
                        </div>
                        <div className="alumni-stat">
                            <span className="alumni-stat-num">100+</span>
                            <span className="alumni-stat-label">Mentors</span>
                        </div>
                        <div className="alumni-stat">
                            <span className="alumni-stat-num">50+</span>
                            <span className="alumni-stat-label">Companies</span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="alumni-tabs">
                    {visibleTabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`alumni-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="alumni-tab-content">
                    {activeTab === 'spotlight' && <SpotlightTab />}
                    {activeTab === 'mentorship' && <MentorshipTab />}
                    {activeTab === 'newsfeed' && <NewsfeedTab />}
                    {activeTab === 'qa' && <QandATab />}
                    {isAdmin() && activeTab === 'edit' && <EditTab />}
                </div>
            </div>
        </main>
    );
}

export default AlumniPage;
