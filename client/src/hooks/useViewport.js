import { useState, useCallback, useRef } from 'react';

/**
 * useViewport — Pan & Zoom state management
 *
 * Manages the viewport transform for an infinite canvas:
 *   - panX, panY: translation offset in screen pixels
 *   - zoom: scale factor (0.1 – 5.0)
 *
 * Provides coordinate conversion between screen space and canvas space,
 * plus handlers for zooming and panning.
 */

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5.0;
const ZOOM_STEP = 0.1;

export default function useViewport() {
  const [viewport, setViewport] = useState({ panX: 0, panY: 0, zoom: 1 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // -------------------------------------------------------------------------
  // Coordinate conversion
  // -------------------------------------------------------------------------

  /** Convert screen (mouse) coordinates to canvas (world) coordinates */
  const screenToCanvas = useCallback((sx, sy) => {
    return {
      x: (sx - viewport.panX) / viewport.zoom,
      y: (sy - viewport.panY) / viewport.zoom,
    };
  }, [viewport]);

  /** Convert canvas (world) coordinates to screen coordinates */
  const canvasToScreen = useCallback((cx, cy) => {
    return {
      x: cx * viewport.zoom + viewport.panX,
      y: cy * viewport.zoom + viewport.panY,
    };
  }, [viewport]);

  // -------------------------------------------------------------------------
  // Zoom controls
  // -------------------------------------------------------------------------

  /** Zoom toward a specific screen point (e.g., cursor position) */
  const zoomAtPoint = useCallback((newZoom, screenX, screenY) => {
    setViewport((prev) => {
      const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
      // Zoom toward the cursor: adjust pan so the point under cursor stays fixed
      const worldX = (screenX - prev.panX) / prev.zoom;
      const worldY = (screenY - prev.panY) / prev.zoom;
      return {
        zoom: clamped,
        panX: screenX - worldX * clamped,
        panY: screenY - worldY * clamped,
      };
    });
  }, []);

  /** Zoom in by one step, centered on screen center */
  const zoomIn = useCallback((centerX, centerY) => {
    setViewport((prev) => {
      const newZoom = Math.min(MAX_ZOOM, prev.zoom + ZOOM_STEP);
      const cx = centerX ?? 0;
      const cy = centerY ?? 0;
      const worldX = (cx - prev.panX) / prev.zoom;
      const worldY = (cy - prev.panY) / prev.zoom;
      return { zoom: newZoom, panX: cx - worldX * newZoom, panY: cy - worldY * newZoom };
    });
  }, []);

  /** Zoom out by one step */
  const zoomOut = useCallback((centerX, centerY) => {
    setViewport((prev) => {
      const newZoom = Math.max(MIN_ZOOM, prev.zoom - ZOOM_STEP);
      const cx = centerX ?? 0;
      const cy = centerY ?? 0;
      const worldX = (cx - prev.panX) / prev.zoom;
      const worldY = (cy - prev.panY) / prev.zoom;
      return { zoom: newZoom, panX: cx - worldX * newZoom, panY: cy - worldY * newZoom };
    });
  }, []);

  /** Reset zoom and pan to default */
  const zoomReset = useCallback(() => {
    setViewport({ panX: 0, panY: 0, zoom: 1 });
  }, []);

  // -------------------------------------------------------------------------
  // Pan (drag) controls
  // -------------------------------------------------------------------------

  const startPan = useCallback((screenX, screenY) => {
    isPanningRef.current = true;
    panStartRef.current = {
      x: screenX,
      y: screenY,
      panX: viewport.panX,
      panY: viewport.panY,
    };
  }, [viewport.panX, viewport.panY]);

  const updatePan = useCallback((screenX, screenY) => {
    if (!isPanningRef.current) return;
    const dx = screenX - panStartRef.current.x;
    const dy = screenY - panStartRef.current.y;
    setViewport((prev) => ({
      ...prev,
      panX: panStartRef.current.panX + dx,
      panY: panStartRef.current.panY + dy,
    }));
  }, []);

  const endPan = useCallback(() => {
    isPanningRef.current = false;
  }, []);

  return {
    viewport,
    screenToCanvas,
    canvasToScreen,
    zoomIn,
    zoomOut,
    zoomReset,
    zoomAtPoint,
    startPan,
    updatePan,
    endPan,
    isPanning: isPanningRef,
  };
}
