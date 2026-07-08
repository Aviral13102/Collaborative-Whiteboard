import { useState } from 'react';

/**
 * Toolbar — Phase 2 expanded floating toolbar
 *
 * Sections:
 *   1. Drawing tools: Pen, Eraser, Rect, Circle, Line, Text, Sticky Note
 *   2. Colors: 8 presets + custom color picker
 *   3. Stroke widths: S / M / L
 *   4. Actions: Undo, Redo, Clear
 *   5. Zoom: In, Out, Reset + percentage display
 */

// ---------- SVG Icons ----------
const PenIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
);

const EraserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
    <path d="M22 21H7" />
    <path d="m5 11 9 9" />
  </svg>
);

const RectIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
  </svg>
);

const CircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
  </svg>
);

const LineIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="5" y1="19" x2="19" y2="5" />
  </svg>
);

const TextIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 7 4 4 20 4 20 7" />
    <line x1="9" y1="20" x2="15" y2="20" />
    <line x1="12" y1="4" x2="12" y2="20" />
  </svg>
);

const StickyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z" />
    <path d="M15 3v4a2 2 0 0 0 2 2h4" />
  </svg>
);

const UndoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
  </svg>
);

const RedoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 7v6h-6" />
    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
  </svg>
);

const ZoomInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="11" y1="8" x2="11" y2="14" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const ZoomOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const ClearIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

// ---------- Color presets ----------
const COLORS = ['#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

// ---------- Styles ----------
const s = {
  bar: {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    padding: '8px 12px',
    background: 'rgba(10, 15, 30, 0.85)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
    zIndex: 200,
    animation: 'slideUp 0.3s ease-out',
  },
  divider: {
    width: '1px',
    height: '28px',
    background: 'rgba(255,255,255,0.08)',
    margin: '0 6px',
    flexShrink: 0,
  },
  toolBtn: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    border: 'none',
    background: 'transparent',
    color: '#94a3b8',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    position: 'relative',
    flexShrink: 0,
  },
  toolBtnActive: {
    background: 'rgba(99, 102, 241, 0.2)',
    color: '#818cf8',
    boxShadow: '0 0 0 1px rgba(99, 102, 241, 0.3)',
  },
  colorSwatch: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    border: '2px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    flexShrink: 0,
  },
  colorSwatchActive: {
    border: '2px solid #818cf8',
    transform: 'scale(1.2)',
    boxShadow: '0 0 6px rgba(99, 102, 241, 0.4)',
  },
  widthBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    flexShrink: 0,
  },
  widthBtnActive: {
    background: 'rgba(99, 102, 241, 0.2)',
    boxShadow: '0 0 0 1px rgba(99, 102, 241, 0.3)',
  },
  actionBtn: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: '#94a3b8',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    flexShrink: 0,
  },
  zoomLabel: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: 600,
    minWidth: '38px',
    textAlign: 'center',
    userSelect: 'none',
    cursor: 'pointer',
    flexShrink: 0,
  },
  tooltip: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginBottom: '6px',
    padding: '4px 8px',
    background: '#1e293b',
    color: '#e2e8f0',
    fontSize: '11px',
    fontWeight: 500,
    borderRadius: '6px',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
    opacity: 0,
    transition: 'opacity 0.15s ease',
  },
};

const TOOLS = [
  { id: 'pen', label: 'Pen', icon: PenIcon },
  { id: 'eraser', label: 'Eraser', icon: EraserIcon },
  { id: 'rect', label: 'Rectangle', icon: RectIcon },
  { id: 'circle', label: 'Circle', icon: CircleIcon },
  { id: 'line', label: 'Line', icon: LineIcon },
  { id: 'text', label: 'Text', icon: TextIcon },
  { id: 'sticky', label: 'Sticky Note', icon: StickyIcon },
];

const WIDTHS = [
  { label: 'S', value: 2 },
  { label: 'M', value: 4 },
  { label: 'L', value: 8 },
];

