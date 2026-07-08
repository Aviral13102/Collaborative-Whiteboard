import { useState } from 'react';
import { updateRole, removeCollaborator } from '../utils/api';

/**
 * RoleManager — Modal for inviting users and managing roles
 *
 * Features:
 *   - Invite by email with role selection
 *   - View current collaborators with their roles
 *   - Change roles (owner only)
 *   - Remove collaborators (owner only)
 */

const ROLES = [
  { id: 'editor', label: 'Editor', desc: 'Can draw and edit' },
  { id: 'viewer', label: 'Viewer', desc: 'View only' },
];

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 300,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  backdrop: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
  },
  modal: {
    position: 'relative',
    width: '100%',
    maxWidth: '460px',
    padding: '28px',
    background: '#0d1326',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '20px',
    boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
    animation: 'scaleIn 0.25s ease-out',
  },
  title: {
    fontSize: '17px',
    fontWeight: 600,
    color: '#f1f5f9',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  inviteRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
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
  },
  roleSelect: {
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    color: '#f1f5f9',
    fontSize: '13px',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    cursor: 'pointer',
  },
  inviteBtn: {
    padding: '10px 18px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0,
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '10px',
  },
  collabList: {
    maxHeight: '240px',
    overflowY: 'auto',
  },
  collabItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '10px',
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
  },
  collabInfo: {
    flex: 1,
  },
  collabName: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#e2e8f0',
  },
  collabRole: {
    fontSize: '11px',
    color: '#64748b',
  },
  roleBadge: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: '6px',
    textTransform: 'capitalize',
  },
  removeBtn: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    border: 'none',
    background: 'transparent',
    color: '#64748b',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.15s ease',
  },
  closeBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
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
  },
  error: {
    fontSize: '12px',
    color: '#ef4444',
    marginTop: '6px',
  },
  success: {
    fontSize: '12px',
    color: '#34d399',
    marginTop: '6px',
  },
};

function nameToColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 65%, 55%)`;
}

function roleBadgeStyle(role) {
  if (role === 'owner') return { background: 'rgba(250, 204, 21, 0.15)', color: '#facc15' };
  if (role === 'editor') return { background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' };
  return { background: 'rgba(100,116,139,0.15)', color: '#94a3b8' };
}

export default function RoleManager({ roomId, isOwner, collaborators, ownerName, onClose, onUpdate }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await updateRole(roomId, { email: email.trim(), role });
      setSuccess(`Invited ${email} as ${role}`);
      setEmail('');
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to invite user');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId) => {
    try {
      await removeCollaborator(roomId, userId);
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove user');
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.backdrop} onClick={onClose} />
      <div style={styles.modal}>
        <button style={styles.closeBtn} onClick={onClose}>✕</button>

        <div style={styles.title}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
          Manage Access
        </div>

        {/* Invite form */}
        {isOwner && (
          <form onSubmit={handleInvite} style={styles.inviteRow}>
            <input
              style={styles.input}
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <select style={styles.roleSelect} value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
            <button
              type="submit"
              style={{ ...styles.inviteBtn, opacity: loading ? 0.6 : 1 }}
              disabled={loading}
            >
              {loading ? '...' : 'Invite'}
            </button>
          </form>
        )}

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        {/* Collaborators list */}
        <div style={styles.label}>Team Members</div>
        <div style={styles.collabList}>
          {/* Owner */}
          <div style={styles.collabItem}>
            <div style={{ ...styles.avatar, background: nameToColor(ownerName || 'Owner') }}>
              {(ownerName || 'O')[0].toUpperCase()}
            </div>
            <div style={styles.collabInfo}>
              <div style={styles.collabName}>{ownerName || 'Owner'}</div>
            </div>
            <span style={{ ...styles.roleBadge, ...roleBadgeStyle('owner') }}>Owner</span>
          </div>

          {/* Collaborators */}
          {collaborators.map((c) => (
            <div key={c.user?._id || c.user} style={styles.collabItem}>
              <div style={{ ...styles.avatar, background: nameToColor(c.user?.username || '?') }}>
                {(c.user?.username || '?')[0].toUpperCase()}
              </div>
              <div style={styles.collabInfo}>
                <div style={styles.collabName}>{c.user?.username || 'User'}</div>
                <div style={styles.collabRole}>{c.user?.email || ''}</div>
              </div>
              <span style={{ ...styles.roleBadge, ...roleBadgeStyle(c.role) }}>{c.role}</span>
              {isOwner && (
                <button
                  style={styles.removeBtn}
                  onClick={() => handleRemove(c.user?._id || c.user)}
                  title="Remove"
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'transparent'; }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
