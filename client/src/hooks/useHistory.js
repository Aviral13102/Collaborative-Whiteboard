import { useState, useCallback } from 'react';

/**
 * useHistory — Undo/Redo using the Command Pattern
 *
 * Tracks per-user action history as a stack of element IDs.
 * Works with the elements array managed by useCanvas:
 *   - undo(): removes the user's last element, pushes it to the redo stack
 *   - redo(): pops from the redo stack, adds it back to elements
 *
 * Socket events are emitted so undo/redo syncs across clients.
 */

export default function useHistory(socket, roomId) {
  // Stack of undone elements (full element objects for redo)
  const [undoStack, setUndoStack] = useState([]);

  /**
   * Record that a new element was drawn — clears the redo stack
   * (new actions invalidate the redo history, same as any editor).
   */
  const recordAction = useCallback(() => {
    setUndoStack([]);
  }, []);

  /**
   * Undo the last element drawn by the local user.
   * @param {Array} elements - current elements array
   * @param {string} userId - the local user's ID
   * @returns {{ updatedElements: Array, undoneElement: object|null }}
   */
  const undo = useCallback((elements, userId) => {
    // Find the last element drawn by this user
    let undoneElement = null;
    const updatedElements = [...elements];

    for (let i = updatedElements.length - 1; i >= 0; i--) {
      if (updatedElements[i].userId === userId || updatedElements[i]._userId === userId) {
        undoneElement = updatedElements.splice(i, 1)[0];
        break;
      }
    }

    if (undoneElement) {
      setUndoStack((prev) => [...prev, undoneElement]);

      // Emit to server
      if (socket) {
        socket.emit('draw:undo', {
          roomId,
          elementId: undoneElement.elementId,
        });
      }
    }

    return { updatedElements, undoneElement };
  }, [socket, roomId]);

  /**
   * Redo the last undone element.
   * @param {Array} elements - current elements array
   * @returns {{ updatedElements: Array, redoneElement: object|null }}
   */
  const redo = useCallback((elements) => {
    if (undoStack.length === 0) return { updatedElements: elements, redoneElement: null };

    const redoneElement = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));

    const updatedElements = [...elements, redoneElement];

    // Emit to server
    if (socket) {
      socket.emit('draw:redo', {
        roomId,
        element: redoneElement,
      });
    }

    return { updatedElements, redoneElement };
  }, [socket, roomId, undoStack]);

  const canUndo = true; // We check against elements array in the caller
  const canRedo = undoStack.length > 0;

  return {
    undo,
    redo,
    recordAction,
    canUndo,
    canRedo,
    clearHistory: () => setUndoStack([]),
  };
}
