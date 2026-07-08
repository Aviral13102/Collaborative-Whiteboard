import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBoards, createBoard, getBoard, deleteBoard } from '../utils/api';

const styles = {
  page: {
    minHeight: '100vh',
    background: '#060b18',
    position: 'relative',
  },
  meshBg: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    background: `
      radial-gradient(ellipse 60% 40% at 10% 0%, rgba(99, 102, 241, 0.06), transparent),
      radial-gradient(ellipse 50% 30% at 90% 10%, rgba(34, 211, 238, 0.04), transparent)
    `,
    pointerEvents: 'none',
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    padding: '16px 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(6, 11, 24, 0.8)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  },
  brand: {
    fontSize: '22px',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #22d3ee 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '-0.01em',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  greeting: {
    fontSize: '14px',
    color: '#94a3b8',
  },
  greetingName: {
    color: '#f1f5f9',
    fontWeight: 500,
  },
  main: {
    position: 'relative',
    zIndex: 1,
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 32px',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#f1f5f9',
    letterSpacing: '-0.01em',
  },
  createBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    boxShadow: '0 2px 10px rgba(99, 102, 241, 0.15)',
  },
  joinSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  joinInput: {
    padding: '10px 16px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '10px',
    color: '#f1f5f9',
    fontSize: '13px',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    width: '260px',
    transition: 'all 0.2s ease',
  },
  joinBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 18px',
    background: 'rgba(34, 211, 238, 0.08)',
    border: '1px solid rgba(34, 211, 238, 0.2)',
    borderRadius: '10px',
    color: '#22d3ee',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  },
  joinError: {
    fontSize: '12px',
    color: '#f87171',
    marginTop: '4px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  card: {
    background: 'rgba(13, 19, 38, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '16px',
    padding: '24px',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: '17px',
    fontWeight: 600,
    color: '#f1f5f9',
    marginBottom: '8px',
  },
  cardDate: {
    fontSize: '13px',
    color: '#475569',
    marginBottom: '20px',
  },
  cardActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  openBtn: {
    flex: 1,
    padding: '10px',
    background: 'rgba(99, 102, 241, 0.1)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: '10px',
    color: '#818cf8',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'center',
  },
  copyBtn: {
    width: '38px',
    height: '38px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '10px',
    color: '#94a3b8',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  },
  deleteBtn: {
    width: '38px',
    height: '38px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(239, 68, 68, 0.04)',
    border: '1px solid rgba(239, 68, 68, 0.1)',
    borderRadius: '10px',
    color: '#ef4444',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 24px',
    animation: 'fadeIn 0.5s ease-out',
  },
  emptyIcon: {
    width: '80px',
    height: '80px',
    margin: '0 auto 24px',
    borderRadius: '20px',
    background: 'rgba(99, 102, 241, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#f1f5f9',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#475569',
    maxWidth: '340px',
    margin: '0 auto 24px',
    lineHeight: '1.6',
  },
  modal: {
    position: 'fixed',
    inset: 0,
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  modalOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
  },
  modalCard: {
    position: 'relative',
    width: '100%',
    maxWidth: '420px',
    padding: '32px',
    background: '#0d1326',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '20px',
    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5)',
    animation: 'scaleIn 0.25s ease-out',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#f1f5f9',
    marginBottom: '20px',
  },
  toast: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 300,
    padding: '12px 20px',
    background: '#0d1326',
    border: '1px solid rgba(52, 211, 153, 0.2)',
    borderLeft: '3px solid #34d399',
    borderRadius: '10px',
    color: '#34d399',
    fontSize: '13px',
    fontWeight: 500,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    animation: 'slideDown 0.3s ease-out',
  },
};

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CanvasIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18" />
    <path d="M9 21V9" />
  </svg>
);

