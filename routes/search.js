const express = require('express');
const router = express.Router();
const { Property, PropertyImage, User, sequelize, Sequelize: { Op } } = require('../models');
const geocodingClient = require('../utils/geocoding');

router.get('/', async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      radius = 10,
      min_price,
      max_price,
      bedrooms,
      bathrooms,
      type
    } = req.query;

    const whereClause = {
      status: 'active',
      [Op.or]: [
        { auction_end_date: { [Op.gt]: new Date() } },
        { auction_end_date: null }
      ]
    };

    if (latitude && longitude) {
      whereClause[Op.and] = sequelize.literal(
        `ST_DWithin(
          ST_MakePoint(longitude, latitude)::geography,
          ST_MakePoint(${longitude}, ${latitude})::geography,
          ${radius * 1609.34}
        )`
      );
    }

    // Add other filters...
    if (min_price) whereClause.min_price = { [Op.gte]: min_price };
    if (max_price) whereClause.max_price = { [Op.lte]: max_price };
    if (bedrooms) whereClause.bedrooms = { [Op.gte]: bedrooms };
    if (bathrooms) whereClause.bathrooms = { [Op.gte]: bathrooms };
    if (type) whereClause.type = type;

    const properties = await Property.findAll({
      where: whereClause,
      include: [
        {
          model: PropertyImage,
          as: 'images',
          attributes: ['id', 'image_url'],
          limit: 1
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'profile_image_url']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      properties,
      total: properties.length
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Error performing search' });
  }
});

module.exports = router;