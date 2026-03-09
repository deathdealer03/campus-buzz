/**
 * CV Generator Page
 * Smart CV Generator with sidebar form and live A4 preview
 * Uses existing UPES light-blue/white campus-buzz theme
 */

import { useState, useRef } from 'react';

// --- AI Polish Simulation ---
const polishText = (text) => {
    if (!text || text.trim().length < 10) return text;
    const verbs = ['Engineered', 'Architected', 'Developed', 'Implemented', 'Designed', 'Optimized', 'Spearheaded', 'Orchestrated'];
    const adverbs = ['efficiently', 'seamlessly', 'robustly', 'dynamically'];
    const randomVerb = verbs[Math.floor(Math.random() * verbs.length)];
    const randomAdverb = adverbs[Math.floor(Math.random() * adverbs.length)];
    let polished = text.trim();
    // Capitalize first letter and add professional flair
    if (polished.charAt(0) === polished.charAt(0).toLowerCase()) {
        polished = randomVerb + ' and ' + randomAdverb + ' ' + polished.charAt(0).toLowerCase() + polished.slice(1);
    }
    if (!polished.endsWith('.')) polished += '.';
    return polished;
};

// --- Collapsible Section Component (defined OUTSIDE to prevent remount on every keystroke) ---
function Section({ id, icon, title, isOpen, onToggle, children }) {
    return (
        <div className="cv-section">
            <button className={`cv-section-header ${isOpen ? 'open' : ''}`} onClick={() => onToggle(id)}>
                <span className="cv-section-icon">{icon}</span>
                <span className="cv-section-title">{title}</span>
                <span className="cv-section-chevron">{isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && <div className="cv-section-body">{children}</div>}
        </div>
    );
}

// --- Default state ---
const defaultState = {
    personal: {
        name: '',
        phone: '',
        email: '',
        linkedin: '',
        github: '',
    },
    summary: '',
    education: [
        {
            id: Date.now(),
            institution: 'UPES, Dehradun',
            degree: 'Bachelor of Technology in Computer Science (CSE)',
            startDate: 'Jul 2023',
            endDate: 'Present',
            cgpa: '8.06/10',
        },
        {
            id: Date.now() + 1,
            institution: '',
            degree: '',
            startDate: '',
            endDate: '',
            cgpa: '',
        },
    ],
    skills: {
        languages: '',
        frameworks: '',
        databases: '',
        tools: '',
    },
    experience: [
        {
            id: Date.now() + 2,
            title: '',
            company: '',
            startDate: '',
            endDate: '',
            duration: '',
            location: '',
            bullets: ['', ''],
        },
    ],
    projects: [
        {
            id: Date.now() + 3,
            name: '',
            techStack: '',
            startDate: '',
            endDate: '',
            description: '',
            contribution: '',
        },
    ],
    certifications: [{ id: Date.now() + 4, text: '' }],
};

