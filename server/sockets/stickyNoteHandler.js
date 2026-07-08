/**
 * Sticky Note Handler (Socket.io)
 *
 * Manages real-time sticky note CRUD operations for collaborative
 * whiteboard rooms. Each operation is persisted to MongoDB and
 * broadcast to all other participants in the room.
 */

const Board = require('../models/Board');
const StickyNote = require('../models/StickyNote');

/**
 * Registers sticky-note-related Socket.io event handlers on the given socket.
 *
 * @param {import('socket.io').Server} io   - The Socket.io server instance
 * @param {import('socket.io').Socket} socket - The connected client socket
 */
module.exports = function stickyNoteHandler(io, socket) {
  // ---------------------------------------------------------------------------
  // note:create — Create a new sticky note and broadcast it to the room.
  // Payload: { roomId, noteId, x, y, w, h, text, color }
  // ---------------------------------------------------------------------------
  socket.on('note:create', async ({ roomId, noteId, x, y, w, h, text, color }) => {
    try {
      if (!roomId || !noteId) {
        return socket.emit('error:message', { error: 'roomId and noteId are required.' });
      }

      // Resolve the board
      const board = await Board.findOne({ roomId });
      if (!board) {
        return socket.emit('error:message', { error: `Board "${roomId}" not found.` });
      }

      // Persist the sticky note
      const note = await StickyNote.create({
        boardId: board._id,
        userId: socket.user.userId,
        noteId,
        x: x ?? 100,
        y: y ?? 100,
        w: w ?? 200,
        h: h ?? 200,
        text: text ?? '',
        color: color ?? '#fef08a',
      });

      // Broadcast to everyone else in the room
      socket.to(roomId).emit('note:create', note.toObject());

      console.log(`[Socket] Sticky note "${noteId}" created in room ${roomId}`);
    } catch (err) {
      console.error('[Socket] note:create error:', err.message);
      socket.emit('error:message', { error: 'Failed to create sticky note.' });
    }
  });

  // ---------------------------------------------------------------------------
  // note:update — Update an existing sticky note (position, text, color, size).
  // Payload: { roomId, noteId, ...updates }
  // ---------------------------------------------------------------------------
  socket.on('note:update', async (data) => {
    try {
      const { roomId, noteId, ...updates } = data;

      if (!roomId || !noteId) {
        return socket.emit('error:message', { error: 'roomId and noteId are required.' });
      }

      // Resolve the board
      const board = await Board.findOne({ roomId });
      if (!board) {
        return socket.emit('error:message', { error: `Board "${roomId}" not found.` });
      }

      // Update only the provided fields
      const note = await StickyNote.findOneAndUpdate(
        { boardId: board._id, noteId },
        { $set: updates },
        { new: true }
      );

      if (!note) {
        return socket.emit('error:message', { error: `Sticky note "${noteId}" not found.` });
      }

      // Broadcast the updated note to everyone else in the room
      socket.to(roomId).emit('note:update', note.toObject());

      console.log(`[Socket] Sticky note "${noteId}" updated in room ${roomId}`);
    } catch (err) {
      console.error('[Socket] note:update error:', err.message);
      socket.emit('error:message', { error: 'Failed to update sticky note.' });
    }
  });

  // ---------------------------------------------------------------------------
  // note:delete — Delete a sticky note from the DB and broadcast removal.
  // Payload: { roomId, noteId }
  // ---------------------------------------------------------------------------
  socket.on('note:delete', async ({ roomId, noteId }) => {
    try {
      if (!roomId || !noteId) {
        return socket.emit('error:message', { error: 'roomId and noteId are required.' });
      }

      // Resolve the board
      const board = await Board.findOne({ roomId });
      if (!board) {
        return socket.emit('error:message', { error: `Board "${roomId}" not found.` });
      }

      // Delete the sticky note
      await StickyNote.findOneAndDelete({ boardId: board._id, noteId });

      // Broadcast removal to everyone else in the room
      socket.to(roomId).emit('note:delete', { noteId });

      console.log(`[Socket] Sticky note "${noteId}" deleted from room ${roomId}`);
    } catch (err) {
      console.error('[Socket] note:delete error:', err.message);
      socket.emit('error:message', { error: 'Failed to delete sticky note.' });
    }
  });
};