export default function Home() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [boardTitle, setBoardTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState('');
  const [user, setUser] = useState(null);
  const [joinLink, setJoinLink] = useState('');
  const [joinError, setJoinError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // board to confirm delete
  const [deleting, setDeleting] = useState(false);

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const u = JSON.parse(localStorage.getItem('user'));
      setUser(u);
    } catch {
      setUser(null);
    }
  }, [navigate]);

  // Fetch boards
  const fetchBoards = useCallback(async () => {
    try {
      const res = await getBoards();
      setBoards(res.data.boards || res.data || []);
    } catch (err) {
      console.error('Failed to fetch boards:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!boardTitle.trim()) return;
    setCreating(true);
    try {
      const res = await createBoard({ title: boardTitle.trim() });
      const board = res.data.board || res.data;
      setBoards((prev) => [board, ...prev]);
      setShowCreate(false);
      setBoardTitle('');
      navigate(`/board/${board.roomId}`);
    } catch (err) {
      console.error('Failed to create board:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const copyShareLink = (roomId) => {
    const link = `${window.location.origin}/board/${roomId}`;
    navigator.clipboard.writeText(link).then(() => {
      setToast('Link copied!');
      setTimeout(() => setToast(''), 2000);
    });
  };

  // Extract roomId from a pasted URL or raw roomId string
  const parseRoomId = (input) => {
    const trimmed = input.trim();
    if (!trimmed) return null;
    // Try to extract from URL: .../board/ROOMID or .../board/ROOMID?...
    const match = trimmed.match(/\/board\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    // Otherwise treat the entire input as a roomId (alphanumeric + dash/underscore)
    if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) return trimmed;
    return null;
  };

  const handleJoinBoard = async () => {
    setJoinError('');
    const id = parseRoomId(joinLink);
    if (!id) {
      setJoinError('Please enter a valid board link or room ID.');
      return;
    }
    try {
      await getBoard(id);
      navigate(`/board/${id}`);
    } catch {
      setJoinError('Board not found. Check the link and try again.');
    }
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const handleDeleteBoard = async (board) => {
    setDeleting(true);
    try {
      await deleteBoard(board.roomId);
      setBoards((prev) => prev.filter((b) => b.roomId !== board.roomId));
      setDeleteConfirm(null);
      setToast('Board deleted');
      setTimeout(() => setToast(''), 2000);
    } catch (err) {
      console.error('Failed to delete board:', err);
      setToast('Failed to delete board');
      setTimeout(() => setToast(''), 2000);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.meshBg} />

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.brand}>Whiteboard</div>
        <div style={styles.headerRight}>
          {user && (
            <span style={styles.greeting}>
              Hello, <span style={styles.greetingName}>{user.username || user.email}</span>
            </span>
          )}
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Main */}
      <main style={styles.main}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <h1 style={styles.title}>Your Boards</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Join Board */}
            <div>
              <div style={styles.joinSection}>
                <input
                  type="text"
                  style={styles.joinInput}
                  placeholder="Paste board link or room ID..."
                  value={joinLink}
                  onChange={(e) => { setJoinLink(e.target.value); setJoinError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleJoinBoard(); }}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(34, 211, 238, 0.3)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'; }}
                />
                <button
                  style={styles.joinBtn}
                  onClick={handleJoinBoard}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(34, 211, 238, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(34, 211, 238, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.2)';
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  Join
                </button>
              </div>
              {joinError && <div style={styles.joinError}>{joinError}</div>}
            </div>

            {/* Create Board */}
            <button
              style={styles.createBtn}
              onClick={() => setShowCreate(true)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(99, 102, 241, 0.35)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(99, 102, 241, 0.15)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <PlusIcon />
              New Board
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div className="spinner" style={{ margin: '0 auto 16px', width: '32px', height: '32px' }} />
            <p style={{ color: '#475569', fontSize: '14px' }}>Loading boards...</p>
          </div>
        ) : boards.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <CanvasIcon />
            </div>
            <div style={styles.emptyTitle}>No boards yet</div>
            <p style={styles.emptyText}>
              Create your first whiteboard and start collaborating with your team in real-time.
            </p>
            <button
              style={styles.createBtn}
              onClick={() => setShowCreate(true)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(99, 102, 241, 0.35)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(99, 102, 241, 0.15)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <PlusIcon />
              Create First Board
            </button>
          </div>
        ) : (
          <div style={styles.grid}>
            {boards.map((board, i) => (
              <div
                key={board.roomId || board._id || i}
                style={{
                  ...styles.card,
                  animation: `slideUp 0.4s ease-out ${i * 0.08}s both`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={styles.cardTitle}>{board.title || 'Untitled Board'}</div>
                <div style={styles.cardDate}>
                  {board.createdAt ? `Created ${formatDate(board.createdAt)}` : 'Recently created'}
                </div>
                <div style={styles.cardActions}>
                  <button
                    style={styles.openBtn}
                    onClick={() => navigate(`/board/${board.roomId}`)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)';
                    }}
                  >
                    Open Board
                  </button>
                  <button
                    style={styles.copyBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      copyShareLink(board.roomId);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                    }}
                    title="Copy share link"
                  >
                    <CopyIcon />
                  </button>
                  <button
                    style={styles.deleteBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(board);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                      e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.04)';
                      e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.1)';
                    }}
                    title="Delete board"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Board Modal */}
      {showCreate && (
        <div style={styles.modal}>
          <div style={styles.modalOverlay} onClick={() => setShowCreate(false)} />
          <div style={styles.modalCard}>
            <div style={styles.modalTitle}>Create New Board</div>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '20px' }}>
                <label className="input-label">Board Title</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., Sprint Planning, Design Review"
                  value={boardTitle}
                  onChange={(e) => setBoardTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating || !boardTitle.trim()}
                  style={{ opacity: creating || !boardTitle.trim() ? 0.6 : 1 }}
                >
                  {creating && <span className="spinner spinner-sm" />}
                  {creating ? 'Creating...' : 'Create Board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={styles.modal}>
          <div style={styles.modalOverlay} onClick={() => setDeleteConfirm(null)} />
          <div style={styles.modalCard}>
            <div style={styles.modalTitle}>Delete Board</div>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', marginBottom: '8px' }}>
              Are you sure you want to delete <strong style={{ color: '#f1f5f9' }}>{deleteConfirm.title || 'Untitled Board'}</strong>?
            </p>
            <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '20px' }}>
              This will permanently remove the board and all its content (drawings, sticky notes, chat messages). This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                disabled={deleting}
                onClick={() => handleDeleteBoard(deleteConfirm)}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '10px',
                  color: '#ef4444',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                {deleting ? 'Deleting...' : 'Delete Board'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
}
