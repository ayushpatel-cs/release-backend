const express = require('express');
const router = express.Router();
const { Review, User, Property } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// Get all reviews for a given property
router.get('/:propertyId', async (req, res) => {
  const { propertyId } = req.params;
  
  try {
    // Fetch reviews for the given property
    const reviews = await Review.findAll({
      where: { property_id: propertyId },
      include: [
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name', 'email'] // You can include more user attributes as needed
        }
      ]
    });

    if (reviews.length === 0) {
      return res.status(200).json({ message: 'No reviews found for this property.' });
    }

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Error fetching reviews.' });
  }
});

// Add a new review for a given property
router.post('/:propertyId', async (req, res) => {
    const { propertyId } = req.params;
    const { rating, comment, reviewerId } = req.body;
  
    try {
      // Validate property existence
      const property = await Property.findByPk(propertyId);
      if (!property) {
        return res.status(403).json({ message: 'Property not found.' });
      }
  
      // Create a new review
      const review = await Review.create({
        reviewer_id: reviewerId,
        reviewed_id: property.user_id, // Assuming the review is for the owner of the property
        property_id: propertyId,
        rating,
        comment
      });
  
      res.status(201).json(review);
    } catch (error) {
      console.error('Error creating review:', error);
      res.status(500).json({ error: 'Error creating review.' });
    }
  });

module.exports = router;
