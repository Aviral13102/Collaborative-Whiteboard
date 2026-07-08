/**
 * ChatMessage Model — Phase 3
 *
 * Stores chat messages associated with a specific board.
 * Each message records the sender's userId/username and the message text.
 * Indexed on boardId for efficient history queries.
 */

const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  message: { type: String, required: true, maxlength: 1000 },
}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
