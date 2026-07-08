/**
 * Board Model — Phase 3
 *
 * Represents a collaborative whiteboard room. Each board has a unique
 * nanoid-based roomId used for shareable invite links and Socket.io rooms.
 * Includes a collaborators array with role-based access control.
 */

const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

// ---------------------------------------------------------------------------
// Sub-schema: each collaborator entry tracks the user, their role, and
// when they were added to the board.
// ---------------------------------------------------------------------------
const collaboratorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['owner', 'editor', 'viewer'], default: 'editor' },
  addedAt: { type: Date, default: Date.now },
}, { _id: false });

// ---------------------------------------------------------------------------
// Main board schema
// ---------------------------------------------------------------------------
const boardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, default: 'Untitled Board' },
    roomId: { type: String, required: true, unique: true, index: true, default: () => nanoid(12) },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    collaborators: [collaboratorSchema],
    lastSavedAt: { type: Date, default: Date.now },
    bgColor: { type: String, default: '#1a1a2e' },
  },
  { timestamps: true }
);

// ---------------------------------------------------------------------------
// Helper: check if a userId has a given role (or higher)
// Returns 'owner', 'editor', 'viewer', or null if not found.
// ---------------------------------------------------------------------------
boardSchema.methods.getUserRole = function (userId) {
  const uid = userId.toString();
  if (this.owner.toString() === uid) return 'owner';
  const collab = this.collaborators.find((c) => c.user.toString() === uid);
  return collab ? collab.role : null;
};

// ---------------------------------------------------------------------------
// Helper: check if a user can edit the board (owner or editor role)
// ---------------------------------------------------------------------------
boardSchema.methods.canEdit = function (userId) {
  const role = this.getUserRole(userId);
  return role === 'owner' || role === 'editor';
};

module.exports = mongoose.model('Board', boardSchema);