function CVGeneratorPage() {
    const [data, setData] = useState(defaultState);
    const [openSections, setOpenSections] = useState({
        personal: true,
        summary: false,
        education: true,
        skills: false,
        experience: false,
        projects: false,
        certifications: false,
    });
    const [polishing, setPolishing] = useState({});
    const previewRef = useRef(null);

    // --- Section toggle ---
    const toggle = (section) =>
        setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));

    // --- Field updaters ---
    const setPersonal = (field, value) =>
        setData((d) => ({ ...d, personal: { ...d.personal, [field]: value } }));

    const setSummary = (value) => setData((d) => ({ ...d, summary: value }));

    const setSkills = (field, value) =>
        setData((d) => ({ ...d, skills: { ...d.skills, [field]: value } }));

    // --- Education ---
    const updateEdu = (idx, field, value) =>
        setData((d) => {
            const edu = [...d.education];
            edu[idx] = { ...edu[idx], [field]: value };
            return { ...d, education: edu };
        });
    const addEdu = () =>
        setData((d) => ({
            ...d,
            education: [
                ...d.education,
                { id: Date.now(), institution: '', degree: '', startDate: '', endDate: '', cgpa: '' },
            ],
        }));
    const removeEdu = (idx) =>
        setData((d) => ({ ...d, education: d.education.filter((_, i) => i !== idx) }));

    // --- Experience ---
    const updateExp = (idx, field, value) =>
        setData((d) => {
            const exp = [...d.experience];
            exp[idx] = { ...exp[idx], [field]: value };
            return { ...d, experience: exp };
        });
    const updateExpBullet = (expIdx, bulletIdx, value) =>
        setData((d) => {
            const exp = [...d.experience];
            const bullets = [...exp[expIdx].bullets];
            bullets[bulletIdx] = value;
            exp[expIdx] = { ...exp[expIdx], bullets };
            return { ...d, experience: exp };
        });
    const addExpBullet = (expIdx) =>
        setData((d) => {
            const exp = [...d.experience];
            exp[expIdx] = { ...exp[expIdx], bullets: [...exp[expIdx].bullets, ''] };
            return { ...d, experience: exp };
        });
    const removeExpBullet = (expIdx, bulletIdx) =>
        setData((d) => {
            const exp = [...d.experience];
            exp[expIdx] = {
                ...exp[expIdx],
                bullets: exp[expIdx].bullets.filter((_, i) => i !== bulletIdx),
            };
            return { ...d, experience: exp };
        });
    const addExp = () =>
        setData((d) => ({
            ...d,
            experience: [
                ...d.experience,
                { id: Date.now(), title: '', company: '', startDate: '', endDate: '', duration: '', location: '', bullets: [''] },
            ],
        }));
    const removeExp = (idx) =>
        setData((d) => ({ ...d, experience: d.experience.filter((_, i) => i !== idx) }));

    // --- Projects ---
    const updateProj = (idx, field, value) =>
        setData((d) => {
            const projects = [...d.projects];
            projects[idx] = { ...projects[idx], [field]: value };
            return { ...d, projects };
        });
    const addProj = () =>
        setData((d) => ({
            ...d,
            projects: [
                ...d.projects,
                { id: Date.now(), name: '', techStack: '', startDate: '', endDate: '', description: '', contribution: '' },
            ],
        }));
    const removeProj = (idx) =>
        setData((d) => ({ ...d, projects: d.projects.filter((_, i) => i !== idx) }));

    const handleAIPolish = (idx, field) => {
        const key = `${idx}-${field}`;
        setPolishing((p) => ({ ...p, [key]: true }));
        setTimeout(() => {
            setData((d) => {
                const projects = [...d.projects];
                projects[idx] = { ...projects[idx], [field]: polishText(projects[idx][field]) };
                return { ...d, projects };
            });
            setPolishing((p) => ({ ...p, [key]: false }));
        }, 800);
    };

    // --- Certifications ---
    const updateCert = (idx, value) =>
        setData((d) => {
            const certs = [...d.certifications];
            certs[idx] = { ...certs[idx], text: value };
            return { ...d, certifications: certs };
        });
    const addCert = () =>
        setData((d) => ({
            ...d,
            certifications: [...d.certifications, { id: Date.now(), text: '' }],
        }));
    const removeCert = (idx) =>
        setData((d) => ({ ...d, certifications: d.certifications.filter((_, i) => i !== idx) }));

    // --- Download PDF ---
    const handleDownload = () => {
        window.print();
    };

    return (
        <main className="main-content">
            <div className="cv-generator-page">
                {/* Top toolbar */}
                <div className="cv-toolbar">
                    <div className="cv-toolbar-left">
                        <h1 className="cv-page-title">
                            <span className="cv-page-icon">📝</span>
                            Smart CV Generator
                        </h1>
                        <p className="cv-page-subtitle">Build a professional, recruiter-ready resume in minutes</p>
                    </div>
                    <button className="btn btn-primary cv-download-btn" onClick={handleDownload} id="cv-download-btn">
                        📄 Download PDF
                    </button>
                </div>

                <div className="cv-layout">
                    {/* ===== LEFT SIDEBAR ===== */}
                    <aside className="cv-sidebar" id="cv-sidebar">
                        {/* Personal Details */}
                        <Section id="personal" icon="👤" title="Personal Details" isOpen={openSections.personal} onToggle={toggle}>
                            <div className="cv-form-grid">
                                <div className="cv-form-group cv-form-full">
                                    <label className="cv-label">Full Name</label>
                                    <input className="cv-input" placeholder="e.g. Abhay Aggarwal" value={data.personal.name} onChange={(e) => setPersonal('name', e.target.value)} id="cv-name" />
                                </div>
                                <div className="cv-form-group">
                                    <label className="cv-label">Phone</label>
                                    <input className="cv-input" placeholder="+91 XXXXXXXXXX" value={data.personal.phone} onChange={(e) => setPersonal('phone', e.target.value)} id="cv-phone" />
                                </div>
                                <div className="cv-form-group">
                                    <label className="cv-label">Email</label>
                                    <input className="cv-input" type="email" placeholder="you@email.com" value={data.personal.email} onChange={(e) => setPersonal('email', e.target.value)} id="cv-email" />
                                </div>
                                <div className="cv-form-group">
                                    <label className="cv-label">LinkedIn</label>
                                    <input className="cv-input" placeholder="linkedin.com/in/username" value={data.personal.linkedin} onChange={(e) => setPersonal('linkedin', e.target.value)} id="cv-linkedin" />
                                </div>
                                <div className="cv-form-group">
                                    <label className="cv-label">GitHub</label>
                                    <input className="cv-input" placeholder="github.com/username" value={data.personal.github} onChange={(e) => setPersonal('github', e.target.value)} id="cv-github" />
                                </div>
                            </div>
                        </Section>

                        {/* Profile Summary */}
                        <Section id="summary" icon="📋" title="Profile Summary" isOpen={openSections.summary} onToggle={toggle}>
                            <div className="cv-form-group">
                                <textarea className="cv-textarea" rows={4} placeholder="An aspiring computer science engineer specializing in..." value={data.summary} onChange={(e) => setSummary(e.target.value)} id="cv-summary" />
                            </div>
                        </Section>

                        {/* Education */}
                        <Section id="education" icon="🎓" title="Education" isOpen={openSections.education} onToggle={toggle}>
                            {data.education.map((edu, idx) => (
                                <div key={edu.id} className="cv-entry-card">
                                    <div className="cv-entry-header">
                                        <span className="cv-entry-num">#{idx + 1}</span>
                                        {data.education.length > 1 && (
                                            <button className="cv-remove-btn" onClick={() => removeEdu(idx)} title="Remove">✕</button>
                                        )}
                                    </div>
                                    <div className="cv-form-grid">
                                        <div className="cv-form-group cv-form-full">
                                            <label className="cv-label">Institution</label>
                                            <input className="cv-input" placeholder="University / School Name" value={edu.institution} onChange={(e) => updateEdu(idx, 'institution', e.target.value)} />
                                        </div>
                                        <div className="cv-form-group cv-form-full">
                                            <label className="cv-label">Degree / Board</label>
                                            <input className="cv-input" placeholder="B.Tech CSE / CBSE Class 12" value={edu.degree} onChange={(e) => updateEdu(idx, 'degree', e.target.value)} />
                                        </div>
                                        <div className="cv-form-group">
                                            <label className="cv-label">Start Date</label>
                                            <input className="cv-input" placeholder="Jul 2023" value={edu.startDate} onChange={(e) => updateEdu(idx, 'startDate', e.target.value)} />
                                        </div>
                                        <div className="cv-form-group">
                                            <label className="cv-label">End Date</label>
                                            <input className="cv-input" placeholder="Present" value={edu.endDate} onChange={(e) => updateEdu(idx, 'endDate', e.target.value)} />
                                        </div>
                                        <div className="cv-form-group">
                                            <label className="cv-label">CGPA / Score</label>
                                            <input className="cv-input" placeholder="8.06/10" value={edu.cgpa} onChange={(e) => updateEdu(idx, 'cgpa', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button className="cv-add-btn" onClick={addEdu}>+ Add Education</button>
                        </Section>

                        {/* Technical Skills */}
                        <Section id="skills" icon="💻" title="Technical Skills" isOpen={openSections.skills} onToggle={toggle}>
                            <div className="cv-form-grid">
                                <div className="cv-form-group cv-form-full">
                                    <label className="cv-label">Languages</label>
                                    <input className="cv-input" placeholder="Java, Python, SQL, HTML5, CSS3, R" value={data.skills.languages} onChange={(e) => setSkills('languages', e.target.value)} id="cv-languages" />
                                </div>
                                <div className="cv-form-group cv-form-full">
                                    <label className="cv-label">Frameworks & Libraries</label>
                                    <input className="cv-input" placeholder="Flask, Streamlit, Java Swing, JDBC, Pandas, NumPy" value={data.skills.frameworks} onChange={(e) => setSkills('frameworks', e.target.value)} id="cv-frameworks" />
                                </div>
                                <div className="cv-form-group cv-form-full">
                                    <label className="cv-label">Databases</label>
                                    <input className="cv-input" placeholder="MySQL, SQLite" value={data.skills.databases} onChange={(e) => setSkills('databases', e.target.value)} id="cv-databases" />
                                </div>
                                <div className="cv-form-group cv-form-full">
                                    <label className="cv-label">Developer Tools</label>
                                    <input className="cv-input" placeholder="Git, GitHub, VS Code, IntelliJ IDEA" value={data.skills.tools} onChange={(e) => setSkills('tools', e.target.value)} id="cv-tools" />
                                </div>
                            </div>
                        </Section>

                        {/* Experience */}
                        <Section id="experience" icon="💼" title="Experience" isOpen={openSections.experience} onToggle={toggle}>
                            {data.experience.map((exp, idx) => (
                                <div key={exp.id} className="cv-entry-card">
                                    <div className="cv-entry-header">
                                        <span className="cv-entry-num">#{idx + 1}</span>
                                        {data.experience.length > 1 && (
                                            <button className="cv-remove-btn" onClick={() => removeExp(idx)} title="Remove">✕</button>
                                        )}
                                    </div>
                                    <div className="cv-form-grid">
                                        <div className="cv-form-group">
                                            <label className="cv-label">Job Title</label>
                                            <input className="cv-input" placeholder="Web Developer Intern" value={exp.title} onChange={(e) => updateExp(idx, 'title', e.target.value)} />
                                        </div>
                                        <div className="cv-form-group">
                                            <label className="cv-label">Company</label>
                                            <input className="cv-input" placeholder="Company Name" value={exp.company} onChange={(e) => updateExp(idx, 'company', e.target.value)} />
                                        </div>
                                        <div className="cv-form-group">
                                            <label className="cv-label">Start Date</label>
                                            <input className="cv-input" placeholder="Jun 2025" value={exp.startDate} onChange={(e) => updateExp(idx, 'startDate', e.target.value)} />
                                        </div>
                                        <div className="cv-form-group">
                                            <label className="cv-label">End Date</label>
                                            <input className="cv-input" placeholder="Jul 2025" value={exp.endDate} onChange={(e) => updateExp(idx, 'endDate', e.target.value)} />
                                        </div>
                                        <div className="cv-form-group">
                                            <label className="cv-label">Duration</label>
                                            <input className="cv-input" placeholder="8 Weeks" value={exp.duration} onChange={(e) => updateExp(idx, 'duration', e.target.value)} />
                                        </div>
                                        <div className="cv-form-group">
                                            <label className="cv-label">Location</label>
                                            <input className="cv-input" placeholder="Remote" value={exp.location} onChange={(e) => updateExp(idx, 'location', e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="cv-bullets-section">
                                        <label className="cv-label">Key Contributions</label>
                                        {exp.bullets.map((bullet, bIdx) => (
                                            <div key={bIdx} className="cv-bullet-row">
                                                <span className="cv-bullet-dot">•</span>
                                                <input className="cv-input cv-bullet-input" placeholder="Describe your contribution..." value={bullet} onChange={(e) => updateExpBullet(idx, bIdx, e.target.value)} />
                                                {exp.bullets.length > 1 && (
                                                    <button className="cv-remove-btn cv-remove-bullet" onClick={() => removeExpBullet(idx, bIdx)}>✕</button>
                                                )}
                                            </div>
                                        ))}
                                        <button className="cv-add-btn cv-add-bullet-btn" onClick={() => addExpBullet(idx)}>+ Add Bullet</button>
                                    </div>
                                </div>
                            ))}
                            <button className="cv-add-btn" onClick={addExp}>+ Add Experience</button>
                        </Section>

                        {/* Projects */}
                        <Section id="projects" icon="🚀" title="Projects" isOpen={openSections.projects} onToggle={toggle}>
                            {data.projects.map((proj, idx) => (
                                <div key={proj.id} className="cv-entry-card">
                                    <div className="cv-entry-header">
                                        <span className="cv-entry-num">#{idx + 1}</span>
                                        {data.projects.length > 1 && (
                                            <button className="cv-remove-btn" onClick={() => removeProj(idx)} title="Remove">✕</button>
                                        )}
                                    </div>
                                    <div className="cv-form-grid">
                                        <div className="cv-form-group">
                                            <label className="cv-label">Project Name</label>
                                            <input className="cv-input" placeholder="Airline Management System" value={proj.name} onChange={(e) => updateProj(idx, 'name', e.target.value)} />
                                        </div>
                                        <div className="cv-form-group">
                                            <label className="cv-label">Tech Stack</label>
                                            <input className="cv-input" placeholder="Java, Swing, MySQL" value={proj.techStack} onChange={(e) => updateProj(idx, 'techStack', e.target.value)} />
                                        </div>
                                        <div className="cv-form-group">
                                            <label className="cv-label">Start Date</label>
                                            <input className="cv-input" placeholder="Aug 2025" value={proj.startDate} onChange={(e) => updateProj(idx, 'startDate', e.target.value)} />
                                        </div>
                                        <div className="cv-form-group">
                                            <label className="cv-label">End Date</label>
                                            <input className="cv-input" placeholder="Nov 2025" value={proj.endDate} onChange={(e) => updateProj(idx, 'endDate', e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="cv-form-group cv-textarea-group">
                                        <div className="cv-label-row">
                                            <label className="cv-label">Description</label>
                                            <button
                                                className={`cv-ai-btn ${polishing[`${idx}-description`] ? 'polishing' : ''}`}
                                                onClick={() => handleAIPolish(idx, 'description')}
                                                disabled={polishing[`${idx}-description`]}
                                                title="AI Polish"
                                            >
                                                {polishing[`${idx}-description`] ? '⏳ Polishing...' : '✨ AI Polish'}
                                            </button>
                                        </div>
                                        <textarea className="cv-textarea" rows={2} placeholder="Built a Java-based system to simulate airline operations..." value={proj.description} onChange={(e) => updateProj(idx, 'description', e.target.value)} />
                                    </div>
                                    <div className="cv-form-group cv-textarea-group">
                                        <div className="cv-label-row">
                                            <label className="cv-label">Contribution</label>
                                            <button
                                                className={`cv-ai-btn ${polishing[`${idx}-contribution`] ? 'polishing' : ''}`}
                                                onClick={() => handleAIPolish(idx, 'contribution')}
                                                disabled={polishing[`${idx}-contribution`]}
                                                title="AI Polish"
                                            >
                                                {polishing[`${idx}-contribution`] ? '⏳ Polishing...' : '✨ AI Polish'}
                                            </button>
                                        </div>
                                        <textarea className="cv-textarea" rows={2} placeholder="Implemented a Swing GUI for user interaction..." value={proj.contribution} onChange={(e) => updateProj(idx, 'contribution', e.target.value)} />
                                    </div>
                                </div>
                            ))}
                            <button className="cv-add-btn" onClick={addProj}>+ Add Project</button>
                        </Section>

                        {/* Certifications */}
                        <Section id="certifications" icon="🏆" title="Certifications & Accomplishments" isOpen={openSections.certifications} onToggle={toggle}>
                            {data.certifications.map((cert, idx) => (
                                <div key={cert.id} className="cv-bullet-row">
                                    <span className="cv-bullet-dot">•</span>
                                    <input className="cv-input cv-bullet-input" placeholder="7th Place, Code Hustle Organized by Hypervision" value={cert.text} onChange={(e) => updateCert(idx, e.target.value)} />
                                    {data.certifications.length > 1 && (
                                        <button className="cv-remove-btn cv-remove-bullet" onClick={() => removeCert(idx)}>✕</button>
                                    )}
                                </div>
                            ))}
                            <button className="cv-add-btn" onClick={addCert}>+ Add Certification</button>
                        </Section>
                    </aside>

                    {/* ===== RIGHT PREVIEW ===== */}
                    <div className="cv-preview-wrapper" id="cv-preview-wrapper">
                        <div className="cv-preview" ref={previewRef} id="cv-preview">
                            {/* Header / Name */}
                            <div className="cv-prev-header">
                                <h1 className="cv-prev-name">{data.personal.name || 'Your Name'}</h1>
                                <div className="cv-prev-contact">
                                    {data.personal.phone && <span>{data.personal.phone}</span>}
                                    {data.personal.email && (
                                        <>
                                            {data.personal.phone && <span className="cv-prev-sep">|</span>}
                                            <a href={`mailto:${data.personal.email}`}>{data.personal.email}</a>
                                        </>
                                    )}
                                    {data.personal.linkedin && (
                                        <>
                                            <span className="cv-prev-sep">|</span>
                                            <a href={`https://${data.personal.linkedin}`} target="_blank" rel="noreferrer">{data.personal.linkedin}</a>
                                        </>
                                    )}
                                    {data.personal.github && (
                                        <>
                                            <span className="cv-prev-sep">|</span>
                                            <a href={`https://${data.personal.github}`} target="_blank" rel="noreferrer">{data.personal.github}</a>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Profile Summary */}
                            {data.summary && (
                                <div className="cv-prev-section">
                                    <h2 className="cv-prev-section-title">Profile Summary</h2>
                                    <p className="cv-prev-summary-text">{data.summary}</p>
                                </div>
                            )}

                            {/* Education */}
                            {data.education.some((e) => e.institution) && (
                                <div className="cv-prev-section">
                                    <h2 className="cv-prev-section-title">Education</h2>
                                    {data.education.filter((e) => e.institution).map((edu, idx) => (
                                        <div key={idx} className="cv-prev-edu-item">
                                            <div className="cv-prev-row">
                                                <strong>{edu.institution}</strong>
                                                <span className="cv-prev-date">{edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ''}</span>
                                            </div>
                                            <div className="cv-prev-row">
                                                <span className="cv-prev-degree">{edu.degree}</span>
                                                {edu.cgpa && <span className="cv-prev-date">CGPA: {edu.cgpa}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Technical Skills */}
                            {(data.skills.languages || data.skills.frameworks || data.skills.databases || data.skills.tools) && (
                                <div className="cv-prev-section">
                                    <h2 className="cv-prev-section-title">Technical Skills</h2>
                                    <div className="cv-prev-skills">
                                        {data.skills.languages && (
                                            <p><strong>Languages:</strong> {data.skills.languages}</p>
                                        )}
                                        {data.skills.frameworks && (
                                            <p><strong>Frameworks & Libraries:</strong> {data.skills.frameworks}</p>
                                        )}
                                        {data.skills.databases && (
                                            <p><strong>Databases:</strong> {data.skills.databases}</p>
                                        )}
                                        {data.skills.tools && (
                                            <p><strong>Developer Tools:</strong> {data.skills.tools}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Experience */}
                            {data.experience.some((e) => e.title || e.company) && (
                                <div className="cv-prev-section">
                                    <h2 className="cv-prev-section-title">Experience</h2>
                                    {data.experience.filter((e) => e.title || e.company).map((exp, idx) => (
                                        <div key={idx} className="cv-prev-exp-item">
                                            <div className="cv-prev-row">
                                                <strong>{exp.title}</strong>
                                                <span className="cv-prev-date">
                                                    {exp.startDate}{exp.endDate ? ` – ${exp.endDate}` : ''}
                                                    {exp.duration ? ` (${exp.duration})` : ''}
                                                </span>
                                            </div>
                                            <div className="cv-prev-row">
                                                <em>{exp.company}</em>
                                                {exp.location && <em className="cv-prev-date">{exp.location}</em>}
                                            </div>
                                            <ul className="cv-prev-bullets">
                                                {exp.bullets.filter((b) => b).map((b, bIdx) => (
                                                    <li key={bIdx}>{b}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Projects */}
                            {data.projects.some((p) => p.name) && (
                                <div className="cv-prev-section">
                                    <h2 className="cv-prev-section-title">Projects</h2>
                                    {data.projects.filter((p) => p.name).map((proj, idx) => (
                                        <div key={idx} className="cv-prev-proj-item">
                                            <div className="cv-prev-row">
                                                <span>
                                                    <strong>{proj.name}</strong>
                                                    {proj.techStack && (
                                                        <span className="cv-prev-tech"> | <em>{proj.techStack}</em></span>
                                                    )}
                                                </span>
                                                <span className="cv-prev-date">
                                                    {proj.startDate}{proj.endDate ? ` – ${proj.endDate}` : ''}
                                                </span>
                                            </div>
                                            <ul className="cv-prev-bullets">
                                                {proj.description && (
                                                    <li><strong>Description:</strong> {proj.description}</li>
                                                )}
                                                {proj.contribution && (
                                                    <li><strong>Contribution:</strong> {proj.contribution}</li>
                                                )}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Certifications */}
                            {data.certifications.some((c) => c.text) && (
                                <div className="cv-prev-section">
                                    <h2 className="cv-prev-section-title">Certifications & Accomplishments</h2>
                                    <ul className="cv-prev-bullets">
                                        {data.certifications.filter((c) => c.text).map((c, idx) => (
                                            <li key={idx}>{c.text}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default CVGeneratorPage;
