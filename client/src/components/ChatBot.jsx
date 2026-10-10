import { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';
import { useAppContext } from '../context/UseAppContext';
import { safeHtml } from '../utils/html';

// Gemini answers often use Markdown (bold, lists); render it safely.
const renderMarkdown = (text) => safeHtml(marked.parse(text, { breaks: true }));

const ChatBot = ({ blogId, blogTitle }) => {
    const { axios } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'bot',
            content: `Hi! 👋 I've read this blog. Ask me anything about "${blogTitle}"!`
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');

        const updatedMessages = [...messages, { role: 'user', content: userMessage }];
        setMessages(updatedMessages);
        setLoading(true);

        try {
            // Last 10 messages only (the server caps it too), without the
            // greeting and without the question we're sending now.
            const history = updatedMessages.slice(1, -1).slice(-10).map(msg => ({
                role: msg.role === 'bot' ? 'assistant' : 'user',
                content: msg.content
            }));

            const { data } = await axios.post('/api/chat', {
                blogId,
                question: userMessage,
                history,
            }, {
                timeout: 60000  // 60 seconds: the first question on a sleeping server is slow
            });

            if (data.success) {
                setMessages(prev => [...prev, { role: 'bot', content: data.answer, sources: data.sources || [] }]);
            } else {
                setMessages(prev => [...prev, { role: 'bot', content: "Sorry, something went wrong. Try again!" }]);
            }
        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                setMessages(prev => [...prev, { role: 'bot', content: "⏳ Request timed out. The server is taking too long. Please try again!" }]);
            } else {
                // e.g. rate limit or validation messages from the server
                setMessages(prev => [...prev, { role: 'bot', content: error.response?.data?.message || "Sorry, I couldn't connect. Try again!" }]);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = () => {
        setMessages([{
            role: 'bot',
            content: `Hi! 👋 I've read this blog. Ask me anything about "${blogTitle}"!`
        }]);
    };

    return (
        <>
            {isOpen && (
                <div
                    className="fixed bottom-24 right-6 z-50 flex flex-col"
                    style={{
                        width: 'min(360px, calc(100vw - 32px))',
                        height: 'min(500px, calc(100vh - 140px))',
                        background: '#ffffff',
                        borderRadius: '20px',
                        boxShadow: '0 20px 60px rgba(13,148,136,0.2)',
                        border: '1.5px solid rgba(13,148,136,0.2)',
                        overflow: 'hidden',
                    }}
                >
                    {/* Header */}
                    <div style={{
                        background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                        padding: '16px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}>
                        <div className="flex items-center gap-3">
                            <div style={{
                                width: '36px', height: '36px',
                                background: 'rgba(255,255,255,0.2)',
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '18px'
                            }}>
                                🤖
                            </div>
                            <div>
                                <p style={{ color: '#fff', fontWeight: '700', fontSize: '14px', margin: 0 }}>
                                    Blog Assistant
                                </p>
                                <div className="flex items-center gap-1">
                                    <div style={{
                                        width: '7px', height: '7px',
                                        borderRadius: '50%',
                                        background: '#86efac',
                                    }} />
                                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', margin: 0 }}>
                                        Online
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={clearChat}
                                style={{
                                    background: 'rgba(255,255,255,0.15)',
                                    border: 'none', borderRadius: '8px',
                                    color: '#fff', fontSize: '11px',
                                    padding: '4px 10px', cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                Clear
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{
                                    background: 'rgba(255,255,255,0.15)',
                                    border: 'none', borderRadius: '8px',
                                    color: '#fff', fontSize: '16px',
                                    width: '28px', height: '28px',
                                    cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                ×
                            </button>
                        </div>
                    </div>

                    {/* Blog title pill */}
                    <div style={{
                        background: '#f0fafa',
                        padding: '8px 16px',
                        borderBottom: '1px solid rgba(13,148,136,0.1)',
                    }}>
                        <p style={{
                            fontSize: '11px', color: '#0d9488',
                            fontWeight: '600', margin: 0,
                            whiteSpace: 'nowrap', overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            📄 {blogTitle}
                        </p>
                    </div>

                    {/* Messages */}
                    <div style={{
                        flex: 1, overflowY: 'auto',
                        padding: '16px', display: 'flex',
                        flexDirection: 'column', gap: '12px',
                        background: '#f8fffe',
                    }}>
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                style={{
                                    display: 'flex',
                                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    alignItems: 'flex-end',
                                    gap: '8px',
                                }}
                            >
                                {msg.role === 'bot' && (
                                    <div style={{
                                        width: '28px', height: '28px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                                        display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', fontSize: '14px',
                                        flexShrink: 0,
                                    }}>
                                        🤖
                                    </div>
                                )}
                                <div style={{
                                    maxWidth: '75%',
                                    padding: '10px 14px',
                                    borderRadius: msg.role === 'user'
                                        ? '18px 18px 4px 18px'
                                        : '18px 18px 18px 4px',
                                    background: msg.role === 'user'
                                        ? 'linear-gradient(135deg, #0d9488, #0f766e)'
                                        : '#ffffff',
                                    color: msg.role === 'user' ? '#fff' : '#333',
                                    fontSize: '13px',
                                    lineHeight: '1.5',
                                    boxShadow: msg.role === 'user'
                                        ? '0 2px 12px rgba(13,148,136,0.3)'
                                        : '0 2px 8px rgba(0,0,0,0.06)',
                                    border: msg.role === 'bot'
                                        ? '1px solid rgba(13,148,136,0.1)'
                                        : 'none',
                                }}>
                                    {msg.role === 'bot'
                                        ? <div className="chat-md" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                                        : msg.content}
                                    {msg.sources?.length > 0 && (
                                        <details style={{ marginTop: '8px', fontSize: '11px', color: '#0f766e' }}>
                                            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                                                Based on {msg.sources.length} part{msg.sources.length > 1 ? 's' : ''} of this blog
                                            </summary>
                                            {msg.sources.map((src, j) => (
                                                <p key={j} style={{ margin: '6px 0 0', color: '#555', lineHeight: 1.4 }}>
                                                    “{src.snippet}…”
                                                </p>
                                            ))}
                                        </details>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {loading && (
                            <div className="flex items-end gap-2">
                                <div style={{
                                    width: '28px', height: '28px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontSize: '14px',
                                    flexShrink: 0,
                                }}>
                                    🤖
                                </div>
                                <div style={{
                                    background: '#ffffff',
                                    border: '1px solid rgba(13,148,136,0.1)',
                                    borderRadius: '18px 18px 18px 4px',
                                    padding: '12px 16px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                }}>
                                    <div className="flex gap-1 items-center mb-1">
                                        {[0, 1, 2].map(i => (
                                            <div key={i} style={{
                                                width: '7px', height: '7px',
                                                borderRadius: '50%',
                                                background: '#0d9488',
                                                animation: 'bounce 1.2s infinite',
                                                animationDelay: `${i * 0.2}s`
                                            }} />
                                        ))}
                                    </div>
                                    <p style={{
                                        fontSize: '11px',
                                        color: '#0d9488',
                                        margin: 0,
                                        fontWeight: '500'
                                    }}>
                                        ⏳ Analyzing blog content...
                                    </p>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div style={{
                        padding: '12px 16px',
                        background: '#ffffff',
                        borderTop: '1px solid rgba(13,148,136,0.1)',
                        display: 'flex', gap: '8px', alignItems: 'center',
                    }}>
                        <input
                            type="text"
                            placeholder="Ask about this blog..."
                            maxLength={500}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                            style={{
                                flex: 1, border: '1.5px solid rgba(13,148,136,0.25)',
                                borderRadius: '50px', padding: '9px 16px',
                                fontSize: '13px', outline: 'none',
                                background: '#f8fffe', color: '#333',
                            }}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={loading || !input.trim()}
                            style={{
                                width: '38px', height: '38px',
                                borderRadius: '50%',
                                background: input.trim() && !loading
                                    ? 'linear-gradient(135deg, #0d9488, #0f766e)'
                                    : '#e5e7eb',
                                border: 'none',
                                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                                transition: 'all 0.2s',
                                boxShadow: input.trim() && !loading
                                    ? '0 4px 12px rgba(13,148,136,0.3)'
                                    : 'none',
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M22 2L11 13" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Floating Bubble Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed', bottom: '24px', right: '24px',
                    width: '58px', height: '58px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                    border: 'none', cursor: 'pointer', zIndex: 50,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 25px rgba(13,148,136,0.4)',
                    transition: 'all 0.3s',
                }}
            >
                {isOpen ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                )}
            </button>

            <style>{`
                .chat-md p { margin: 0 0 6px; }
                .chat-md p:last-child { margin-bottom: 0; }
                .chat-md ul, .chat-md ol { margin: 4px 0 6px; padding-left: 18px; list-style: revert; }
                @keyframes bounce {
                    0%, 60%, 100% { transform: translateY(0); }
                    30% { transform: translateY(-6px); }
                }
            `}</style>
        </>
    );
};

export default ChatBot;