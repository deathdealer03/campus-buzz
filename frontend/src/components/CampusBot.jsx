import React, { useState, useRef, useEffect } from 'react';
import './CampusBot.css';
import { chatBotAPI } from '../services/api';

const CampusBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hi there! I am CampusBot 🤖. How can I help you with UPES campus life today?' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || isTyping) return;

        const userMsg = inputValue.trim();
        setInputValue('');
        
        const newMessages = [...messages, { role: 'user', content: userMsg }];
        setMessages(newMessages);
        setIsTyping(true);

        try {
            const response = await chatBotAPI.sendMessage({
                message: userMsg,
                history: newMessages.slice(0, -1) // all but the current user message
            });

            if (response.success) {
                setMessages([...newMessages, { role: 'assistant', content: response.reply }]);
            } else {
                setMessages([...newMessages, { role: 'assistant', content: 'Oops! ' + (response.message || 'I encountered an error. Please try again later.') }]);
            }
        } catch (error) {
            setMessages([...newMessages, { role: 'assistant', content: `Oops! Connecting to the server failed. Details: ${error.message}` }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="campusbot-container">
            {/* Chat Bubble Button */}
            {!isOpen && (
                <button className="campusbot-toggle" onClick={toggleChat} aria-label="Open Chat">
                    🤖
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="campusbot-window">
                    <div className="campusbot-header">
                        <h3>CampusBot 🤖</h3>
                        <button className="campusbot-close" onClick={toggleChat} aria-label="Close Chat">×</button>
                    </div>

                    <div className="campusbot-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`campusbot-message ${msg.role}`}>
                                <div className="campusbot-bubble">
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="campusbot-message assistant">
                                <div className="campusbot-bubble typing-indicator">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="campusbot-input-area" onSubmit={handleSendMessage}>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Ask a campus question..."
                            disabled={isTyping}
                        />
                        <button type="submit" disabled={!inputValue.trim() || isTyping} aria-label="Send Message">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default CampusBot;
