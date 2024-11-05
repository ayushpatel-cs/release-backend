const express = require('express');
const router = express.Router();
const { User, Property, Bid, Review } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { uploadProfileImage } = require('../utils/upload');

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password_hash'] },
      include: [{
        model: Review,
        as: 'receivedReviews',
        include: [{
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name', 'profile_image_url']
        }]
      }]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({ error: 'Error fetching user profile' });
  }
});

// Update user profile
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { name, phone, bio } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({ name, phone_number: phone, bio });
    
    const updatedUser = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password_hash'] }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Error updating profile' });
  }
});

// Get user's listings
router.get('/:id/properties', async (req, res) => {
  try {
    const properties = await Property.findAll({
      where: { user_id: req.params.id },
      include: [{
        model: PropertyImage,
        as: 'images',
        limit: 1
      }],
      order: [['created_at', 'DESC']]
    });

    const active_listings = properties.filter(p => p.status === 'active');
    const past_listings = properties.filter(p => p.status !== 'active');

    res.json({ active_listings, past_listings });
  } catch (error) {
    console.error('Listings fetch error:', error);
    res.status(500).json({ error: 'Error fetching user listings' });
  }
});

// Get user's bid history
router.get('/:id/bids', authenticateToken, async (req, res) => {
  try {
    if (req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const bids = await Bid.findAll({
      where: { bidder_id: req.params.id },
      include: [{
        model: Property,
        include: [{
          model: PropertyImage,
          as: 'images',
          limit: 1
        }]
      }],
      order: [['created_at', 'DESC']]
    });

    const active_bids = bids.filter(b => b.status === 'active');
    const won_bids = bids.filter(b => b.status === 'won');
    const lost_bids = bids.filter(b => b.status === 'withdrawn');

    res.json({ active_bids, won_bids, lost_bids });
  } catch (error) {
    console.error('Bids fetch error:', error);
    res.status(500).json({ error: 'Error fetching bid history' });
  }
});

// Upload profile image
router.post('/:id/profile-image', authenticateToken, uploadProfileImage, async (req, res) => {
  try {
    if (req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const user = await User.findByPk(req.params.id);
    await user.update({ profile_image_url: req.file.location });

    res.json({ profile_image_url: req.file.location });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Error uploading profile image' });
  }
});

module.exports = router;