/**
 * Study Buddy Page
 * AI-powered PDF Q&A — upload lecture notes and ask questions
 * Uses Gemini API via backend for document-grounded answers
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { studyBuddyAPI } from '../services/api';

// Suggested starter questions
const SUGGESTED_QUESTIONS = [
    { icon: '📋', text: 'Summarize this document' },
    { icon: '🔑', text: 'List the key concepts' },
    { icon: '❓', text: 'What are the main topics covered?' },
    { icon: '📝', text: 'Create study notes from this' },
    { icon: '🧠', text: 'Generate practice questions' },
    { icon: '🔗', text: 'Explain the relationships between concepts' },
];

// Simple markdown-ish formatter for AI responses
function formatAIResponse(text) {
    if (!text) return '';
    // Split by lines
    const lines = text.split('\n');
    let html = '';
    let inList = false;
    let inOrderedList = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Bold: **text**
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Italic: *text*
        line = line.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
        // Inline code: `text`
        line = line.replace(/`(.*?)`/g, '<code>$1</code>');

        // Headers
        if (line.startsWith('### ')) {
            if (inList) { html += '</ul>'; inList = false; }
            if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
            html += `<h4 class="sb-resp-h3">${line.slice(4)}</h4>`;
            continue;
        }
        if (line.startsWith('## ')) {
            if (inList) { html += '</ul>'; inList = false; }
            if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
            html += `<h3 class="sb-resp-h2">${line.slice(3)}</h3>`;
            continue;
        }
        if (line.startsWith('# ')) {
            if (inList) { html += '</ul>'; inList = false; }
            if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
            html += `<h2 class="sb-resp-h1">${line.slice(2)}</h2>`;
            continue;
        }

        // Unordered list items
        if (/^[\-\*•]\s/.test(line)) {
            if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
            if (!inList) { html += '<ul class="sb-resp-list">'; inList = true; }
            html += `<li>${line.replace(/^[\-\*•]\s/, '')}</li>`;
            continue;
        }

        // Ordered list items
        if (/^\d+[\.\)]\s/.test(line)) {
            if (inList) { html += '</ul>'; inList = false; }
            if (!inOrderedList) { html += '<ol class="sb-resp-list sb-resp-ol">'; inOrderedList = true; }
            html += `<li>${line.replace(/^\d+[\.\)]\s/, '')}</li>`;
            continue;
        }

        // Close lists if needed
        if (inList) { html += '</ul>'; inList = false; }
        if (inOrderedList) { html += '</ol>'; inOrderedList = false; }

        // Empty line = paragraph break
        if (line.trim() === '') {
            html += '<div class="sb-resp-spacer"></div>';
            continue;
        }

        // Normal paragraph
        html += `<p class="sb-resp-p">${line}</p>`;
    }

    if (inList) html += '</ul>';
    if (inOrderedList) html += '</ol>';

    return html;
}


function StudyBuddyPage() {
    const [pdfFile, setPdfFile] = useState(null);
    const [pdfName, setPdfName] = useState('');
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [error, setError] = useState('');

    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading]);

    // Handle file selection
    const handleFileSelect = useCallback((file) => {
        setError('');
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setError('Please upload a PDF file only.');
            return;
        }

        if (file.size > 20 * 1024 * 1024) {
            setError('File size must be under 20MB.');
            return;
        }

        setPdfFile(file);
        setPdfName(file.name);
        setMessages([]);
        // Focus the input after upload
        setTimeout(() => inputRef.current?.focus(), 300);
    }, []);

    // Drag-and-drop handlers
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    }, [handleFileSelect]);

    // File input change
    const handleFileInputChange = (e) => {
        const file = e.target.files[0];
        handleFileSelect(file);
    };

    // Remove uploaded PDF
    const handleRemovePdf = () => {
        setPdfFile(null);
        setPdfName('');
        setMessages([]);
        setError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Send message to AI
    const handleSendMessage = async (question) => {
        if (!question?.trim() || !pdfFile || isLoading) return;

        const userMessage = { role: 'user', text: question.trim() };
        setMessages((prev) => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);
        setError('');

        try {
            // Build form data
            const formData = new FormData();
            formData.append('pdf', pdfFile);
            formData.append('question', question.trim());

            // Include conversation history (user & AI turns, without the current question)
            const history = messages.map((m) => ({
                role: m.role,
                text: m.text,
            }));
            formData.append('history', JSON.stringify(history));

            const response = await studyBuddyAPI.chat(formData);

            const aiMessage = {
                role: 'assistant',
                text: response.data.answer,
            };
            setMessages((prev) => [...prev, aiMessage]);
        } catch (err) {
            const errorMessage = {
                role: 'error',
                text: err.message || 'Failed to get a response. Please try again.',
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    // Handle form submit
    const handleSubmit = (e) => {
        e.preventDefault();
        handleSendMessage(inputText);
    };

    // Handle suggested question click
    const handleSuggestionClick = (text) => {
        handleSendMessage(text);
    };

    // Format file size
    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <main className="main-content">
            <div className="sb-page">
                {/* Page Header */}
                <div className="sb-header">
                    <div className="sb-header-text">
                        <h1 className="sb-title">
                            <span className="sb-title-icon">🤖</span>
                            AI Study Buddy
                        </h1>
                        <p className="sb-subtitle">
                            Upload your lecture notes or textbook chapter, then ask questions — the AI answers from your document only.
                        </p>
                    </div>
                </div>

                <div className="sb-container">
                    {/* Left: Upload + Info Panel */}
                    <aside className="sb-sidebar">
                        {/* Upload Zone */}
                        <div
                            className={`sb-upload-zone ${isDragOver ? 'drag-over' : ''} ${pdfFile ? 'has-file' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => !pdfFile && fileInputRef.current?.click()}
                            id="sb-upload-zone"
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="application/pdf"
                                onChange={handleFileInputChange}
                                className="sb-file-input"
                                id="sb-file-input"
                            />

                            {!pdfFile ? (
                                <div className="sb-upload-content">
                                    <div className="sb-upload-icon-wrapper">
                                        <svg className="sb-upload-icon" viewBox="0 0 64 64" fill="none">
                                            <rect x="12" y="4" width="40" height="52" rx="4" stroke="currentColor" strokeWidth="2.5" fill="none" />
                                            <path d="M20 20h24M20 28h24M20 36h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            <circle cx="48" cy="48" r="14" fill="var(--primary)" stroke="white" strokeWidth="3" />
                                            <path d="M48 42v12M42 48h12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                    <h3 className="sb-upload-title">Upload your PDF</h3>
                                    <p className="sb-upload-text">
                                        Drag & drop your lecture notes, textbook chapter, or study material here
                                    </p>
                                    <p className="sb-upload-hint">or click to browse • PDF up to 20MB</p>
                                </div>
                            ) : (
                                <div className="sb-file-info">
                                    <div className="sb-file-icon">
                                        <svg viewBox="0 0 40 48" fill="none">
                                            <path d="M4 4C4 1.79 5.79 0 8 0H26L36 10V44C36 46.21 34.21 48 32 48H8C5.79 48 4 46.21 4 44V4Z" fill="var(--primary)" opacity="0.1" />
                                            <path d="M4 4C4 1.79 5.79 0 8 0H26L36 10V44C36 46.21 34.21 48 32 48H8C5.79 48 4 46.21 4 44V4Z" stroke="var(--primary)" strokeWidth="2" fill="none" />
                                            <path d="M26 0V8C26 9.1 26.9 10 28 10H36" stroke="var(--primary)" strokeWidth="2" fill="none" />
                                            <text x="20" y="32" textAnchor="middle" fill="var(--primary)" fontSize="10" fontWeight="700">PDF</text>
                                        </svg>
                                    </div>
                                    <div className="sb-file-details">
                                        <span className="sb-file-name" title={pdfName}>{pdfName}</span>
                                        <span className="sb-file-size">{formatSize(pdfFile.size)}</span>
                                    </div>
                                    <button
                                        className="sb-remove-file"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemovePdf();
                                        }}
                                        title="Remove file"
                                        id="sb-remove-file"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="sb-error" id="sb-error">
                                <span className="sb-error-icon">⚠️</span>
                                {error}
                            </div>
                        )}

                        {/* How it works */}
                        <div className="sb-info-card">
                            <h4 className="sb-info-title">💡 How it works</h4>
                            <div className="sb-info-steps">
                                <div className="sb-step">
                                    <div className="sb-step-num">1</div>
                                    <div className="sb-step-text">Upload a PDF document (lecture notes, textbook, etc.)</div>
                                </div>
                                <div className="sb-step">
                                    <div className="sb-step-num">2</div>
                                    <div className="sb-step-text">Ask any question about the document content</div>
                                </div>
                                <div className="sb-step">
                                    <div className="sb-step-num">3</div>
                                    <div className="sb-step-text">AI reads the PDF and answers based <strong>only</strong> on your document</div>
                                </div>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="sb-info-card">
                            <h4 className="sb-info-title">🚀 What you can do</h4>
                            <ul className="sb-feature-list">
                                <li>Ask questions about specific topics</li>
                                <li>Get summaries of chapters</li>
                                <li>Generate practice questions</li>
                                <li>Explain difficult concepts</li>
                                <li>Create study notes</li>
                                <li>Compare topics from the document</li>
                            </ul>
                        </div>
                    </aside>

                    {/* Right: Chat Area */}
                    <section className="sb-chat-area" id="sb-chat-area">
                        {/* Chat Messages */}
                        <div className="sb-messages" id="sb-messages">
                            {messages.length === 0 && pdfFile && (
                                <div className="sb-welcome">
                                    <div className="sb-welcome-icon">🎓</div>
                                    <h3 className="sb-welcome-title">Ready to study!</h3>
                                    <p className="sb-welcome-text">
                                        Your document <strong>"{pdfName}"</strong> is loaded. Ask me anything about it, or try one of the suggestions below.
                                    </p>
                                    <div className="sb-suggestions">
                                        {SUGGESTED_QUESTIONS.map((q, idx) => (
                                            <button
                                                key={idx}
                                                className="sb-suggestion-chip"
                                                onClick={() => handleSuggestionClick(q.text)}
                                                id={`sb-suggestion-${idx}`}
                                            >
                                                <span className="sb-chip-icon">{q.icon}</span>
                                                {q.text}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.length === 0 && !pdfFile && (
                                <div className="sb-welcome">
                                    <div className="sb-welcome-icon">📄</div>
                                    <h3 className="sb-welcome-title">Upload a PDF to get started</h3>
                                    <p className="sb-welcome-text">
                                        Upload your lecture notes, textbook chapter, or any study material using the panel on the left. Then start asking questions!
                                    </p>
                                </div>
                            )}

                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`sb-message ${msg.role === 'user' ? 'sb-msg-user' : msg.role === 'error' ? 'sb-msg-error' : 'sb-msg-ai'}`}
                                    id={`sb-message-${idx}`}
                                >
                                    {msg.role !== 'user' && (
                                        <div className="sb-msg-avatar">
                                            {msg.role === 'error' ? '⚠️' : '🤖'}
                                        </div>
                                    )}
                                    <div className="sb-msg-bubble">
                                        {msg.role === 'user' ? (
                                            <p className="sb-msg-text">{msg.text}</p>
                                        ) : msg.role === 'error' ? (
                                            <p className="sb-msg-text sb-error-text">{msg.text}</p>
                                        ) : (
                                            <div
                                                className="sb-msg-text sb-ai-formatted"
                                                dangerouslySetInnerHTML={{ __html: formatAIResponse(msg.text) }}
                                            />
                                        )}
                                    </div>
                                    {msg.role === 'user' && (
                                        <div className="sb-msg-avatar sb-user-avatar">
                                            👤
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Loading indicator */}
                            {isLoading && (
                                <div className="sb-message sb-msg-ai">
                                    <div className="sb-msg-avatar">🤖</div>
                                    <div className="sb-msg-bubble sb-loading-bubble">
                                        <div className="sb-typing-indicator">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                        <span className="sb-typing-text">Analyzing your document...</span>
                                    </div>
                                </div>
                            )}

                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Area */}
                        <form className="sb-input-bar" onSubmit={handleSubmit} id="sb-input-form">
                            <div className="sb-input-wrapper">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="sb-text-input"
                                    placeholder={pdfFile ? 'Ask a question about your document...' : 'Upload a PDF first to start chatting...'}
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    disabled={!pdfFile || isLoading}
                                    id="sb-text-input"
                                />
                                <button
                                    type="submit"
                                    className="sb-send-btn"
                                    disabled={!pdfFile || !inputText.trim() || isLoading}
                                    id="sb-send-btn"
                                    title="Send message"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13" />
                                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                    </svg>
                                </button>
                            </div>
                            <p className="sb-input-hint">
                                AI answers are based only on your uploaded document. Powered by Google Gemini.
                            </p>
                        </form>
                    </section>
                </div>
            </div>
        </main>
    );
}

export default StudyBuddyPage;
