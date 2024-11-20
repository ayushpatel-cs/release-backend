const express = require('express');
const router = express.Router();
const { Bid, Property, User, PropertyImage, Sequelize: { Op } } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// Validation middleware
const validateBid = async (req, res, next) => {
  try {
    const { amount, start_date, end_date } = req.body;
    const property_id = req.params.id;

    // Basic validation
    if (!amount || !start_date || !end_date) {
      return res.status(400).json({ 
        error: 'Amount, start date, and end date are required' 
      });
    }

    // Verify property exists
    const property = await Property.findOne({
      where: {
        id: property_id,
        status: 'active'
      }
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found or not active' });
    }

    // Convert and validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const now = new Date();

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // Validate amount
    const bidAmount = parseFloat(amount);
    if (isNaN(bidAmount) || bidAmount < property.min_price) {
      return res.status(400).json({ 
        error: `Bid amount must be at least ${property.min_price}` 
      });
    }

    // Check date constraints
    if (startDate < now) {
      return res.status(400).json({ error: 'Start date must be in the future' });
    }

    if (endDate <= startDate) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    // Check for overlapping bids from the same user
    const existingBids = await Bid.findAll({
      where: {
        property_id,
        bidder_id: req.user.id,
        status: 'active',
        [Op.or]: [
          {
            start_date: { [Op.between]: [startDate, endDate] }
          },
          {
            end_date: { [Op.between]: [startDate, endDate] }
          },
          {
            [Op.and]: [
              { start_date: { [Op.lte]: startDate } },
              { end_date: { [Op.gte]: endDate } }
            ]
          }
        ]
      }
    });

    if (existingBids.length > 0) {
      return res.status(400).json({ 
        error: 'You already have an active bid for this date range' 
      });
    }

    // Store validated data
    req.bidData = {
      property,
      startDate,
      endDate,
      amount: bidAmount
    };

    next();
  } catch (error) {
    console.error('Bid validation error:', error);
    res.status(500).json({ 
      error: 'Error validating bid',
      details: error.message 
    });
  }
};

// Create bid
router.post('/properties/:id/bids', authenticateToken, validateBid, async (req, res) => {
  try {
    const { property, startDate, endDate, amount } = req.bidData;

    const bid = await Bid.create({
      property_id: property.id,
      bidder_id: req.user.id,
      amount,
      start_date: startDate,
      end_date: endDate,
      status: 'active'
    });

    const bidWithDetails = await Bid.findOne({
      where: { id: bid.id },
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
    res.status(500).json({ 
      error: 'Error creating bid',
      details: error.message 
    });
  }
});

// Get bids for property
router.get('/properties/:id/bids', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const whereClause = { 
      property_id: req.params.id,
      status: 'active'
    };

    if (start_date && end_date) {
      whereClause[Op.or] = [
        {
          start_date: { [Op.between]: [start_date, end_date] }
        },
        {
          end_date: { [Op.between]: [start_date, end_date] }
        },
        {
          [Op.and]: [
            { start_date: { [Op.lte]: start_date } },
            { end_date: { [Op.gte]: end_date } }
          ]
        }
      ];
    }

    const bids = await Bid.findAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'bidder',
        attributes: ['id', 'name', 'profile_image_url']
      }],
      order: [['amount', 'DESC'], ['created_at', 'DESC']]
    });

    res.json({
      bids,
      highest_bid: bids[0]?.amount || 0,
      bid_count: bids.length
    });
  } catch (error) {
    console.error('Bid fetch error:', error);
    res.status(500).json({ error: 'Error fetching bids' });
  }
});

// Get user's active bids
router.get('/my-bids', authenticateToken, async (req, res) => {
  try {
    const bids = await Bid.findAll({
      where: {
        bidder_id: req.user.id,
        status: 'active'
      },
      include: [
        {
          model: Property,
          include: [{
            model: PropertyImage,
            as: 'images',
            limit: 1
          }]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(bids);
  } catch (error) {
    console.error('My bids fetch error:', error);
    res.status(500).json({ error: 'Error fetching your bids' });
  }
});

// Withdraw a bid
router.post('/bids/:id/withdraw', authenticateToken, async (req, res) => {
  try {
    const bid = await Bid.findByPk(req.params.id);
    
    if (!bid || bid.bidder_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (bid.status !== 'active') {
      return res.status(400).json({ error: 'Can only withdraw active bids' });
    }

    await bid.update({ status: 'withdrawn' });
    res.json({ message: 'Bid withdrawn successfully' });
  } catch (error) {
    console.error('Bid withdrawal error:', error);
    res.status(500).json({ error: 'Error withdrawing bid' });
  }
});

// Select winning bid
router.post('/properties/:id/select-winner', authenticateToken, async (req, res) => {
  try {
    const { bid_id } = req.body;
    const property_id = req.params.id;

    const property = await Property.findByPk(property_id);
    if (!property || property.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const winning_bid = await Bid.findByPk(bid_id);
    if (!winning_bid || winning_bid.property_id !== parseInt(property_id)) {
      return res.status(400).json({ error: 'Invalid bid' });
    }

    await winning_bid.update({ status: 'won' });
    await property.update({ status: 'ended' });

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
