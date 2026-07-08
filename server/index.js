/**
 * Collaborative Whiteboard — Server Entry Point
 * 
 * Sets up Express + Socket.io, connects to MongoDB, mounts REST routes,
 * and authenticates real-time socket connections via JWT.
 */

// ---------------------------------------------------------------------------
// 1. Load environment variables first (before any other import reads them)
// ---------------------------------------------------------------------------
require('dotenv').config();

const express = require('express');
const http = require('http');
const path = require('path');
const { Server: SocketIOServer } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');

// Route & handler imports
const authRoutes = require('./routes/auth');
const boardRoutes = require('./routes/boards');
const drawHandler = require('./sockets/drawHandler');
const cursorHandler = require('./sockets/cursorHandler');
const stickyNoteHandler = require('./sockets/stickyNoteHandler');
const chatHandler = require('./sockets/chatHandler');
const presenceHandler = require('./sockets/presenceHandler');

// ---------------------------------------------------------------------------
// 2. Configuration
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/whiteboard';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ---------------------------------------------------------------------------
// 3. Express app setup
// ---------------------------------------------------------------------------
const app = express();

// CORS — allow the frontend origin with credentials (cookies / auth headers)
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

// Parse JSON request bodies
app.use(express.json());

// Health-check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount REST API routes
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);

// ---------------------------------------------------------------------------
// 3b. Serve static client build in production (Docker)
// ---------------------------------------------------------------------------
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

// ---------------------------------------------------------------------------
// 4. HTTP server + Socket.io
// ---------------------------------------------------------------------------
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ---------------------------------------------------------------------------
// 5. Socket.io authentication middleware
//    Verifies the JWT sent via socket.handshake.auth.token before allowing
//    the connection. Attaches the decoded user info to `socket.user`.
// ---------------------------------------------------------------------------
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error('Authentication required. No token provided.'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = { userId: decoded.userId, username: decoded.username };
    next();
  } catch (err) {
    return next(new Error('Invalid or expired token.'));
  }
});

// Register per-connection event handlers
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.user.username} (${socket.id})`);
  drawHandler(io, socket);
  cursorHandler(io, socket);
  stickyNoteHandler(io, socket);
  chatHandler(io, socket);
  presenceHandler(io, socket);
});

// ---------------------------------------------------------------------------
// 6. MongoDB connection + server start
// ---------------------------------------------------------------------------
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('[MongoDB] Connected successfully');

    server.listen(PORT, () => {
      console.log(`[Server] Running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[MongoDB] Connection error:', err.message);
    process.exit(1);
  });

// ---------------------------------------------------------------------------
// 7. Graceful shutdown
// ---------------------------------------------------------------------------
function gracefulShutdown(signal) {
  console.log(`\n[Server] ${signal} received — shutting down gracefully…`);

  // Stop accepting new connections
  server.close(async () => {
    try {
      await mongoose.connection.close();
      console.log('[MongoDB] Connection closed');
    } catch (err) {
      console.error('[MongoDB] Error closing connection:', err.message);
    }
    console.log('[Server] Shutdown complete');
    process.exit(0);
  });

  // Force-kill if graceful shutdown takes too long (10 s)
  setTimeout(() => {
    console.error('[Server] Forced shutdown after timeout');
    process.exit(1);
  }, 10_000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
