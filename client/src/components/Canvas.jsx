import { useRef, useEffect, forwardRef } from 'react';

/**
 * Canvas — Phase 2 with zoom/pan support
 *
 * Handles:
 *   - Mouse wheel → zoom (Ctrl+scroll) or vertical scroll
 *   - Middle-mouse drag → pan
 *   - Space+drag → pan
 *   - Cursor style based on active tool
 *   - Mouse move forwarded to parent for cursor broadcasting
 */

const CURSOR_MAP = {
  pen: 'crosshair',
  eraser: 'cell',
  rect: 'crosshair',
  circle: 'crosshair',
  line: 'crosshair',
  text: 'text',
  sticky: 'default',
  select: 'default',
};

const Canvas = forwardRef(function Canvas(
  { tool, onWheel, onMouseMoveForCursor, onPanStart, onPanMove, onPanEnd },
  ref
) {
  const spaceHeldRef = useRef(false);
  const isPanningRef = useRef(false);

  // Track space key for pan mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        spaceHeldRef.current = true;
        if (ref?.current) ref.current.style.cursor = 'grab';
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        spaceHeldRef.current = false;
        isPanningRef.current = false;
        if (onPanEnd) onPanEnd();
        if (ref?.current) ref.current.style.cursor = CURSOR_MAP[tool] || 'crosshair';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [tool, ref, onPanEnd]);

  // Wheel handler for zoom
  const handleWheel = (e) => {
    if (onWheel) {
      e.preventDefault();
      onWheel(e);
    }
  };

  // Mouse handlers for pan + cursor broadcasting
  const handleMouseDown = (e) => {
    // Middle mouse button OR space held → start pan
    if (e.button === 1 || spaceHeldRef.current) {
      e.preventDefault();
      isPanningRef.current = true;
      if (ref?.current) ref.current.style.cursor = 'grabbing';
      if (onPanStart) onPanStart(e.clientX, e.clientY);
    }
  };

  const handleMouseMove = (e) => {
    if (isPanningRef.current) {
      if (onPanMove) onPanMove(e.clientX, e.clientY);
    }
    // Forward for cursor broadcasting
    if (onMouseMoveForCursor) {
      onMouseMoveForCursor(e);
    }
  };

  const handleMouseUp = (e) => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      if (ref?.current) {
        ref.current.style.cursor = spaceHeldRef.current ? 'grab' : (CURSOR_MAP[tool] || 'crosshair');
      }
      if (onPanEnd) onPanEnd();
    }
  };

  return (
    <canvas
      ref={ref}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        cursor: CURSOR_MAP[tool] || 'crosshair',
        touchAction: 'none',
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    />
  );
});

export default Canvas;
