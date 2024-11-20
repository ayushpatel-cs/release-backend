const express = require('express');
const router = express.Router();
const { Bid, Property, User, PropertyImage, Sequelize: { Op } } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// Add validation middleware
const validateBid = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const property_id = req.params.id;

    console.log(`Validating bid - Property ID: ${property_id}, Amount: ${amount}`);

    // Verify property exists and is active
    const property = await Property.findByPk(property_id);
    if (!property || property.status !== 'active') {
      console.log('Validation Failed: Invalid property or auction ended');
      return res.status(400).json({ error: 'Invalid property or auction ended' });
    }

    // Check if auction has ended
    if (property.auction_end_date && new Date(property.auction_end_date) < new Date()) {
      return res.status(400).json({ error: 'Auction has ended' });
    }

    // Get highest current bid
    const highestBid = await Bid.findOne({
      where: { property_id, status: 'active' },
      order: [['amount', 'DESC']]
    });

    // Validate bid amount
    if (!amount || amount < property.min_price) {
      console.log(`Validation Failed: Bid amount ${amount} is less than minimum required ${property.min_price}`);
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
    console.error('Validation Middleware Error:', error);
    next(error);
  }
};

// Place new bid
router.post('/properties/:id/bids', authenticateToken, validateBid, async (req, res) => {
  try {
    const { amount } = req.body;
    const property_id = req.params.id;

    console.log('Received bid:', { 
      amount, 
      property_id, 
      user_id: req.user.id 
    });

    // Check if user already has an active bid
    const existingBid = await Bid.findOne({
      where: {
        property_id,
        bidder_id: req.user.id,
        status: 'active'
      }
    });

    let bid;
    if (existingBid) {
      // Update existing bid
      bid = await existingBid.update({ amount });
    } else {
      // Create new bid
      bid = await Bid.create({
        property_id,
        bidder_id: req.user.id,
        amount,
        status: 'active'
      });
    }

    // Fetch bid details with limited associations to avoid circular references
    const bidWithDetails = await Bid.findByPk(bid.id, {
      include: [
        {
          model: User,
          as: 'bidder',
          attributes: ['id', 'name', 'profile_image_url']
        }
      ]
    });

    // Separately fetch property details if needed
    const property = await Property.findByPk(property_id, {
      attributes: ['id', 'title', 'min_price'],
      include: [{
        model: PropertyImage,
        as: 'images',
        limit: 1,
        attributes: ['image_url']
      }]
    });

    // Combine the data
    const response = {
      ...bidWithDetails.toJSON(),
      property: property ? {
        id: property.id,
        title: property.title,
        min_price: property.min_price,
        image: property.images?.[0]?.image_url
      } : null
    };

    res.status(existingBid ? 200 : 201).json(response);
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
