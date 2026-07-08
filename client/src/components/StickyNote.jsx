import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * StickyNote — Draggable, editable sticky note overlay
 *
 * Rendered as a DOM element positioned over the canvas (not canvas-drawn)
 * so it supports native text editing via a textarea.
 */

const COLORS = [
  { name: 'Yellow', value: '#fef08a' },
  { name: 'Pink', value: '#fda4af' },
  { name: 'Blue', value: '#93c5fd' },
  { name: 'Green', value: '#86efac' },
  { name: 'Purple', value: '#c4b5fd' },
  { name: 'Orange', value: '#fdba74' },
];

const styles = {
  note: {
    position: 'absolute',
    borderRadius: '4px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transition: 'box-shadow 0.2s ease',
    minWidth: '120px',
    minHeight: '80px',
    zIndex: 50,
  },
  header: {
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 6px',
    cursor: 'grab',
    userSelect: 'none',
    flexShrink: 0,
  },
  colorDots: {
    display: 'flex',
    gap: '3px',
    alignItems: 'center',
  },
  colorDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    cursor: 'pointer',
    border: '1.5px solid rgba(0,0,0,0.15)',
    transition: 'transform 0.15s ease',
  },
  deleteBtn: {
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'rgba(0,0,0,0.35)',
    fontSize: '14px',
    fontWeight: 700,
    borderRadius: '4px',
    padding: 0,
    lineHeight: 1,
    transition: 'color 0.15s ease, background 0.15s ease',
  },
  textarea: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    resize: 'none',
    padding: '6px 10px',
    fontSize: '13px',
    fontFamily: 'Inter, sans-serif',
    lineHeight: '1.45',
    color: 'rgba(0,0,0,0.8)',
    outline: 'none',
  },
};

export default function StickyNote({
  noteId,
  x,
  y,
  w = 200,
  h = 200,
  text = '',
  color = '#fef08a',
  viewport,
  onUpdate,
  onDelete,
}) {
  const [localText, setLocalText] = useState(text);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const noteRef = useRef(null);
  const debounceRef = useRef(null);

  // Sync external text changes
  useEffect(() => {
    setLocalText(text);
  }, [text]);

  // Viewport transform to screen position
  const vp = viewport || { panX: 0, panY: 0, zoom: 1 };
  const screenX = x * vp.zoom + vp.panX;
  const screenY = y * vp.zoom + vp.panY;
  const scaledW = w * vp.zoom;
  const scaledH = h * vp.zoom;

  // -------------------------------------------------------------------------
  // Drag handlers
  // -------------------------------------------------------------------------
  const handleMouseDown = useCallback((e) => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON') return;
    e.preventDefault();
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - screenX,
      y: e.clientY - screenY,
    };
  }, [screenX, screenY]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const newScreenX = e.clientX - dragOffset.current.x;
      const newScreenY = e.clientY - dragOffset.current.y;
      // Convert screen back to canvas coords
      const canvasX = (newScreenX - vp.panX) / vp.zoom;
      const canvasY = (newScreenY - vp.panY) / vp.zoom;
      onUpdate({ noteId, x: canvasX, y: canvasY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, noteId, vp, onUpdate]);

  // -------------------------------------------------------------------------
  // Text editing with debounced update
  // -------------------------------------------------------------------------
  const handleTextChange = (e) => {
    const val = e.target.value;
    setLocalText(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onUpdate({ noteId, text: val });
    }, 400);
  };

  // -------------------------------------------------------------------------
  // Color change
  // -------------------------------------------------------------------------
  const handleColorChange = (newColor) => {
    onUpdate({ noteId, color: newColor });
  };

  return (
    <div
      ref={noteRef}
      style={{
        ...styles.note,
        left: `${screenX}px`,
        top: `${screenY}px`,
        width: `${scaledW}px`,
        height: `${scaledH}px`,
        background: color,
        boxShadow: isDragging
          ? '0 8px 30px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)'
          : styles.note.boxShadow,
      }}
    >
      {/* Drag header */}
      <div
        style={{
          ...styles.header,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
      >
        <div style={styles.colorDots}>
          {COLORS.map((c) => (
            <div
              key={c.value}
              title={c.name}
              onClick={() => handleColorChange(c.value)}
              style={{
                ...styles.colorDot,
                background: c.value,
                transform: c.value === color ? 'scale(1.25)' : 'scale(1)',
                borderColor: c.value === color ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)',
              }}
            />
          ))}
        </div>
        <button
          style={styles.deleteBtn}
          title="Delete note"
          onClick={() => onDelete(noteId)}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'rgba(200,0,0,0.8)';
            e.currentTarget.style.background = 'rgba(200,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(0,0,0,0.35)';
            e.currentTarget.style.background = 'none';
          }}
        >
          ✕
        </button>
      </div>

      {/* Editable body */}
      <textarea
        style={{
          ...styles.textarea,
          fontSize: `${Math.max(11, 13 * vp.zoom)}px`,
        }}
        value={localText}
        onChange={handleTextChange}
        placeholder="Type here..."
      />
    </div>
  );
}
