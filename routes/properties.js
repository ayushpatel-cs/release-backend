const express = require('express');
const router = express.Router();
const { Property, User, Bid, PropertyImage, sequelize, Sequelize: { Op } } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { uploadPropertyImages } = require('../utils/upload');
const geocodingClient = require('../utils/geocoding');

// Create new property listing
router.post('/', authenticateToken, uploadPropertyImages, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      title,
      description,
      place_id,
      address_details,
      start_date,
      end_date,
      min_price,
    } = req.body;

    if (!place_id || !address_details) {
      return res.status(400).json({ error: 'Valid address is required' });
    }

    // Create the property with validated address details
    const property = await Property.create({
      title,
      description,
      address_line1: address_details.address_line1,
      address_line2: req.body.address_line2 || null,
      city: address_details.city,
      state: address_details.state,
      zip_code: address_details.zip_code,
      formatted_address: address_details.formatted_address,
      latitude: address_details.latitude,
      longitude: address_details.longitude,
      place_id: place_id,
      start_date,
      end_date,
      min_price,
      user_id: req.user.id,
      status: 'active'
    }, { transaction });

    // Handle image uploads if any
    if (req.files && req.files.length > 0) {
      const imagePromises = req.files.map((file, index) => {
        const imageUrl = `http://localhost:3001/uploads/${file.filename}`;
        return PropertyImage.create({
          property_id: property.id,
          image_url: imageUrl,
          order_index: index
        }, { transaction });
      });

      await Promise.all(imagePromises);
    }

    await transaction.commit();

    // Fetch the created property with its images
    const propertyWithImages = await Property.findByPk(property.id, {
      include: [{
        model: PropertyImage,
        as: 'images'
      }]
    });

    res.status(201).json(propertyWithImages);
  } catch (error) {
    await transaction.rollback();
    console.error('Property creation error:', error);
    res.status(500).json({ error: 'Error creating property listing' });
  }
});

// Get property listings with filters
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      min_price,
      max_price,
      start_date,
      end_date,
      latitude,
      longitude,
      radius
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Build where clause based on filters
    const whereClause = {
      status: 'active'
    };

    if (min_price) whereClause.min_price = { [Op.gte]: min_price };
    if (max_price) whereClause.min_price = { [Op.lte]: max_price };
    if (start_date) whereClause.start_date = { [Op.gte]: start_date };
    if (end_date) whereClause.end_date = { [Op.lte]: end_date };

    // If location filtering is requested
    if (latitude && longitude && radius) {
      whereClause[Op.and] = sequelize.literal(
        `ST_DWithin(
          ST_MakePoint(longitude, latitude)::geography,
          ST_MakePoint(${longitude}, ${latitude})::geography,
          ${radius * 1000}
        )`
      );
    }

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
      order: [['created_at', 'DESC']]
    });

    res.json({
      properties,
      total: count,
      page: parseInt(page),
      total_pages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Property fetch error:', error);
    res.status(500).json({ error: 'Error fetching properties' });
  }
});

// Get single property details
router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id, {
      include: [
        {
          model: PropertyImage,
          as: 'images'
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'profile_image_url']
        },
        {
          model: Bid,
          as: 'bids',
          include: [
            {
              model: User,
              as: 'bidder',
              attributes: ['id', 'name', 'profile_image_url']
            }
          ]
        }
      ]
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json(property);
  } catch (error) {
    console.error('Property fetch error:', error);
    res.status(500).json({ error: 'Error fetching property details' });
  }
});

// Update property listing
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (property.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await property.update(req.body);
    res.json(property);
  } catch (error) {
    console.error('Property update error:', error);
    res.status(500).json({ error: 'Error updating property' });
  }
});

// Delete property listing
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (property.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await property.destroy();
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Property deletion error:', error);
    res.status(500).json({ error: 'Error deleting property' });
  }
});

// Add new endpoint for address autocomplete
router.get('/address-suggestions', async (req, res) => {
  try {
    const { input } = req.query;
    if (!input) {
      return res.status(400).json({ error: 'Input is required' });
    }

    const predictions = await geocodingClient.getPlacePredictions(input);
    res.json(predictions);
  } catch (error) {
    console.error('Address suggestion error:', error);
    res.status(500).json({ error: 'Error fetching address suggestions' });
  }
});

// Add new endpoint for address validation
router.get('/validate-address', async (req, res) => {
  try {
    const { placeId } = req.query;
    if (!placeId) {
      return res.status(400).json({ error: 'Place ID is required' });
    }

    const addressDetails = await geocodingClient.getPlaceDetails(placeId);
    res.json(addressDetails);
  } catch (error) {
    console.error('Address validation error:', error);
    res.status(500).json({ error: 'Error validating address' });
  }
});

module.exports = router;