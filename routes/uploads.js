const express = require('express');
const router = express.Router();
const { PropertyImage } = require('../models');
const { uploadPropertyImages } = require('../utils/upload');
const { authenticateToken } = require('../middleware/auth');

// Upload property images
router.post('/properties/:id/images', authenticateToken, uploadPropertyImages, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    const property_id = req.params.id;
    const uploadedImages = [];

    for (let i = 0; i < req.files.length; i++) {
      const image = await PropertyImage.create({
        property_id,
        image_url: req.files[i].location,
        order_index: i
      });
      uploadedImages.push(image);
    }

    res.json(uploadedImages);
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Error uploading images' });
  }
});

// Reorder property images
router.put('/properties/:id/images/reorder', authenticateToken, async (req, res) => {
  try {
    const { image_orders } = req.body; // Array of { id, order_index }
    
    await Promise.all(
      image_orders.map(({ id, order_index }) =>
        PropertyImage.update(
          { order_index },
          { where: { id, property_id: req.params.id } }
        )
      )
    );

    const updatedImages = await PropertyImage.findAll({
      where: { property_id: req.params.id },
      order: [['order_index', 'ASC']]
    });

    res.json(updatedImages);
  } catch (error) {
    console.error('Image reorder error:', error);
    res.status(500).json({ error: 'Error reordering images' });
  }
});

// Delete property image
router.delete('/properties/:propertyId/images/:imageId', authenticateToken, async (req, res) => {
  try {
    const { propertyId, imageId } = req.params;
    
    const image = await PropertyImage.findOne({
      where: { id: imageId, property_id: propertyId }
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    await image.destroy();
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Image deletion error:', error);
    res.status(500).json({ error: 'Error deleting image' });
  }
});

module.exports = router;