/**
 * Element Model (backward-compatible name: "Stroke")
 *
 * A generalized canvas element schema that supports multiple element types:
 *   - stroke  : freehand drawing (points array)
 *   - rect    : rectangle (x, y, w, h)
 *   - circle  : circle (x, y, radius)
 *   - line    : straight line (x, y → x2, y2)
 *   - text    : text label (x, y, text, fontSize)
 *
 * Each element carries common styling (color, fillColor, width) and an
 * `order` field used for deterministic z-ordering on the canvas.
 * The model name remains "Stroke" so existing DB collections and
 * references continue to work without migration.
 */

const mongoose = require('mongoose');

const elementSchema = new mongoose.Schema({
  // ── Association ──────────────────────────────────────────────────────────
  boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Client-generated unique ID used for undo / redo targeting
  elementId: { type: String, required: true },

  // Discriminator for rendering logic on the client
  type: {
    type: String,
    enum: ['stroke', 'rect', 'circle', 'line', 'text'],
    required: true,
    default: 'stroke',
  },

  // ── Freehand stroke data ─────────────────────────────────────────────────
  points: [{ x: Number, y: Number }],

  // ── Shape positional data ────────────────────────────────────────────────
  x: Number,
  y: Number,
  w: Number,
  h: Number,
  x2: Number,  // line endpoint x
  y2: Number,  // line endpoint y
  radius: Number,

  // ── Text data ────────────────────────────────────────────────────────────
  text: String,
  fontSize: { type: Number, default: 16 },

  // ── Common styling ───────────────────────────────────────────────────────
  color: { type: String, default: '#ffffff' },
  fillColor: { type: String, default: '' },
  width: { type: Number, default: 2 },
  tool: { type: String, default: 'pen' },

  // ── Ordering (z-index on canvas) ─────────────────────────────────────────
  order: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Stroke', elementSchema);
