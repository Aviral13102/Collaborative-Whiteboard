/**
 * User Model
 * 
 * Mongoose schema for application users with secure password hashing.
 * Uses a virtual 'password' setter to transparently hash passwords
 * via bcryptjs before persistence — the plain password is never stored.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ---------------------------------------------------------------------------
// Virtual setter: allows `user.password = 'plaintext'` which stores the
// plain value temporarily in `_password` so the pre-save hook can hash it.
// ---------------------------------------------------------------------------
userSchema.virtual('password').set(function (value) {
  this._password = value;
});

// ---------------------------------------------------------------------------
// Pre-save hook — hash the password only when it has been set / changed.
// ---------------------------------------------------------------------------
userSchema.pre('validate', async function () {
  // Only hash if the virtual password was explicitly set
  if (!this._password) return;

  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  this.passwordHash = await bcrypt.hash(this._password, salt);
  this._password = undefined; // clear temporary plain value
});

// ---------------------------------------------------------------------------
// Instance method: compare a candidate password against the stored hash.
// ---------------------------------------------------------------------------
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
