const express = require('express');
const router = express.Router();
const { Property, PropertyImage, User, sequelize, Sequelize: { Op } } = require('../models');

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
      end_date: endDateQuery,
      amenities // Added amenities filter
    } = req.query;

    const whereClause = {
      status: 'active',
      [Op.or]: [
        { auction_end_date: { [Op.gt]: new Date() } },
        { auction_end_date: null }
      ]
    };

    // Parse dates
    const start_date = startDateQuery ? new Date(startDateQuery) : null;
    const end_date = endDateQuery ? new Date(endDateQuery) : null;

    if (start_date && isNaN(start_date)) {
      return res.status(400).json({ error: 'Invalid start date format' });
    }
    if (end_date && isNaN(end_date)) {
      return res.status(400).json({ error: 'Invalid end date format' });
    }

    if (start_date && end_date) {
      whereClause.start_date = { [Op.lte]: start_date };
      whereClause.end_date = { [Op.gte]: end_date };
    }

    // Location filtering
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (!isNaN(lat) && !isNaN(lng)) {
        whereClause[Op.and] = [
          ...(whereClause[Op.and] || []),
          sequelize.literal(
            `ST_DWithin(
              ST_MakePoint(longitude, latitude)::geography,
              ST_MakePoint(${lng}, ${lat})::geography,
              ${radius * 1609.34}
            )`
          )
        ];
      } else {
        return res.status(400).json({ error: 'Invalid latitude or longitude' });
      }
    }

    // Other filters
    if (min_price) whereClause.min_price = { [Op.gte]: parseFloat(min_price) };
    if (max_price) whereClause.min_price = { [Op.lte]: parseFloat(max_price) };
    if (bedrooms) whereClause.bedrooms = { [Op.gte]: parseInt(bedrooms) };
    if (bathrooms) whereClause.bathrooms = { [Op.gte]: parseInt(bathrooms) };
    if (type) whereClause.type = type;

    // Amenities filtering
    const amenitiesArray = Array.isArray(amenities)
      ? amenities
      : amenities
      ? [amenities]
      : [];
    if (amenitiesArray.length > 0) {
      whereClause.amenities = { [Op.contains]: amenitiesArray };
    }

    console.log('Constructed whereClause:', whereClause);

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
