const express = require('express');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User } = require('../models');

const router = express.Router();

function sanitizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
  };
}

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

router.post('/register', async (req, res) => {
  try {
    const username = sanitizeText(req.body.username);
    const email = sanitizeText(req.body.email).toLowerCase();
    const password = sanitizeText(req.body.password);

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required.' });
    }

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(409).json({ message: 'A user with this email or username already exists.' });
    }

    const user = await User.create({ username, email, password });
    const token = generateToken(user);

    return res.status(201).json({
      message: 'Registration successful.',
      token,
      user: publicUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Registration failed.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = sanitizeText(req.body.email).toLowerCase();
    const password = sanitizeText(req.body.password);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = generateToken(user);

    return res.json({
      message: 'Login successful.',
      token,
      user: publicUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed.' });
  }
});

router.post('/logout', (req, res) => {
  return res.json({ message: 'Logout successful. Remove the token on the client.' });
});

module.exports = router;
