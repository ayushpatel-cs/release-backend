const express = require('express');
const router = express.Router();
const { Property, PropertyImage, User, sequelize, Sequelize: { Op } } = require('../models');
const geocodingClient = require('../utils/geocoding');

router.get('/', async (req, res) => {
  try {
    const {
      q,
      min_price,
      max_price,
      location,
      bedrooms,
      bathrooms,
      type,
      radius = 10 // Default radius in kilometers
    } = req.query;

    const whereClause = {
      status: 'active'
    };

    if (q) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } }
      ];
    }

    if (location) {
      try {
        const predictions = await geocodingClient.getPlacePredictions(location);
        if (predictions.length > 0) {
          const locationDetails = await geocodingClient.getPlaceDetails(predictions[0].place_id);
          
          whereClause[Op.and] = sequelize.literal(
            `ST_DWithin(
              ST_MakePoint(longitude, latitude)::geography,
              ST_MakePoint(${locationDetails.longitude}, ${locationDetails.latitude})::geography,
              ${radius * 1000}
            )`
          );
        }
      } catch (error) {
        console.error('Location search error:', error);
        whereClause[Op.or] = [
          { city: { [Op.iLike]: `%${location}%` } },
          { state: { [Op.iLike]: `%${location}%` } },
          { formatted_address: { [Op.iLike]: `%${location}%` } }
        ];
      }
    }

    if (min_price) whereClause.min_price = { [Op.gte]: min_price };
    if (max_price) whereClause.min_price = { [Op.lte]: max_price };

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