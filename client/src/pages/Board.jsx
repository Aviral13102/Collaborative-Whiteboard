import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSocket from '../hooks/useSocket';
import useCanvas from '../hooks/useCanvas';
import useViewport from '../hooks/useViewport';
import useHistory from '../hooks/useHistory';
import Canvas from '../components/Canvas';
import Toolbar from '../components/Toolbar';
import Cursor from '../components/Cursor';
import StickyNote from '../components/StickyNote';
import ChatPanel from '../components/ChatPanel';
import PresencePanel from '../components/PresencePanel';
import ExportButton from '../components/ExportButton';
import RoleManager from '../components/RoleManager';
import { getBoard, getCollaborators } from '../utils/api';

/**
 * Board — Phase 3 Full-featured whiteboard page
 *
 * Orchestrates: canvas rendering, shape tools, undo/redo, pan/zoom,
 * live cursors, sticky notes, chat, presence, export, auto-save, and roles.
 */

// Generate a unique ID
let noteIdCounter = 0;
function generateNoteId() {
  return `note_${Date.now()}_${++noteIdCounter}_${Math.random().toString(36).slice(2, 6)}`;
}

const styles = {
  page: {
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    position: 'relative',
    background: '#1a1a2e',
  },
  canvasWrap: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    inset: 0,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    background: 'rgba(6, 11, 24, 0.7)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    animation: 'slideDown 0.3s ease-out',
  },
  topLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  backBtn: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#94a3b8',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  },
  boardTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#f1f5f9',
    letterSpacing: '-0.01em',
  },
  topRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
    transition: 'background 0.3s ease',
  },
  roomBadge: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#64748b',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
    padding: '4px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    letterSpacing: '0.03em',
  },
  iconBtn: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#94a3b8',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    flexShrink: 0,
    position: 'relative',
  },
  saveBadge: {
    fontSize: '11px',
    fontWeight: 500,
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '0 4px',
  },
  cursorLayer: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 90,
  },
  noteLayer: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 80,
  },
  noteChild: {
    pointerEvents: 'auto',
  },
  unreadDot: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#ef4444',
  },
};

