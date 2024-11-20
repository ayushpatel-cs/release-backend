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
    // Log the entire request body
    console.log('Received property data:', req.body);
    console.log('Files:', req.files);

    const {
      title,
      description,
      place_id,
      address_line1,
      city,
      state,
      zip_code,
      formatted_address,
      latitude,
      longitude,
      min_price,
      start_date,
      end_date,
      auction_end_date,
    } = req.body;

    // Validate required fields
    if (!address_line1 || !city || !state || !zip_code || !latitude || !longitude) {
      return res.status(400).json({ error: 'All address fields are required' });
    }

    if (!auction_end_date) {
      return res.status(400).json({ error: 'Auction end date is required' });
    }

    // Create the property
    const property = await Property.create({
      user_id: req.user.id,
      title,
      description,
      address_line1,
      city,
      state,
      zip_code,
      formatted_address,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      place_id,
      auction_end_date,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      min_price: parseFloat(min_price),
      status: 'active'
    }, { transaction });

    // Handle image uploads if any
    if (req.files && req.files.length > 0) {
      const imagePromises = req.files.map((file, index) => {
        console.log("FILENAME: " , file.filename);

        return PropertyImage.create({
          property_id: property.id,
          image_url: `${process.env.BACKEND_URL}/uploads/${file.filename}`,
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
    res.status(500).json({ error: 'Error creating property listing: ' + error.message });
  }
});

// Update property listing with images
router.put('/:id', authenticateToken, uploadPropertyImages, async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const property = await Property.findByPk(req.params.id);

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (property.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Validate required fields (if updating them)
    const {
      title,
      description,
      address_line1,
      city,
      state,
      zip_code,
      latitude,
      longitude,
      min_price
    } = req.body;

    if (
      (address_line1 || city || state || zip_code || latitude || longitude) &&
      (!address_line1 || !city || !state || !zip_code || !latitude || !longitude)
    ) {
      return res
        .status(400)
        .json({ error: 'All address fields are required for an update' });
    }

    // Update basic property details
    await property.update(
      {
        title,
        description,
        address_line1,
        city,
        state,
        zip_code,
        latitude: latitude ? parseFloat(latitude) : property.latitude,
        longitude: longitude ? parseFloat(longitude) : property.longitude,
        min_price: min_price ? parseFloat(min_price) : property.min_price
      },
      { transaction }
    );

    // Handle new images (if uploaded)
    if (req.files && req.files.length > 0) {
      // Remove old images if necessary
      await PropertyImage.destroy({ where: { property_id: property.id }, transaction });

      const imagePromises = req.files.map((file, index) => {
        return PropertyImage.create(
          {
            property_id: property.id,
            image_url: `${process.env.BACKEND_URL}/uploads/${file.filename}`,
            order_index: index
          },
          { transaction }
        );
      });

      await Promise.all(imagePromises);
    }

    await transaction.commit();

    // Fetch updated property with its images
    const updatedProperty = await Property.findByPk(property.id, {
      include: [{ model: PropertyImage, as: 'images' }]
    });

    res.json(updatedProperty);
  } catch (error) {
    await transaction.rollback();
    console.error('Property update error:', error);
    res.status(500).json({ error: 'Error updating property: ' + error.message });
  }
});

// Delete property listing
router.delete('/:id', authenticateToken, async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const property = await Property.findByPk(req.params.id);

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (property.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Delete associated images first
    await PropertyImage.destroy({ where: { property_id: property.id }, transaction });

    // Delete the property itself
    await property.destroy({ transaction });

    await transaction.commit();
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Property deletion error:', error);
    res.status(500).json({ error: 'Error deleting property: ' + error.message });
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
      start_date: startDateQuery,
      end_date: endDateQuery,
      latitude,
      longitude,
      radius
    } = req.query;

    const offset = (page - 1) * limit;

    const start_date = startDateQuery ? new Date(startDateQuery) : null;
    const end_date = endDateQuery ? new Date(endDateQuery) : null;

    // Build where clause based on filters
    const whereClause = {
      status: 'active',
      // Filter out expired auctions
      [Op.or]: [
        { auction_end_date: { [Op.gt]: new Date() } },
        { auction_end_date: null }
      ]
    };

    if (min_price) whereClause.min_price = { [Op.gte]: min_price };
    if (max_price) whereClause.min_price = { [Op.lte]: max_price };
    
    if (start_date && end_date) {
      whereClause.start_date = { [Op.lte]: end_date };
      whereClause.end_date = { [Op.gte]: start_date };
    }

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

// Add new endpoint for search by geographic area
router.get('/search', async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;
    
    // Convert radius from miles to meters (1 mile = 1609.34 meters)
    const radiusInMeters = parseFloat(radius) * 1609.34;
    
    // Use Sequelize's geometry functions
    const listings = await Property.findAll({
      where: sequelize.literal(`
        ST_DWithin(
          ST_MakePoint(longitude, latitude)::geography,
          ST_MakePoint(${longitude}, ${latitude})::geography,
          ${radiusInMeters}
        )
      `),
      // Include other necessary fields and conditions
      ...otherQueryParams
    });

    res.json({ properties: listings });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Error searching properties' });
  }
});

module.exports = router;
