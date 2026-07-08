import { useMemo } from 'react';

/**
 * Cursor — Remote user cursor overlay
 *
 * Renders a colored dot with a username label for each remote user's
 * cursor position. Uses CSS transitions for smooth movement interpolation.
 */

// Deterministic color from username (hash → hue)
function usernameToColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 60%)`;
}

const styles = {
  wrapper: {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: 100,
    transition: 'transform 0.1s linear',
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.5)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
  },
  label: {
    position: 'absolute',
    left: '14px',
    top: '-2px',
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '6px',
    whiteSpace: 'nowrap',
    letterSpacing: '0.01em',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
};

export default function Cursor({ username, x, y, viewport }) {
  const color = useMemo(() => usernameToColor(username || 'user'), [username]);

  // Convert canvas coordinates to screen coordinates using viewport
  const vp = viewport || { panX: 0, panY: 0, zoom: 1 };
  const screenX = x * vp.zoom + vp.panX;
  const screenY = y * vp.zoom + vp.panY;

  return (
    <div
      style={{
        ...styles.wrapper,
        transform: `translate(${screenX}px, ${screenY}px)`,
      }}
    >
      <div style={{ ...styles.dot, background: color }} />
      <div
        style={{
          ...styles.label,
          background: color,
          color: '#fff',
        }}
      >
        {username}
      </div>
    </div>
  );
}
