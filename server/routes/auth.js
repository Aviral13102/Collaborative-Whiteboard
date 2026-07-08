/**
 * Auth Routes
 * 
 * Handles user registration and login. Issues JWTs with a 7-day
 * expiry containing { userId, username } claims.
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

const JWT_EXPIRY = '7d';

// ---------------------------------------------------------------------------
// Helper — generate a signed JWT for the given user.
// ---------------------------------------------------------------------------
function generateToken(user) {
  return jwt.sign(
    { userId: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

// ---------------------------------------------------------------------------
// POST /api/auth/register
// Body: { username, email, password }
// ---------------------------------------------------------------------------
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // --- Input validation ---------------------------------------------------
    if (!username || username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // --- Check for existing user --------------------------------------------
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.trim() }],
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'Email' : 'Username';
      return res.status(409).json({ error: `${field} is already registered.` });
    }

    // --- Create user (virtual password setter triggers bcrypt in pre-save) ---
    const user = new User({
      username: username.trim(),
      email,
    });
    user.password = password; // triggers virtual setter
    await user.save();

    // --- Issue JWT -----------------------------------------------------------
    const token = generateToken(user);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    // Handle Mongoose duplicate-key errors that slip past the manual check
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Username or email already exists.' });
    }
    console.error('[Auth] Registration error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// Body: { email, password }
// ---------------------------------------------------------------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // --- Find user by email --------------------------------------------------
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // --- Compare password ----------------------------------------------------
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // --- Issue JWT -----------------------------------------------------------
    const token = generateToken(user);

    return res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
