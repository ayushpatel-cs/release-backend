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
      type,
      start_date: startDateQuery,
      end_date: endDateQuery
    } = req.query;

    const whereClause = {
      status: 'active'
    };

    // Parse dates
    const start_date = startDateQuery ? new Date(startDateQuery) : null;
    const end_date = endDateQuery ? new Date(endDateQuery) : null;

    // Validate dates
    if (start_date && isNaN(start_date)) {
      return res.status(400).json({ error: 'Invalid start date format' });
    }
    if (end_date && isNaN(end_date)) {
      return res.status(400).json({ error: 'Invalid end date format' });
    }

    // Add date filters to where clause
    if (start_date && end_date) {
      whereClause.start_date = { [Op.lte]: start_date };
      whereClause.end_date = { [Op.gte]: end_date };
    }

    // Location filtering
    if (latitude && longitude) {
      whereClause[Op.and] = sequelize.literal(
        `ST_DWithin(
          ST_MakePoint(longitude, latitude)::geography,
          ST_MakePoint(${longitude}, ${latitude})::geography,
          ${radius * 1609.34}
        )`
      );
    }

    // Other filters
    if (min_price) whereClause.min_price = { [Op.gte]: parseFloat(min_price) };
    if (max_price) whereClause.min_price = { [Op.lte]: parseFloat(max_price) };
    if (bedrooms) whereClause.bedrooms = { [Op.gte]: parseInt(bedrooms) };
    if (bathrooms) whereClause.bathrooms = { [Op.gte]: parseInt(bathrooms) };
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