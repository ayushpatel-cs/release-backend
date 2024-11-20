const express = require('express');
const { User } = require('../models');
const { generateToken, hashPassword, comparePassword } = require('../utils/auth');
const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'There is already an account associated with this email. Please login' });
    }

    // Create new user
    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      email,
      password_hash: hashedPassword,
      name,
      phone_number: phone,
      verified_status: 'unverified'
    });
    
    // Generate token
    const token = generateToken(user);

    // Remove password_hash from response
    const userResponse = user.toJSON();
    delete userResponse.password_hash;

    res.status(201).json({
      user: userResponse,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Error creating user' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const validPassword = await comparePassword(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user);

    // Remove password_hash from response
    const userResponse = user.toJSON();
    delete userResponse.password_hash;

    res.json({
      user: userResponse,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error during login' });
  }
});

// Verify phone/email
router.post('/verify', async (req, res) => {
  try {
    const { type, code } = req.body;
    const userId = req.user.id; // From auth middleware

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // In a real application, you would verify the code against a stored verification code
    // This is a simplified example
    const isValidCode = code === '123456'; // Replace with actual verification logic

    if (!isValidCode) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Update user verification status
    let newStatus = user.verified_status;
    if (type === 'email') {
      newStatus = newStatus === 'phone_verified' ? 'fully_verified' : 'email_verified';
    } else if (type === 'phone') {
      newStatus = newStatus === 'email_verified' ? 'fully_verified' : 'phone_verified';
    }

    await user.update({ verified_status: newStatus });

    res.json({ verified: true });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Error during verification' });
  }
});

module.exports = router; 