/**
 * Research & Achievements Dashboard
 */
import { useState, useEffect } from 'react';
import { researchAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

// ─── Sub-components ──────────────────────────────────────────────────────────

function CitationModal({ paper, onClose }) {
    const citation = `${paper.author_name} (${new Date(paper.publication_date).getFullYear()}). ${paper.title}. ${paper.journal_conference}.`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(citation);
        alert('Citation copied!');
        onClose();
        // Increment citation count in backend
        researchAPI.citePaper(paper.id);
    };

    return (
        <div className="alumni-modal-overlay" onClick={onClose}>
            <div className="alumni-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>📜 Generate Citation</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <p className="text-muted mb-3">APA Format:</p>
                    <div className="citation-box">
                        {citation}
                    </div>
                    <div className="modal-actions mt-4">
                        <button className="btn btn-primary" onClick={copyToClipboard}>📋 Copy & Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AddResearchModal({ onClose, onAdd }) {
    const [formData, setFormData] = useState({
        title: '',
        abstract: '',
        journal_conference: '',
        publication_date: new Date().toISOString().split('T')[0],
        pdf_link: '',
        looking_for_assistants: false
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await onAdd(formData);
            onClose();
        } catch (error) {
            alert('Failed to add paper: ' + error.message);
        }
    };

    return (
        <div className="alumni-modal-overlay" onClick={onClose}>
            <div className="alumni-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>📄 Add Research Paper</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label>Title</label>
                        <input type="text" className="form-input" required
                            value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Abstract</label>
                        <textarea className="form-input" rows="3" required
                            value={formData.abstract} onChange={e => setFormData({ ...formData, abstract: e.target.value })}></textarea>
                    </div>
                    <div className="form-group">
                        <label>Journal / Conference</label>
                        <input type="text" className="form-input" required
                            value={formData.journal_conference} onChange={e => setFormData({ ...formData, journal_conference: e.target.value })} />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Publication Date</label>
                            <input type="date" className="form-input" required
                                value={formData.publication_date} onChange={e => setFormData({ ...formData, publication_date: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>PDF Link</label>
                            <input type="url" className="form-input" placeholder="https://..."
                                value={formData.pdf_link} onChange={e => setFormData({ ...formData, pdf_link: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-group checkbox-group">
                        <label>
                            <input type="checkbox"
                                checked={formData.looking_for_assistants}
                                onChange={e => setFormData({ ...formData, looking_for_assistants: e.target.checked })} />
                            Looking for Research Assistants?
                        </label>
                    </div>
                    <div className="modal-actions">
                        <button type="submit" className="btn btn-primary">Submit Paper</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function AddAchievementModal({ onClose, onAdd }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        image_url: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await onAdd(formData);
            onClose();
        } catch (error) {
            alert('Failed to add achievement: ' + error.message);
        }
    };

    return (
        <div className="alumni-modal-overlay" onClick={onClose}>
            <div className="alumni-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>🏆 Add Student Achievement</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label>Achievement Title</label>
                        <input type="text" className="form-input" required
                            value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea className="form-input" rows="3" required
                            value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Date</label>
                            <input type="date" className="form-input" required
                                value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Image URL</label>
                            <input type="url" className="form-input" placeholder="https://..."
                                value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} />
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button type="submit" className="btn btn-primary">Add to Wall of Fame</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ResearchCard({ paper, onCite, onDelete, canDelete }) {
    return (
        <div className="research-card">
            <div className="rc-header">
                <span className="rc-type">📄 Paper</span>
                <span className="rc-date">{new Date(paper.publication_date).toLocaleDateString()}</span>
            </div>
            <h3 className="rc-title">{paper.title}</h3>
            <p className="rc-journal">{paper.journal_conference}</p>
            <p className="rc-abstract">{paper.abstract}</p>

            <div className="rc-footer">
                <div className="rc-author">
                    <img src={paper.author_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(paper.author_name)}&background=1565c0&color=fff`} alt="" />
                    <span>{paper.author_name}</span>
                </div>
                <div className="rc-actions">
                    {paper.looking_for_assistants === 1 && (
                        <span className="badge badge-hiring">🕵️ Hiring Assistants</span>
                    )}
                    <button className="btn-icon-text" onClick={() => onCite(paper)}>
                        ❝ {paper.citation_count} Cite
                    </button>
                    <a href={paper.pdf_link} className="btn-icon-text">⬇ PDF</a>
                    {canDelete && (
                        <button className="btn-icon-text text-danger" onClick={() => onDelete(paper.id)} title="Delete Paper">
                            🗑
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function AchievementItem({ ach, onCongratulate, onDelete, canDelete }) {
    const [clapped, setClapped] = useState(false);

    const handleClap = () => {
        if (clapped) return;
        setClapped(true);
        onCongratulate(ach.id);
    };

    return (
        <div className="achievement-item">
            <div className="ach-left">
                <div className="ach-line"></div>
                <div className="ach-dot"></div>
            </div>
            <div className="ach-content">
                <div className="ach-header">
                    <img src={ach.student_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(ach.student_name)}&background=f59e0b&color=fff`} className="ach-avatar" alt="" />
                    <div>
                        <div className="ach-student">{ach.student_name}</div>
                        <div className="ach-date">{new Date(ach.date).toLocaleDateString()}</div>
                    </div>
                    {ach.verified_by_dept === 1 && (
                        <div className="ach-verified" title="Verified by Dept">✓ Verified</div>
                    )}
                </div>
                <h4 className="ach-title">{ach.title}</h4>
                <p className="ach-desc">{ach.description}</p>
                {ach.image_url && <img src={ach.image_url} className="ach-img" alt="Achievement" />}

                <button
                    className={`btn-clap ${clapped ? 'clapped' : ''}`}
                    onClick={handleClap}
                >
                    👏 {ach.claps_count + (clapped ? 1 : 0)} Congratulate
                </button>
                {canDelete && (
                    <button className="btn-icon-text text-danger" style={{ marginLeft: '1rem', fontSize: '0.8rem' }} onClick={() => onDelete(ach.id)} title="Delete Achievement">
                        🗑 Delete
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ResearchPage() {
    const { user } = useAuth();
    const [papers, setPapers] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [leaderboard, setLeaderboard] = useState({ researchers: [], achievers: [] });
    const [loading, setLoading] = useState(true);

    // Modals state
    const [citingPaper, setCitingPaper] = useState(null);
    const [showAddPaper, setShowAddPaper] = useState(false);
    const [showAddAchievement, setShowAddAchievement] = useState(false);

    useEffect(() => {
        Promise.all([
            researchAPI.getAllResearch(),
            researchAPI.getAllAchievements(),
            researchAPI.getLeaderboard()
        ]).then(([pRes, aRes, lRes]) => {
            setPapers(pRes);
            setAchievements(aRes);
            setLeaderboard(lRes);
        }).catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const handleCongratulate = (id) => {
        // Optimistic update
        setAchievements(prev => prev.map(a => a.id === id ? { ...a, claps_count: a.claps_count + 1 } : a));
        researchAPI.congratulateAchievement(id);
    };

    const handleAddPaper = async (data) => {
        const newPaper = await researchAPI.createResearch(data);
        setPapers([newPaper, ...papers]);
    };

    const handleAddAchievement = async (data) => {
        const newAch = await researchAPI.createAchievement(data);
        setAchievements([newAch, ...achievements]);
    };

    const handleDeletePaper = async (id) => {
        if (!window.confirm('Are you sure you want to delete this paper?')) return;
        await researchAPI.deleteResearch(id);
        setPapers(papers.filter(p => p.id !== id));
    };

    const handleDeleteAchievement = async (id) => {
        if (!window.confirm('Are you sure you want to delete this achievement?')) return;
        await researchAPI.deleteAchievement(id);
        setAchievements(achievements.filter(a => a.id !== id));
    };

    const canDelete = (itemAuthorId) => {
        return user?.role === 'admin' || user?.id === itemAuthorId;
    };

    if (loading) return <div className="loading"><div className="loading-spinner"></div>Parsing Data...</div>;

    return (
        <main className="main-content research-page">
            <div className="container">
                {citingPaper && <CitationModal paper={citingPaper} onClose={() => setCitingPaper(null)} />}
                {showAddPaper && <AddResearchModal onClose={() => setShowAddPaper(false)} onAdd={handleAddPaper} />}
                {showAddAchievement && <AddAchievementModal onClose={() => setShowAddAchievement(false)} onAdd={handleAddAchievement} />}

                <section className="research-hero">
                    <h1>🔬 Research & Achievements</h1>
                    <p>Celebrating the academic excellence and innovation of UPES faculty and students.</p>
                </section>

                <div className="research-layout">
                    {/* Left Column: Research Feed */}
                    <div className="research-col-left">
                        <div className="section-header">
                            <h2>Faculty Research Repository</h2>
                            {user?.role === 'faculty' || user?.role === 'admin' ? (
                                <button className="btn btn-secondary btn-sm" onClick={() => setShowAddPaper(true)}>+ Submit Paper</button>
                            ) : null}
                        </div>
                        <div className="research-feed">
                            {papers.map(p => (
                                <ResearchCard
                                    key={p.id}
                                    paper={p}
                                    onCite={setCitingPaper}
                                    onDelete={handleDeletePaper}
                                    canDelete={canDelete(p.author_id)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Achievements & Leaderboard */}
                    <div className="research-col-right">
                        {/* Leaderboard Widget */}
                        <div className="leaderboard-widget">
                            <h3>🏆 Monthly Top Contributors</h3>
                            <div className="lb-list">
                                {leaderboard.researchers.slice(0, 2).map((u, i) => (
                                    <div className="lb-item" key={u.id}>
                                        <div className="lb-rank">#{i + 1}</div>
                                        <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}&background=random`} alt="" />
                                        <div className="lb-info">
                                            <div className="lb-name">{u.name}</div>
                                            <div className="lb-metric">{u.count} Papers</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Wall of Fame */}
                        <div className="wall-of-fame">
                            <div className="section-header">
                                <h2>Student Wall of Fame</h2>
                                {user ? (
                                    <button className="btn btn-secondary btn-sm" onClick={() => setShowAddAchievement(true)}>+ Add</button>
                                ) : null}
                            </div>
                            <div className="timeline">
                                {achievements.map(a => (
                                    <AchievementItem
                                        key={a.id}
                                        ach={a}
                                        onCongratulate={handleCongratulate}
                                        onDelete={handleDeleteAchievement}
                                        canDelete={canDelete(a.student_id)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
