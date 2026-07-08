import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * useCanvas — Object-Based Canvas Rendering Engine
 *
 * Phase 2 rewrite: instead of immediate-mode drawing (draw-and-forget),
 * all elements are stored in an array and the canvas is re-rendered from
 * this array every time something changes. This enables:
 *   - Shape tools (rect, circle, line, text)
 *   - Undo/redo (add/remove from elements array)
 *   - Pan & zoom (viewport transform applied before rendering)
 *   - Proper resize handling (no lossy image save/restore)
 */

// Generate a unique element ID (simple nanoid-like)
let idCounter = 0;
function generateId() {
  return `el_${Date.now()}_${++idCounter}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function useCanvas(canvasRef, socket, roomId, toolSettings, viewport, screenToCanvas, bgColor = '#1a1a2e') {
  const [elements, setElements] = useState([]);
  const isDrawingRef = useRef(false);
  const currentElementRef = useRef(null);
  const pointsRef = useRef([]);
  const ctxRef = useRef(null);
  const dprRef = useRef(1);
  const canvasSizeRef = useRef({ w: 0, h: 0 });

  // Refs to avoid stale closures in stopDrawing
  const socketRef = useRef(socket);
  const roomIdRef = useRef(roomId);
  useEffect(() => { socketRef.current = socket; }, [socket]);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);

  // Live drawing state: remote users' in-progress drawings
  const liveElementsRef = useRef({}); // userId -> element
  const bgColorRef = useRef(bgColor);
  useEffect(() => { bgColorRef.current = bgColor; }, [bgColor]);

  // Throttle counter for live emit
  const liveEmitCounter = useRef(0);

  // -------------------------------------------------------------------------
  // Canvas initialization (no drawing — just sizing + context setup)
  // -------------------------------------------------------------------------
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;
    dprRef.current = dpr;
    canvasSizeRef.current = { w: rect.width, h: rect.height };
  }, [canvasRef]);

  // -------------------------------------------------------------------------
  // Render all elements — called on every change
  // -------------------------------------------------------------------------
  const renderAll = useCallback(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    const dpr = dprRef.current;
    const { w, h } = canvasSizeRef.current;

    // Reset transform and clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    // Canvas background (dynamic)
    ctx.fillStyle = bgColorRef.current || '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    // Apply viewport transform (pan + zoom)
    const vp = viewport || { panX: 0, panY: 0, zoom: 1 };
    ctx.translate(vp.panX, vp.panY);
    ctx.scale(vp.zoom, vp.zoom);

    // Draw all committed elements
    elements.forEach((el) => renderElement(ctx, el));

    // Draw remote users' live (in-progress) elements with slight transparency
    const liveEls = liveElementsRef.current;
    if (liveEls) {
      ctx.globalAlpha = 0.6;
      Object.values(liveEls).forEach((el) => {
        if (el) renderElement(ctx, el);
      });
      ctx.globalAlpha = 1.0;
    }

    // Draw the local in-progress element (preview while drawing)
    if (currentElementRef.current) {
      renderElement(ctx, currentElementRef.current);
    }
  }, [canvasRef, elements, viewport, bgColor]);

  // -------------------------------------------------------------------------
  // Render a single element based on its type
  // -------------------------------------------------------------------------
  function renderElement(ctx, el) {
    if (!el) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (el.type) {
      case 'stroke':
        renderStroke(ctx, el);
        break;
      case 'eraser':
        renderEraser(ctx, el);
        break;
      case 'rect':
        renderRect(ctx, el);
        break;
      case 'circle':
        renderCircle(ctx, el);
        break;
      case 'line':
        renderLine(ctx, el);
        break;
      case 'text':
        renderText(ctx, el);
        break;
      default:
        // Legacy stroke support
        if (el.points && el.points.length >= 2) {
          renderStroke(ctx, el);
        }
        break;
    }

    ctx.restore();
  }

  function renderStroke(ctx, el) {
    if (!el.points || el.points.length < 2) return;
    ctx.strokeStyle = el.color || '#ffffff';
    ctx.lineWidth = el.width || 2;
    ctx.globalCompositeOperation = 'source-over';
    ctx.beginPath();
    ctx.moveTo(el.points[0].x, el.points[0].y);
    for (let i = 1; i < el.points.length; i++) {
      const prev = el.points[i - 1];
      const curr = el.points[i];
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
    }
    const last = el.points[el.points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  }

  function renderEraser(ctx, el) {
    // Eraser draws a thick stroke in the background color
    if (!el.points || el.points.length < 2) return;
    ctx.strokeStyle = bgColorRef.current || '#1a1a2e'; // match dynamic background
    ctx.lineWidth = el.width || 8;
    ctx.globalCompositeOperation = 'source-over';
    ctx.beginPath();
    ctx.moveTo(el.points[0].x, el.points[0].y);
    for (let i = 1; i < el.points.length; i++) {
      const prev = el.points[i - 1];
      const curr = el.points[i];
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
    }
    const last = el.points[el.points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  }

  function renderRect(ctx, el) {
    ctx.strokeStyle = el.color || '#ffffff';
    ctx.lineWidth = el.width || 2;
    if (el.fillColor) {
      ctx.fillStyle = el.fillColor;
      ctx.fillRect(el.x, el.y, el.w, el.h);
    }
    ctx.strokeRect(el.x, el.y, el.w, el.h);
  }

  function renderCircle(ctx, el) {
    ctx.strokeStyle = el.color || '#ffffff';
    ctx.lineWidth = el.width || 2;
    const rx = Math.abs(el.w / 2);
    const ry = Math.abs(el.h / 2);
    const cx = el.x + el.w / 2;
    const cy = el.y + el.h / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    if (el.fillColor) {
      ctx.fillStyle = el.fillColor;
      ctx.fill();
    }
    ctx.stroke();
  }

  function renderLine(ctx, el) {
    ctx.strokeStyle = el.color || '#ffffff';
    ctx.lineWidth = el.width || 2;
    ctx.beginPath();
    ctx.moveTo(el.x, el.y);
    ctx.lineTo(el.x2, el.y2);
    ctx.stroke();
  }

  function renderText(ctx, el) {
    const size = el.fontSize || 16;
    ctx.font = `${size}px Inter, sans-serif`;
    ctx.fillStyle = el.color || '#ffffff';
    ctx.textBaseline = 'top';
    // Wrap text if needed
    const lines = (el.text || '').split('\n');
    lines.forEach((line, i) => {
      ctx.fillText(line, el.x, el.y + i * (size * 1.3));
    });
  }

  // -------------------------------------------------------------------------
  // Coordinate helper: screen → canvas (accounting for viewport transform)
  // -------------------------------------------------------------------------
  const getCanvasPos = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Screen position relative to canvas element
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;

    // Convert to canvas (world) coordinates using viewport transform
    if (screenToCanvas) {
      return screenToCanvas(sx, sy);
    }
    return { x: sx, y: sy };
  }, [canvasRef, screenToCanvas]);

  // -------------------------------------------------------------------------
  // Drawing event handlers — route based on active tool
  // -------------------------------------------------------------------------
  const startDrawing = useCallback((e) => {
    // Don't draw if middle mouse (pan) or space is held
    if (e.button === 1) return;
    e.preventDefault();
    isDrawingRef.current = true;
    const pos = getCanvasPos(e);
    const tool = toolSettings.tool;

    if (tool === 'pen' || tool === 'eraser') {
      // Freehand stroke
      pointsRef.current = [pos];
      currentElementRef.current = {
        elementId: generateId(),
        type: tool === 'eraser' ? 'eraser' : 'stroke',
        points: [pos],
        color: toolSettings.color,
        width: toolSettings.width,
        tool: tool,
      };
    } else if (tool === 'rect' || tool === 'circle') {
      currentElementRef.current = {
        elementId: generateId(),
        type: tool,
        x: pos.x,
        y: pos.y,
        w: 0,
        h: 0,
        color: toolSettings.color,
        fillColor: toolSettings.fillColor || '',
        width: toolSettings.width,
      };
    } else if (tool === 'line') {
      currentElementRef.current = {
        elementId: generateId(),
        type: 'line',
        x: pos.x,
        y: pos.y,
        x2: pos.x,
        y2: pos.y,
        color: toolSettings.color,
        width: toolSettings.width,
      };
    } else if (tool === 'text') {
      // Text tool: create a text element where the user clicks
      const text = prompt('Enter text:');
      if (text) {
        const newEl = {
          elementId: generateId(),
          type: 'text',
          x: pos.x,
          y: pos.y,
          text,
          fontSize: toolSettings.fontSize || 16,
          color: toolSettings.color,
        };
        setElements((prev) => [...prev, newEl]);
        emitElement(newEl);
      }
      isDrawingRef.current = false;
      return;
    }
  }, [getCanvasPos, toolSettings]);

  const draw = useCallback((e) => {
    if (!isDrawingRef.current || !currentElementRef.current) return;
    e.preventDefault();
    const pos = getCanvasPos(e);
    const el = currentElementRef.current;

    if (el.type === 'stroke' || el.type === 'eraser') {
      pointsRef.current.push(pos);
      currentElementRef.current = { ...el, points: [...pointsRef.current] };
    } else if (el.type === 'rect' || el.type === 'circle') {
      currentElementRef.current = {
        ...el,
        w: pos.x - el.x,
        h: pos.y - el.y,
      };
    } else if (el.type === 'line') {
      currentElementRef.current = {
        ...el,
        x2: pos.x,
        y2: pos.y,
      };
    }

    // Emit live drawing to other users (throttled: every 3rd point)
    liveEmitCounter.current++;
    if (liveEmitCounter.current % 3 === 0) {
      const s = socketRef.current;
      const r = roomIdRef.current;
      if (s && r) {
        const liveData = currentElementRef.current;
        s.volatile.emit('draw:live', { roomId: r, ...liveData });
      }
    }

    // Trigger re-render for live preview
    renderAll();
  }, [getCanvasPos, renderAll]);

  // Emit element to server (uses refs to avoid stale closure)
  const emitElement = useCallback((el) => {
    const s = socketRef.current;
    const r = roomIdRef.current;
    if (!s || !r) return;
    s.emit('draw:element', { roomId: r, ...el });
  }, []);

  const stopDrawing = useCallback((e) => {
    if (!isDrawingRef.current) return;
    if (e) e.preventDefault();
    isDrawingRef.current = false;
    liveEmitCounter.current = 0;

    const el = currentElementRef.current;
    if (!el) return;

    // Validate: don't commit zero-size shapes or single-point strokes
    let isValid = true;
    if (el.type === 'stroke' || el.type === 'eraser') {
      isValid = el.points && el.points.length >= 2;
    } else if (el.type === 'rect' || el.type === 'circle') {
      isValid = Math.abs(el.w) > 2 || Math.abs(el.h) > 2;
    } else if (el.type === 'line') {
      isValid = Math.abs(el.x2 - el.x) > 2 || Math.abs(el.y2 - el.y) > 2;
    }

    if (isValid) {
      setElements((prev) => [...prev, el]);
      emitElement(el);
      // Notify others to clear the live preview for this element
      const s = socketRef.current;
      const r = roomIdRef.current;
      if (s && r) {
        s.emit('draw:done', { roomId: r, elementId: el.elementId });
      }
    }

    currentElementRef.current = null;
    pointsRef.current = [];
  }, [emitElement]);

  // -------------------------------------------------------------------------
  // Re-render whenever elements or viewport changes
  // -------------------------------------------------------------------------
  useEffect(() => {
    renderAll();
  }, [renderAll]);

  // -------------------------------------------------------------------------
  // Canvas sizing + resize handler
  // -------------------------------------------------------------------------
  useEffect(() => {
    initCanvas();

    const handleResize = () => {
      initCanvas();
      // No need to save/restore image — we re-render from elements array
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initCanvas]);

  // -------------------------------------------------------------------------
  // Attach canvas event listeners
  // -------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing, { passive: false });
    canvas.addEventListener('touchcancel', stopDrawing, { passive: false });

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseleave', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
      canvas.removeEventListener('touchcancel', stopDrawing);
    };
  }, [canvasRef, startDrawing, draw, stopDrawing]);

  // -------------------------------------------------------------------------
  // Socket event listeners
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!socket) return;

    const handleRemoteElement = (el) => {
      // Remove from live previews since it's now committed
      if (el.userId) {
        delete liveElementsRef.current[el.userId];
      }
      setElements((prev) => [...prev, el]);
    };

    const handleBoardLoad = (data) => {
      if (data && data.elements) {
        setElements(data.elements);
      } else if (data && data.strokes) {
        setElements(data.strokes.map((s) => ({ ...s, type: s.type || s.tool || 'stroke', elementId: s.elementId || s._id })));
      }
    };

    const handleUndo = ({ elementId }) => {
      setElements((prev) => prev.filter((el) => el.elementId !== elementId));
    };

    const handleRedo = (data) => {
      const element = data.element || data;
      if (element && element.elementId) {
        setElements((prev) => [...prev, element]);
      }
    };

    const handleClear = () => {
      setElements([]);
      liveElementsRef.current = {};
    };

    // Live drawing: remote user is currently drawing
    const handleLive = (data) => {
      if (data && data.userId) {
        liveElementsRef.current[data.userId] = data;
        // Trigger re-render to show the live element
        renderAll();
      }
    };

    // Live drawing done: remote user finished drawing
    const handleDone = ({ userId }) => {
      if (userId) {
        delete liveElementsRef.current[userId];
        renderAll();
      }
    };

    socket.on('draw:element', handleRemoteElement);
    socket.on('board:load', handleBoardLoad);
    socket.on('draw:undo', handleUndo);
    socket.on('draw:redo', handleRedo);
    socket.on('draw:clear', handleClear);
    socket.on('draw:live', handleLive);
    socket.on('draw:done', handleDone);

    return () => {
      socket.off('draw:element', handleRemoteElement);
      socket.off('board:load', handleBoardLoad);
      socket.off('draw:undo', handleUndo);
      socket.off('draw:redo', handleRedo);
      socket.off('draw:clear', handleClear);
      socket.off('draw:live', handleLive);
      socket.off('draw:done', handleDone);
    };
  }, [socket, renderAll]);

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------
  return {
    elements,
    setElements,
    clearCanvas: () => {
      setElements([]);
      if (socket) {
        socket.emit('draw:clear', { roomId });
      }
    },
    isDrawing: isDrawingRef.current,
  };
}
