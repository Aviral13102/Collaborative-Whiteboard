/**
 * Draw Handler (Socket.io) — Phase 2
 *
 * Manages real-time drawing events for collaborative whiteboard rooms.
 * Supports all canvas element types (stroke, rect, circle, line, text),
 * undo/redo by elementId, and full board clearing (elements + sticky notes).
 */

const Board = require('../models/Board');
const Stroke = require('../models/Stroke');       // Generalized Element model
const StickyNote = require('../models/StickyNote');

/**
 * Registers drawing-related Socket.io event handlers on the given socket.
 *
 * @param {import('socket.io').Server} io   - The Socket.io server instance
 * @param {import('socket.io').Socket} socket - The connected client socket
 */
function drawHandler(io, socket) {
  // ---------------------------------------------------------------------------
  // room:join — Client joins a whiteboard room and receives full board state.
  // Payload: { roomId: string }
  // ---------------------------------------------------------------------------
  socket.on('room:join', async ({ roomId }) => {
    try {
      if (!roomId) {
        return socket.emit('error:message', { error: 'roomId is required to join a room.' });
      }

      // Validate that the board exists
      const board = await Board.findOne({ roomId });
      if (!board) {
        return socket.emit('error:message', { error: `Board with roomId "${roomId}" not found.` });
      }

      // Join the Socket.io room
      socket.join(roomId);

      // Load all elements sorted by their z-order
      const elements = await Stroke.find({ boardId: board._id })
        .sort({ order: 1 })
        .lean();

      // Load all sticky notes for this board
      const stickyNotes = await StickyNote.find({ boardId: board._id })
        .sort({ createdAt: 1 })
        .lean();

      // Send the full board state to the joining client only
      socket.emit('board:load', {
        title: board.title,
        bgColor: board.bgColor,
        elements,
        stickyNotes,
      });

      console.log(`[Socket] User "${socket.user.username}" joined room ${roomId}`);
    } catch (err) {
      console.error('[Socket] room:join error:', err.message);
      socket.emit('error:message', { error: 'Failed to join room.' });
    }
  });

  // ---------------------------------------------------------------------------
  // draw:element — Client sends a completed element to persist and broadcast.
  // Payload: { roomId, elementId, type, points, x, y, w, h, x2, y2, radius,
  //            text, fontSize, color, fillColor, width, tool }
  // ---------------------------------------------------------------------------
  socket.on('draw:element', async (data) => {
    try {
      const { roomId, elementId, type } = data;

      if (!roomId || !elementId || !type) {
        return socket.emit('error:message', {
          error: 'roomId, elementId, and type are required.',
        });
      }

      // Resolve the board
      const board = await Board.findOne({ roomId });
      if (!board) {
        return socket.emit('error:message', { error: `Board "${roomId}" not found.` });
      }

      // Auto-calculate order based on current element count
      const currentCount = await Stroke.countDocuments({ boardId: board._id });

      // Persist the element
      const element = await Stroke.create({
        boardId: board._id,
        userId: socket.user.userId,
        elementId: data.elementId,
        type: data.type,
        // Freehand
        points: data.points,
        // Shape position / size
        x: data.x,
        y: data.y,
        w: data.w,
        h: data.h,
        x2: data.x2,
        y2: data.y2,
        radius: data.radius,
        // Text
        text: data.text,
        fontSize: data.fontSize,
        // Styling
        color: data.color,
        fillColor: data.fillColor,
        width: data.width,
        tool: data.tool,
        // Ordering
        order: currentCount,
      });

      // Update the board's updatedAt timestamp
      await Board.updateOne({ _id: board._id }, { updatedAt: Date.now() });

      // Broadcast the element to everyone else in the room
      socket.to(roomId).emit('draw:element', element.toObject());

      console.log(`[Socket] Element "${elementId}" (${type}) added to room ${roomId}`);
    } catch (err) {
      console.error('[Socket] draw:element error:', err.message);
      socket.emit('error:message', { error: 'Failed to save element.' });
    }
  });

  // ---------------------------------------------------------------------------
  // draw:undo — Remove an element by its client-generated elementId.
  // Payload: { roomId, elementId }
  // ---------------------------------------------------------------------------
  socket.on('draw:undo', async ({ roomId, elementId }) => {
    try {
      if (!roomId || !elementId) {
        return socket.emit('error:message', { error: 'roomId and elementId are required.' });
      }

      const board = await Board.findOne({ roomId });
      if (!board) return;

      // Delete the element from the database
      await Stroke.findOneAndDelete({ boardId: board._id, elementId });

      // Broadcast the undo to everyone else in the room
      socket.to(roomId).emit('draw:undo', { elementId });

      console.log(`[Socket] Undo element "${elementId}" in room ${roomId}`);
    } catch (err) {
      console.error('[Socket] draw:undo error:', err.message);
      socket.emit('error:message', { error: 'Failed to undo element.' });
    }
  });

  // ---------------------------------------------------------------------------
  // draw:redo — Re-persist a previously undone element.
  // Payload: full element data including { roomId, elementId, type, ... }
  // ---------------------------------------------------------------------------
  socket.on('draw:redo', async (data) => {
    try {
      const { roomId, elementId, type } = data;

      if (!roomId || !elementId || !type) {
        return socket.emit('error:message', {
          error: 'roomId, elementId, and type are required for redo.',
        });
      }

      const board = await Board.findOne({ roomId });
      if (!board) return;

      // Re-calculate order
      const currentCount = await Stroke.countDocuments({ boardId: board._id });

      // Persist the element again
      const element = await Stroke.create({
        boardId: board._id,
        userId: socket.user.userId,
        elementId: data.elementId,
        type: data.type,
        points: data.points,
        x: data.x,
        y: data.y,
        w: data.w,
        h: data.h,
        x2: data.x2,
        y2: data.y2,
        radius: data.radius,
        text: data.text,
        fontSize: data.fontSize,
        color: data.color,
        fillColor: data.fillColor,
        width: data.width,
        tool: data.tool,
        order: currentCount,
      });

      // Broadcast the redo to everyone else in the room
      socket.to(roomId).emit('draw:redo', element.toObject());

      console.log(`[Socket] Redo element "${elementId}" in room ${roomId}`);
    } catch (err) {
      console.error('[Socket] draw:redo error:', err.message);
      socket.emit('error:message', { error: 'Failed to redo element.' });
    }
  });

  // ---------------------------------------------------------------------------
  // draw:clear — Delete ALL elements and sticky notes for the board.
  // Payload: { roomId }
  // ---------------------------------------------------------------------------
  socket.on('draw:clear', async ({ roomId }) => {
    try {
      if (!roomId) {
        return socket.emit('error:message', { error: 'roomId is required.' });
      }

      const board = await Board.findOne({ roomId });
      if (!board) {
        return socket.emit('error:message', { error: `Board "${roomId}" not found.` });
      }

      // Delete all elements and sticky notes for this board
      await Stroke.deleteMany({ boardId: board._id });
      await StickyNote.deleteMany({ boardId: board._id });

      // Update the board's updatedAt timestamp
      await Board.updateOne({ _id: board._id }, { updatedAt: Date.now() });

      // Broadcast clear event to everyone else in the room
      socket.to(roomId).emit('draw:clear', { roomId });

      console.log(`[Socket] Board ${roomId} cleared by "${socket.user.username}"`);
    } catch (err) {
      console.error('[Socket] draw:clear error:', err.message);
      socket.emit('error:message', { error: 'Failed to clear board.' });
    }
  });

  // ---------------------------------------------------------------------------
  // draw:live — Stream in-progress drawing to other clients (no persistence)
  // ---------------------------------------------------------------------------
  socket.on('draw:live', (data) => {
    const { roomId } = data;
    if (!roomId) return;
    socket.to(roomId).volatile.emit('draw:live', {
      ...data,
      userId: socket.user.userId,
    });
  });

  // ---------------------------------------------------------------------------
  // draw:done — Notify others that a live drawing is complete (clear preview)
  // ---------------------------------------------------------------------------
  socket.on('draw:done', ({ roomId, elementId }) => {
    if (!roomId) return;
    socket.to(roomId).emit('draw:done', { userId: socket.user.userId, elementId });
  });

  // ---------------------------------------------------------------------------
  // board:bgcolor — Change board background color
  // ---------------------------------------------------------------------------
  socket.on('board:bgcolor', async ({ roomId, bgColor }) => {
    try {
      if (!roomId || !bgColor) return;
      const board = await Board.findOne({ roomId });
      if (!board) return;
      board.bgColor = bgColor;
      await board.save();
      socket.to(roomId).emit('board:bgcolor', { bgColor });
      console.log(`[Socket] Board ${roomId} bgColor changed to ${bgColor}`);
    } catch (err) {
      console.error('[Socket] board:bgcolor error:', err.message);
    }
  });

  // ---------------------------------------------------------------------------
  // disconnect — Log when a user disconnects.
  // ---------------------------------------------------------------------------
  socket.on('disconnect', (reason) => {
    console.log(`[Socket] User "${socket.user.username}" disconnected (${reason})`);
  });
}

module.exports = drawHandler;
