const express = require('express');
const router = express.Router();
const { Property, PropertyImage, User, sequelize, Sequelize: { Op } } = require('../models');

router.get('/', async (req, res) => {
  try {
    const {
      q,
      filters = {},
      sort = 'price_asc',
      page = 1,
      limit = 10
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Build where clause
    const whereClause = {
      status: 'active'
    };

    // Text search
    if (q) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
        { address: { [Op.iLike]: `%${q}%` } }
      ];
    }

    // Price range filter
    if (filters.price_range) {
      whereClause.min_price = {
        [Op.between]: filters.price_range
      };
    }

    // Date range filter
    if (filters.date_range) {
      whereClause.start_date = { [Op.gte]: filters.date_range[0] };
      whereClause.end_date = { [Op.lte]: filters.date_range[1] };
    }

    // Location filter
    if (filters.location) {
      const { latitude, longitude, radius } = filters.location;
      whereClause[Op.and] = sequelize.literal(
        `ST_DWithin(
          ST_MakePoint(longitude, latitude)::geography,
          ST_MakePoint(${longitude}, ${latitude})::geography,
          ${radius * 1000}
        )`
      );
    }

    // Sort options
    const sortOptions = {
      price_asc: [['min_price', 'ASC']],
      price_desc: [['min_price', 'DESC']],
      date_asc: [['created_at', 'ASC']],
      date_desc: [['created_at', 'DESC']]
    };

    const { rows: properties, count } = await Property.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: PropertyImage,
          as: 'images',
          limit: 1
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'profile_image_url']
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: sortOptions[sort] || sortOptions.price_asc
    });

    res.json({
      properties,
      total: count,
      page: parseInt(page),
      total_pages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Error performing search' });
  }
});

module.exports = router;