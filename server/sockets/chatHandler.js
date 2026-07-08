/**
 * Chat Socket Handler — Phase 3
 *
 * Handles real-time chat within a board room:
 *   - chat:send   — receives a message, persists it, and broadcasts to the room
 *   - chat:history — loads the last 50 messages for a room on demand
 */

const Board = require('../models/Board');
const ChatMessage = require('../models/ChatMessage');

module.exports = function chatHandler(io, socket) {
  // -------------------------------------------------------------------------
  // chat:send — receive { roomId, message }, persist to DB, broadcast to room
  // -------------------------------------------------------------------------
  socket.on('chat:send', async ({ roomId, message }) => {
    try {
      if (!message || !message.trim()) return;

      const board = await Board.findOne({ roomId });
      if (!board) return;

      // Create and persist the chat message
      const msg = await ChatMessage.create({
        boardId: board._id,
        userId: socket.user.userId,
        username: socket.user.username,
        message: message.trim().slice(0, 1000),
      });

      // Broadcast the message to everyone in the room (including sender)
      io.to(roomId).emit('chat:message', {
        _id: msg._id,
        userId: msg.userId,
        username: msg.username,
        message: msg.message,
        createdAt: msg.createdAt,
      });
    } catch (err) {
      console.error('[Chat] Send error:', err.message);
    }
  });

  // -------------------------------------------------------------------------
  // chat:history — load the last 50 messages for a room, oldest-first
  // -------------------------------------------------------------------------
  socket.on('chat:history', async ({ roomId }) => {
    try {
      const board = await Board.findOne({ roomId });
      if (!board) return;

      // Fetch newest 50 messages, then reverse so oldest is first
      const messages = await ChatMessage.find({ boardId: board._id })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      socket.emit('chat:history', messages.reverse());
    } catch (err) {
      console.error('[Chat] History error:', err.message);
    }
  });
};