function ToolButton({ tool, isActive, onClick }) {
  const [hover, setHover] = useState(false);
  const Icon = tool.icon;
  return (
    <button
      style={{
        ...s.toolBtn,
        ...(isActive ? s.toolBtnActive : {}),
        ...(hover && !isActive ? { background: 'rgba(255,255,255,0.06)', color: '#cbd5e1' } : {}),
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        setHover(true);
        const tip = e.currentTarget.querySelector('.tip');
        if (tip) tip.style.opacity = 1;
      }}
      onMouseLeave={(e) => {
        setHover(false);
        const tip = e.currentTarget.querySelector('.tip');
        if (tip) tip.style.opacity = 0;
      }}
      title={tool.label}
    >
      <Icon />
      <span className="tip" style={s.tooltip}>{tool.label}</span>
    </button>
  );
}

export default function Toolbar({
  tool,
  color,
  width,
  zoom = 1,
  onToolChange,
  onColorChange,
  onWidthChange,
  onClear,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onAddStickyNote,
}) {
  const [confirmClear, setConfirmClear] = useState(false);

  const handleClear = () => {
    if (confirmClear) {
      onClear();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 2000);
    }
  };

  const handleToolClick = (toolId) => {
    if (toolId === 'sticky') {
      if (onAddStickyNote) onAddStickyNote();
      return;
    }
    onToolChange(toolId);
  };

  return (
    <div style={s.bar}>
      {/* ---- Tool buttons ---- */}
      {TOOLS.map((t) => (
        <ToolButton
          key={t.id}
          tool={t}
          isActive={t.id === tool}
          onClick={() => handleToolClick(t.id)}
        />
      ))}

      <div style={s.divider} />

      {/* ---- Colors ---- */}
      {COLORS.map((c) => (
        <div
          key={c}
          style={{
            ...s.colorSwatch,
            background: c,
            ...(c === color ? s.colorSwatchActive : {}),
          }}
          onClick={() => onColorChange(c)}
        />
      ))}
      <input
        type="color"
        value={color}
        onChange={(e) => onColorChange(e.target.value)}
        style={{
          width: '18px',
          height: '18px',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          padding: 0,
          flexShrink: 0,
        }}
        title="Custom color"
      />

      <div style={s.divider} />

      {/* ---- Widths ---- */}
      {WIDTHS.map((w) => (
        <button
          key={w.value}
          style={{
            ...s.widthBtn,
            ...(width === w.value ? s.widthBtnActive : {}),
          }}
          onClick={() => onWidthChange(w.value)}
          title={`${w.label} (${w.value}px)`}
        >
          <span
            style={{
              width: `${w.value + 4}px`,
              height: `${w.value + 4}px`,
              borderRadius: '50%',
              background: width === w.value ? '#818cf8' : '#64748b',
              transition: 'background 0.15s ease',
            }}
          />
        </button>
      ))}

      <div style={s.divider} />

      {/* ---- Undo / Redo ---- */}
      <button
        style={{ ...s.actionBtn, opacity: canUndo ? 1 : 0.3 }}
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
      >
        <UndoIcon />
      </button>
      <button
        style={{ ...s.actionBtn, opacity: canRedo ? 1 : 0.3 }}
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
      >
        <RedoIcon />
      </button>

      {/* ---- Clear ---- */}
      <button
        style={{
          ...s.actionBtn,
          color: confirmClear ? '#ef4444' : '#94a3b8',
        }}
        onClick={handleClear}
        title={confirmClear ? 'Click again to confirm' : 'Clear canvas'}
      >
        <ClearIcon />
      </button>

      <div style={s.divider} />

      {/* ---- Zoom controls ---- */}
      <button style={s.actionBtn} onClick={onZoomOut} title="Zoom out">
        <ZoomOutIcon />
      </button>
      <span style={s.zoomLabel} onClick={onZoomReset} title="Reset zoom">
        {Math.round(zoom * 100)}%
      </span>
      <button style={s.actionBtn} onClick={onZoomIn} title="Zoom in">
        <ZoomInIcon />
      </button>
    </div>
  );
}