export default function Board() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // Auth check
  const [user, setUser] = useState(null);
  const [boardTitle, setBoardTitle] = useState('');
  const [boardOwnerId, setBoardOwnerId] = useState('');
  const [boardOwnerName, setBoardOwnerName] = useState('');
  const [copied, setCopied] = useState(false);
  const [bgColor, setBgColor] = useState('#1a1a2e');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    try {
      const u = JSON.parse(localStorage.getItem('user'));
      setUser(u);
    } catch { setUser(null); }
  }, [navigate]);

  // ---- Socket ----
  const { socket, isConnected } = useSocket();

  // Join room once connected
  useEffect(() => {
    if (socket && roomId) {
      socket.emit('room:join', { roomId });
      socket.emit('presence:join', { roomId });
    }
  }, [socket, roomId]);

  // Listen for board title + bgColor from board:load
  useEffect(() => {
    if (!socket) return;
    const handleBoardLoad = (data) => {
      if (data?.title) setBoardTitle(data.title);
      if (data?.stickyNotes) setStickyNotes(data.stickyNotes);
      if (data?.bgColor) setBgColor(data.bgColor);
    };
    const handleBgColor = ({ bgColor: bc }) => {
      if (bc) setBgColor(bc);
    };
    socket.on('board:load', handleBoardLoad);
    socket.on('board:bgcolor', handleBgColor);
    return () => {
      socket.off('board:load', handleBoardLoad);
      socket.off('board:bgcolor', handleBgColor);
    };
  }, [socket]);

  // Fetch board details for role info
  useEffect(() => {
    if (!roomId) return;
    getBoard(roomId).then((res) => {
      const b = res.data;
      setBoardOwnerId(b.owner?._id || b.owner);
      setBoardTitle(b.title);
    }).catch(() => {});
  }, [roomId]);

  // ---- Tool state ----
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#ffffff');
  const [width, setWidth] = useState(2);
  const [fillColor] = useState('');

  const toolSettings = { tool, color, width, fillColor, fontSize: 16 };

  // ---- Viewport (pan + zoom) ----
  const {
    viewport,
    screenToCanvas,
    zoomIn,
    zoomOut,
    zoomReset,
    zoomAtPoint,
    startPan,
    updatePan,
    endPan,
  } = useViewport();

  // ---- Canvas engine ----
  const {
    elements,
    setElements,
    clearCanvas,
  } = useCanvas(canvasRef, socket, roomId, toolSettings, viewport, screenToCanvas, bgColor);

  // ---- Background color change handler ----
  const handleBgColorChange = useCallback((newColor) => {
    setBgColor(newColor);
    if (socket && roomId) {
      socket.emit('board:bgcolor', { roomId, bgColor: newColor });
    }
  }, [socket, roomId]);

  // ---- History (undo/redo) ----
  const { undo, redo, recordAction, canRedo } = useHistory(socket, roomId);

  const handleUndo = useCallback(() => {
    if (!user) return;
    const { updatedElements } = undo(elements, user.id);
    setElements(updatedElements);
  }, [undo, elements, setElements, user]);

  const handleRedo = useCallback(() => {
    const { updatedElements } = redo(elements);
    if (updatedElements !== elements) {
      setElements(updatedElements);
    }
  }, [redo, elements, setElements]);

  // Record new actions (clears redo stack)
  useEffect(() => {
    recordAction();
  }, [elements.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Auto-save indicator ----
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'unsaved'
  const saveTimerRef = useRef(null);

  // Mark as unsaved when elements change, debounce 5s save
  useEffect(() => {
    if (elements.length === 0) return;
    setSaveStatus('unsaved');

    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setSaveStatus('saving');
      // Elements are already persisted per-element via socket events
      // The auto-save is mainly a UX indicator showing last sync
      setTimeout(() => setSaveStatus('saved'), 500);
    }, 5000);

    return () => clearTimeout(saveTimerRef.current);
  }, [elements.length]);

  // ---- Live cursors ----
  const [remoteCursors, setRemoteCursors] = useState({});

  useEffect(() => {
    if (!socket) return;

    const handleCursorMove = ({ userId, username, x, y }) => {
      setRemoteCursors((prev) => ({
        ...prev,
        [userId]: { username, x, y },
      }));
    };

    const handleCursorLeave = ({ userId }) => {
      setRemoteCursors((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    };

    socket.on('cursor:move', handleCursorMove);
    socket.on('cursor:leave', handleCursorLeave);

    return () => {
      socket.off('cursor:move', handleCursorMove);
      socket.off('cursor:leave', handleCursorLeave);
    };
  }, [socket]);

  // Broadcast local cursor position
  const handleMouseMoveForCursor = useCallback(
    (e) => {
      if (!socket || !roomId || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const canvasPos = screenToCanvas(sx, sy);
      socket.volatile.emit('cursor:move', { roomId, x: canvasPos.x, y: canvasPos.y });
    },
    [socket, roomId, screenToCanvas]
  );

  // ---- Sticky notes ----
  const [stickyNotes, setStickyNotes] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const handleNoteCreate = (note) => {
      setStickyNotes((prev) => {
        if (prev.find((n) => n.noteId === note.noteId)) return prev;
        return [...prev, note];
      });
    };

    const handleNoteUpdate = (data) => {
      setStickyNotes((prev) =>
        prev.map((n) => (n.noteId === data.noteId ? { ...n, ...data } : n))
      );
    };

    const handleNoteDelete = ({ noteId }) => {
      setStickyNotes((prev) => prev.filter((n) => n.noteId !== noteId));
    };

    socket.on('note:create', handleNoteCreate);
    socket.on('note:update', handleNoteUpdate);
    socket.on('note:delete', handleNoteDelete);

    return () => {
      socket.off('note:create', handleNoteCreate);
      socket.off('note:update', handleNoteUpdate);
      socket.off('note:delete', handleNoteDelete);
    };
  }, [socket]);

  const handleAddStickyNote = useCallback(() => {
    if (!socket || !roomId) return;
    const centerCanvas = screenToCanvas(
      window.innerWidth / 2 - 100,
      window.innerHeight / 2 - 100
    );
    const note = {
      noteId: generateNoteId(),
      x: centerCanvas.x,
      y: centerCanvas.y,
      w: 200,
      h: 200,
      text: '',
      color: '#fef08a',
    };
    setStickyNotes((prev) => [...prev, note]);
    socket.emit('note:create', { roomId, ...note });
  }, [socket, roomId, screenToCanvas]);

  const handleUpdateStickyNote = useCallback(
    (updates) => {
      setStickyNotes((prev) =>
        prev.map((n) => (n.noteId === updates.noteId ? { ...n, ...updates } : n))
      );
      if (socket && roomId) {
        socket.emit('note:update', { roomId, ...updates });
      }
    },
    [socket, roomId]
  );

  const handleDeleteStickyNote = useCallback(
    (noteId) => {
      setStickyNotes((prev) => prev.filter((n) => n.noteId !== noteId));
      if (socket && roomId) {
        socket.emit('note:delete', { roomId, noteId });
      }
    },
    [socket, roomId]
  );

  // ---- Presence ----
  const [activeUsers, setActiveUsers] = useState([]);
  const [showPresence, setShowPresence] = useState(false);

  useEffect(() => {
    if (!socket) return;
    const handlePresence = (users) => {
      setActiveUsers(users);
    };
    socket.on('presence:update', handlePresence);
    return () => socket.off('presence:update', handlePresence);
  }, [socket]);

  // ---- Chat ----
  const [showChat, setShowChat] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);

  // Track unread messages when chat is closed
  useEffect(() => {
    if (!socket) return;
    const handleChatMsg = () => {
      if (!showChat) setHasUnread(true);
    };
    socket.on('chat:message', handleChatMsg);
    return () => socket.off('chat:message', handleChatMsg);
  }, [socket, showChat]);

  const toggleChat = () => {
    setShowChat((v) => !v);
    setHasUnread(false);
    setShowPresence(false);
    setShowRoles(false);
  };

  const togglePresence = () => {
    setShowPresence((v) => !v);
    setShowChat(false);
    setShowRoles(false);
  };

  // ---- Role manager ----
  const [showRoles, setShowRoles] = useState(false);
  const [collaborators, setCollaborators] = useState([]);

  const isOwner = user && boardOwnerId && (user.id === boardOwnerId || user.id === boardOwnerId.toString());

  const fetchCollaborators = useCallback(() => {
    if (!roomId) return;
    getCollaborators(roomId).then((res) => {
      setCollaborators(res.data.collaborators || []);
      if (res.data.ownerName) setBoardOwnerName(res.data.ownerName);
    }).catch(() => {});
  }, [roomId]);

  useEffect(() => {
    fetchCollaborators();
  }, [fetchCollaborators]);

  // ---- Wheel → zoom ----
  const handleWheel = useCallback(
    (e) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const delta = -e.deltaY * 0.001;
      zoomAtPoint(viewport.zoom + delta, screenX, screenY);
    },
    [viewport.zoom, zoomAtPoint]
  );

  // ---- Keyboard shortcuts ----
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // ---- Copy room link ----
  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/board/${roomId}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ---- Handle clear ----
  const handleClear = useCallback(() => {
    clearCanvas();
    setStickyNotes([]);
  }, [clearCanvas]);

  // ---- Save status icon ----
  const saveIcon = saveStatus === 'saved' ? '✓' : saveStatus === 'saving' ? '↻' : '○';
  const saveColor = saveStatus === 'saved' ? '#34d399' : saveStatus === 'saving' ? '#facc15' : '#64748b';

  return (
    <div style={{ ...styles.page, background: bgColor }}>
      {/* Canvas */}
      <div style={styles.canvasWrap}>
        <Canvas
          ref={canvasRef}
          tool={tool}
          onWheel={handleWheel}
          onMouseMoveForCursor={handleMouseMoveForCursor}
          onPanStart={startPan}
          onPanMove={updatePan}
          onPanEnd={endPan}
        />
      </div>

      {/* Sticky notes layer */}
      <div style={styles.noteLayer}>
        {stickyNotes.map((note) => (
          <div key={note.noteId} style={styles.noteChild}>
            <StickyNote
              {...note}
              viewport={viewport}
              onUpdate={handleUpdateStickyNote}
              onDelete={handleDeleteStickyNote}
            />
          </div>
        ))}
      </div>

      {/* Remote cursors layer */}
      <div style={styles.cursorLayer}>
        {Object.entries(remoteCursors).map(([uId, cursor]) => (
          <Cursor
            key={uId}
            username={cursor.username}
            x={cursor.x}
            y={cursor.y}
            viewport={viewport}
          />
        ))}
      </div>

      {/* Top bar */}
      <div style={styles.topBar}>
        <div style={styles.topLeft}>
          <button
            style={styles.backBtn}
            onClick={() => navigate('/')}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
          </button>
          <span style={styles.boardTitle}>{boardTitle || 'Untitled Board'}</span>
          {/* Auto-save indicator */}
          <span style={{ ...styles.saveBadge, color: saveColor }}>
            {saveIcon} {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : ''}
          </span>
        </div>

        <div style={styles.topRight}>
          {/* Background color picker */}
          <div style={{ position: 'relative' }}>
            <button
              style={styles.iconBtn}
              onClick={() => setShowBgPicker((v) => !v)}
              title="Board background"
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            >
              <div style={{
                width: '14px', height: '14px', borderRadius: '3px',
                background: bgColor, border: '2px solid rgba(255,255,255,0.3)',
              }} />
            </button>
            {showBgPicker && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setShowBgPicker(false)} />
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '6px',
                  background: 'rgba(10, 15, 30, 0.95)', backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
                  padding: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  zIndex: 200, width: '200px', animation: 'fadeIn 0.15s ease-out',
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Board Background</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '8px' }}>
                    {['#1a1a2e', '#0f172a', '#1e1b4b', '#0c0a09', '#0f1729', '#1c1917', '#1e293b', '#134e4a', '#3b0764', '#fafaf9'].map((c) => (
                      <button
                        key={c}
                        onClick={() => { handleBgColorChange(c); setShowBgPicker(false); }}
                        style={{
                          width: '30px', height: '30px', borderRadius: '6px',
                          background: c, border: bgColor === c ? '2px solid #818cf8' : '2px solid rgba(255,255,255,0.1)',
                          cursor: 'pointer', transition: 'all 0.15s ease',
                        }}
                        title={c}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Custom:</span>
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => { handleBgColorChange(e.target.value); }}
                      style={{ width: '28px', height: '28px', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Export */}
          <ExportButton canvasRef={canvasRef} boardTitle={boardTitle} />

          {/* Connection status */}
          <div
            style={{
              ...styles.statusDot,
              background: isConnected ? '#34d399' : '#ef4444',
              boxShadow: isConnected ? '0 0 6px rgba(52,211,153,0.5)' : '0 0 6px rgba(239,68,68,0.5)',
            }}
            title={isConnected ? 'Connected' : 'Disconnected'}
          />

          {/* Active users count button */}
          <button
            style={styles.iconBtn}
            onClick={togglePresence}
            title="Active users"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {activeUsers.length > 0 && (
              <span style={{
                position: 'absolute', top: '-4px', right: '-4px',
                fontSize: '9px', fontWeight: 700, color: '#fff',
                background: '#6366f1', borderRadius: '6px',
                padding: '1px 5px', minWidth: '14px', textAlign: 'center',
              }}>
                {activeUsers.length}
              </span>
            )}
          </button>

          {/* Chat button */}
          <button
            style={styles.iconBtn}
            onClick={toggleChat}
            title="Chat"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {hasUnread && <div style={styles.unreadDot} />}
          </button>

          {/* Role manager button */}
          <button
            style={styles.iconBtn}
            onClick={() => { setShowRoles(true); setShowChat(false); setShowPresence(false); }}
            title="Manage access"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          {/* Room ID badge */}
          <span
            style={styles.roomBadge}
            onClick={copyLink}
            title="Click to copy invite link"
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
            }}
          >
            {copied ? '✓ Copied!' : roomId}
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar
        tool={tool}
        color={color}
        width={width}
        zoom={viewport.zoom}
        onToolChange={setTool}
        onColorChange={setColor}
        onWidthChange={setWidth}
        onClear={handleClear}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={elements.length > 0}
        canRedo={canRedo}
        onZoomIn={() => zoomIn(window.innerWidth / 2, window.innerHeight / 2)}
        onZoomOut={() => zoomOut(window.innerWidth / 2, window.innerHeight / 2)}
        onZoomReset={zoomReset}
        onAddStickyNote={handleAddStickyNote}
      />

      {/* Chat sidebar */}
      {showChat && (
        <ChatPanel
          socket={socket}
          roomId={roomId}
          userId={user?.id}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* Presence sidebar */}
      {showPresence && (
        <PresencePanel
          users={activeUsers}
          currentUserId={user?.id}
          onClose={() => setShowPresence(false)}
        />
      )}

      {/* Role manager modal */}
      {showRoles && (
        <RoleManager
          roomId={roomId}
          isOwner={isOwner}
          collaborators={collaborators}
          ownerName={boardOwnerName || user?.username}
          onClose={() => setShowRoles(false)}
          onUpdate={fetchCollaborators}
        />
      )}
    </div>
  );
}
