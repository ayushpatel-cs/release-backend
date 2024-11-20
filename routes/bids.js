const express = require('express');
const router = express.Router();
const { Bid, Property, User, Sequelize: { Op } } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// Add validation middleware
const validateBid = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const property_id = req.params.id;

    // Verify property exists and is active
    const property = await Property.findByPk(property_id);
    if (!property || property.status !== 'active') {
      return res.status(400).json({ error: 'Invalid property or auction ended' });
    }

    // Get highest current bid
    const highestBid = await Bid.findOne({
      where: { property_id, status: 'active' },
      order: [['amount', 'DESC']]
    });

    // Validate bid amount
    if (!amount || amount < property.min_price) {
      return res.status(400).json({ 
        error: `Bid must be at least $${property.min_price}` 
      });
    }

    // Add validated data to request
    req.validatedBid = {
      property,
      highestBid
    };

    next();
  } catch (error) {
    next(error);
  }
};

// Place new bid
router.post('/properties/:id/bids', authenticateToken, validateBid, async (req, res) => {
  try {
    const { amount } = req.body;
    const property_id = req.params.id;

    // Check if user already has an active bid
    const existingBid = await Bid.findOne({
      where: {
        property_id,
        bidder_id: req.user.id,
        status: 'active'
      }
    });

    if (existingBid) {
      // Update existing bid
      await existingBid.update({ amount });
      return res.status(200).json(existingBid);
    }

    // Create new bid
    const bid = await Bid.create({
      property_id,
      bidder_id: req.user.id,
      amount,
      status: 'active'
    });

    // Include bidder information in response
    const bidWithDetails = await Bid.findByPk(bid.id, {
      include: [
        {
          model: User,
          as: 'bidder',
          attributes: ['id', 'name', 'profile_image_url']
        },
        {
          model: Property,
          include: [{
            model: PropertyImage,
            as: 'images',
            limit: 1
          }]
        }
      ]
    });

    res.status(201).json(bidWithDetails);
  } catch (error) {
    console.error('Bid creation error:', error);
    res.status(500).json({ error: 'Error placing bid' });
  }
});

// Get bid history/order book
router.get('/properties/:id/bids', async (req, res) => {
  try {
    const bids = await Bid.findAll({
      where: { 
        property_id: req.params.id,
        status: 'active'
      },
      include: [{
        model: User,
        as: 'bidder',
        attributes: ['id', 'name', 'profile_image_url']
      }],
      order: [['amount', 'DESC']]
    });

    const highest_bid = bids[0]?.amount || 0;
    const bid_count = bids.length;

    res.json({
      bids,
      highest_bid,
      bid_count
    });
  } catch (error) {
    console.error('Bid fetch error:', error);
    res.status(500).json({ error: 'Error fetching bids' });
  }
});

// Select winning bid
router.post('/properties/:id/select-winner', authenticateToken, async (req, res) => {
  try {
    const { bid_id } = req.body;
    const property_id = req.params.id;

    // Verify property ownership
    const property = await Property.findByPk(property_id);
    if (!property || property.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update winning bid
    const winning_bid = await Bid.findByPk(bid_id);
    if (!winning_bid || winning_bid.property_id !== parseInt(property_id)) {
      return res.status(400).json({ error: 'Invalid bid' });
    }

    await winning_bid.update({ status: 'won' });
    await property.update({ status: 'ended' });

    // Update all other bids to withdrawn
    await Bid.update(
      { status: 'withdrawn' },
      { 
        where: { 
          property_id,
          id: { [Op.ne]: bid_id },
          status: 'active'
        }
      }
    );

    res.json({ selected_bid: winning_bid });
  } catch (error) {
    console.error('Winner selection error:', error);
    res.status(500).json({ error: 'Error selecting winner' });
  }
});

module.exports = router;