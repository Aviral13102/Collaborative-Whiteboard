/**
 * Presence Socket Handler — Phase 3
 *
 * Tracks which users are active in each board room using an in-memory Map.
 * Broadcasts a de-duplicated user list on join/disconnect so the client
 * can render an "active users" indicator.
 *
 * Structure: roomId -> Map<socketId, { userId, username }>
 */

// In-memory presence tracker: roomId -> Map<socketId, { userId, username }>
const roomPresence = new Map();

module.exports = function presenceHandler(io, socket) {
  // -------------------------------------------------------------------------
  // presence:join — user announces they've entered a room
  // -------------------------------------------------------------------------
  socket.on('presence:join', ({ roomId }) => {
    if (!roomPresence.has(roomId)) {
      roomPresence.set(roomId, new Map());
    }
    roomPresence.get(roomId).set(socket.id, {
      userId: socket.user.userId,
      username: socket.user.username,
    });

    // Broadcast updated presence list to all in room
    const users = Array.from(roomPresence.get(roomId).values());
    // De-duplicate by userId (same user might have multiple tabs)
    const unique = Object.values(
      users.reduce((acc, u) => { acc[u.userId] = u; return acc; }, {})
    );
    io.to(roomId).emit('presence:update', unique);
    console.log(`[Presence] ${socket.user.username} joined ${roomId} (${unique.length} users)`);
  });

  // -------------------------------------------------------------------------
  // disconnect — clean up from all rooms this socket was in
  // -------------------------------------------------------------------------
  socket.on('disconnect', () => {
    // Remove from all rooms
    for (const [roomId, members] of roomPresence.entries()) {
      if (members.has(socket.id)) {
        members.delete(socket.id);
        const users = Array.from(members.values());
        const unique = Object.values(
          users.reduce((acc, u) => { acc[u.userId] = u; return acc; }, {})
        );
        io.to(roomId).emit('presence:update', unique);
        console.log(`[Presence] ${socket.user.username} left ${roomId} (${unique.length} users)`);
        if (members.size === 0) {
          roomPresence.delete(roomId);
        }
      }
    }
  });
};
