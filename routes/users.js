const express = require('express');
const router = express.Router();
const { User, Property, Bid, Review, PropertyImage } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { uploadProfileImage } = require('../utils/upload');

// Serve static files from the uploads directory
const app = express();
app.use('/uploads', express.static('uploads'));

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
    // Add debug logging
    console.log('Token user:', req.user);
    console.log('Requested user ID:', req.params.id);
    console.log('Token user ID type:', typeof req.user.id);
    console.log('Params ID type:', typeof req.params.id);
    
    if (req.user.id !== parseInt(req.params.id)) {
      console.log('Authorization failed:');
      console.log('Token user ID:', req.user.id);
      console.log('Requested user ID:', parseInt(req.params.id));
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

router.put('/profile/image', authenticateToken, uploadProfileImage, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    console.log('Uploaded file:', req.file);
    
    // Construct the URL using BACKEND_URL from environment variables
    const imageUrl = `${process.env.BACKEND_URL}/uploads/${req.file.filename}`;
    console.log('Image URL:', imageUrl);

    const user = await User.findByPk(req.user.id);
    await user.update({
      profile_image_url: imageUrl
    });

    console.log('Updated user:', user.profile_image_url);
    res.json({ profile_image_url: user.profile_image_url });
  } catch (error) {
    console.error('Profile image update error:', error);
    res.status(500).json({ error: 'Error updating profile image' });
  }
});

router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      bio,
      phone,
      location,
      languages,
      occupation,
      education,
      pets_preference,
      profile_image_url
    } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({
      name,
      bio,
      phone,
      location,
      languages,
      occupation,
      education,
      pets_preference,
      profile_image_url
    });

    const userData = user.toJSON();
    delete userData.password_hash;
    
    res.json(userData);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Error updating profile' });
  }
});

module.exports = router;
