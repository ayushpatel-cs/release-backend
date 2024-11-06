const express = require('express');
const router = express.Router();
const { Property, User, Bid, PropertyImage, sequelize, Sequelize: { Op } } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { uploadPropertyImages } = require('../utils/upload');

// Create new property listing
router.post('/', authenticateToken, uploadPropertyImages, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      title,
      description,
      address,
      start_date,
      end_date,
      min_price,
    } = req.body;

    // Create the property
    const property = await Property.create({
      title,
      description,
      address,
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

module.exports = router;