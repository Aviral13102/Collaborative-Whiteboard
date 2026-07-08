/**
 * PresencePanel — Sidebar showing active users in the current room
 *
 * Displays a list of users currently connected to the board, with
 * colored avatars and role badges. Uses Socket.io presence events.
 */

// Deterministic color from username
function usernameToColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

const styles = {
  panel: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: '260px',
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
  count: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#818cf8',
    background: 'rgba(99,102,241,0.15)',
    padding: '2px 8px',
    borderRadius: '10px',
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
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 16px',
  },
  userItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '10px',
    transition: 'background 0.15s ease',
    marginBottom: '2px',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 700,
    color: '#fff',
    flexShrink: 0,
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: '-1px',
    right: '-1px',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#34d399',
    border: '2px solid #060b18',
  },
  username: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#e2e8f0',
    flex: 1,
  },
  youBadge: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#64748b',
    background: 'rgba(255,255,255,0.06)',
    padding: '2px 6px',
    borderRadius: '4px',
  },
};

export default function PresencePanel({ users, currentUserId, onClose }) {
  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <div style={styles.title}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Users
          <span style={styles.count}>{users.length}</span>
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

      <div style={styles.list}>
        {users.map((u) => {
          const color = usernameToColor(u.username);
          const initial = (u.username || '?')[0].toUpperCase();
          const isYou = u.userId === currentUserId;
          return (
            <div
              key={u.userId}
              style={styles.userItem}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ ...styles.avatar, background: color }}>
                {initial}
                <div style={styles.onlineDot} />
              </div>
              <span style={styles.username}>{u.username}</span>
              {isYou && <span style={styles.youBadge}>You</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
