/**
 * Cursor Handler (Socket.io)
 *
 * Broadcasts live cursor positions to other participants in a room.
 * Uses volatile emits so dropped packets are silently discarded —
 * cursor data is ephemeral and only the latest position matters.
 */

/**
 * Registers cursor-related Socket.io event handlers on the given socket.
 *
 * @param {import('socket.io').Server} io   - The Socket.io server instance
 * @param {import('socket.io').Socket} socket - The connected client socket
 */
module.exports = function cursorHandler(io, socket) {
  // ---------------------------------------------------------------------------
  // cursor:move — Broadcast the user's cursor position to others in the room.
  // Payload: { roomId, x, y }
  // ---------------------------------------------------------------------------
  socket.on('cursor:move', ({ roomId, x, y }) => {
    if (!roomId) return;

    // Volatile emit — if a packet is dropped it won't be queued or retried,
    // which is ideal for high-frequency cursor updates
    socket.to(roomId).volatile.emit('cursor:move', {
      userId: socket.user.userId,
      username: socket.user.username,
      x,
      y,
    });
  });

  // ---------------------------------------------------------------------------
  // cursor:leave — Notify others that the user's cursor has left the canvas.
  // Payload: { roomId }
  // ---------------------------------------------------------------------------
  socket.on('cursor:leave', ({ roomId }) => {
    if (!roomId) return;

    socket.to(roomId).emit('cursor:leave', {
      userId: socket.user.userId,
    });
  });
};
