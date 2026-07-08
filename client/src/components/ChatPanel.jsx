import { useState, useEffect, useRef } from 'react';

/**
 * ChatPanel — Real-time chat sidebar scoped to the board room
 *
 * Features:
 *   - Loads last 50 messages on mount
 *   - Real-time message reception via Socket.io
 *   - Auto-scroll to bottom on new messages
 *   - Glassmorphism dark theme matching the app
 */

const styles = {
  panel: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: '340px',
    background: 'rgba(6, 11, 24, 0.92)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderLeft: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 150,
    animation: 'slideLeft 0.25s ease-out',
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  title: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  closeBtn: {
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    border: 'none',
    background: 'rgba(255,255,255,0.04)',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.15s ease',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  msgBubble: {
    padding: '8px 12px',
    borderRadius: '10px',
    maxWidth: '85%',
    wordBreak: 'break-word',
  },
  msgMine: {
    background: 'rgba(99, 102, 241, 0.2)',
    alignSelf: 'flex-end',
    borderBottomRightRadius: '4px',
  },
  msgOther: {
    background: 'rgba(255,255,255,0.06)',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: '4px',
  },
  msgAuthor: {
    fontSize: '11px',
    fontWeight: 600,
    marginBottom: '2px',
    color: '#818cf8',
  },
  msgText: {
    fontSize: '13px',
    color: '#e2e8f0',
    lineHeight: '1.4',
  },
  msgTime: {
    fontSize: '10px',
    color: '#475569',
    marginTop: '3px',
    textAlign: 'right',
  },
  inputBar: {
    padding: '12px 16px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    gap: '8px',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    color: '#f1f5f9',
    fontSize: '13px',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },
  sendBtn: {
    padding: '10px 16px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  },
  empty: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#475569',
    fontSize: '13px',
  },
};

function formatTime(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function ChatPanel({ socket, roomId, userId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // Load history on mount
  useEffect(() => {
    if (!socket || !roomId) return;
    socket.emit('chat:history', { roomId });
  }, [socket, roomId]);

  // Listen for messages
  useEffect(() => {
    if (!socket) return;

    const handleHistory = (msgs) => {
      setMessages(msgs);
    };

    const handleMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('chat:history', handleHistory);
    socket.on('chat:message', handleMessage);

    return () => {
      socket.off('chat:history', handleHistory);
      socket.off('chat:message', handleMessage);
    };
  }, [socket]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    socket.emit('chat:send', { roomId, message: input.trim() });
    setInput('');
  };

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <div style={styles.title}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Chat
        </div>
        <button
          style={styles.closeBtn}
          onClick={onClose}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
        >
          ✕
        </button>
      </div>

      <div style={styles.messages}>
        {messages.length === 0 ? (
          <div style={styles.empty}>No messages yet. Say hello! 👋</div>
        ) : (
          messages.map((msg, i) => {
            const isMine = msg.userId === userId;
            return (
              <div
                key={msg._id || i}
                style={{
                  ...styles.msgBubble,
                  ...(isMine ? styles.msgMine : styles.msgOther),
                }}
              >
                {!isMine && <div style={styles.msgAuthor}>{msg.username}</div>}
                <div style={styles.msgText}>{msg.message}</div>
                <div style={styles.msgTime}>{formatTime(msg.createdAt)}</div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} style={styles.inputBar}>
        <input
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          maxLength={1000}
          onFocus={(e) => { e.target.style.borderColor = 'rgba(99,102,241,0.4)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
        />
        <button
          type="submit"
          style={{ ...styles.sendBtn, opacity: input.trim() ? 1 : 0.5 }}
          disabled={!input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}
