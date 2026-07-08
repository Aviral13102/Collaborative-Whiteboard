/**
 * StickyNote Model
 *
 * Represents a draggable, editable sticky note on a whiteboard.
 * Each note stores its position (x, y), dimensions (w, h),
 * text content, and background color. Notes are scoped to a
 * board and owned by a user.
 */

const mongoose = require('mongoose');

const stickyNoteSchema = new mongoose.Schema({
  // ── Association ──────────────────────────────────────────────────────────
  boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Client-generated unique ID for real-time sync
  noteId: { type: String, required: true },

  // ── Position & size ──────────────────────────────────────────────────────
  x: { type: Number, required: true, default: 100 },
  y: { type: Number, required: true, default: 100 },
  w: { type: Number, default: 200 },
  h: { type: Number, default: 200 },

  // ── Content & appearance ─────────────────────────────────────────────────
  text: { type: String, default: '' },
  color: { type: String, default: '#fef08a' }, // default yellow
}, { timestamps: true });

module.exports = mongoose.model('StickyNote', stickyNoteSchema);
