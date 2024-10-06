const express = require('express');
const bodyParser = require('body-parser');
const { Sequelize } = require('sequelize');
const db = require('./models');

// Initialize Express
const app = express();

// Middleware
app.use(bodyParser.json());

// Sync Sequelize Models with Database
db.sequelize.sync().then(() => {
  console.log('Database & tables created!');
});


// ------------------------ API ROUTES ------------------------ //

// Create User
app.post('/users', async (req, res) => {
  const { name, email, password_hash, role } = req.body;
  try {
    const user = await db.User.create({ name, email, password_hash, role: role || 'user' });
    res.status(201).json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// Save User Information Changes
app.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, password_hash, profile_picture_url, role } = req.body;
  try {
    const user = await db.User.findByPk(id);
    if (!user) {
      return res.status(404).send('User not found');
    }
    await user.update({ name, email, password_hash, profile_picture_url, role });
    res.status(200).json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// Get All Listings (with pagination and sorting/filtering)
app.get('/listings', async (req, res) => {
  const { page = 1, limit = 10, sort_by = 'date_posted', order = 'DESC', price_min, price_max, city, state } = req.query;
  const offset = (page - 1) * limit;
  const whereClause = { status: 'active' };

     // Add dynamic filters
     if (price_min) whereClause.price = { [db.Sequelize.Op.gte]: price_min };
     if (price_max) whereClause.price = { ...whereClause.price, [db.Sequelize.Op.lte]: price_max };
     if (city) whereClause.city = city;
     if (state) whereClause.state = state;
  
     try {
       const listings = await db.Listing.findAndCountAll({
         where: whereClause,
         limit: parseInt(limit),
         offset: offset,
         order: [[sort_by, order.toUpperCase()]],
       });
       res.json({
         totalPages: Math.ceil(listings.count / limit),
         currentPage: parseInt(page),
         listings: listings.rows,
       });
     } catch (error) {
       console.error(error.message);
       res.status(500).send('Server Error');
     }
  });
  

  app.post('/listings', async (req, res) => {
    const { user_id, title, description, price, address, city, state, zip_code, available_from, available_to } = req.body;
    try {
      const listing = await db.Listing.create({
        user_id,
        title,
        description,
        price,
        address,
        city,
        state,
        zip_code,
        available_from,
        available_to,
      });
      res.status(201).json(listing);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error');
    }
  });
  

  app.get('/listings/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const listing = await db.Listing.findOne({ where: { id, status: 'active' } });
      if (!listing) {
        return res.status(404).send('Listing not found');
      }
      res.json(listing);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error');
    }
  });
  

  app.delete('/listings/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const listing = await db.Listing.findByPk(id);
      if (!listing || listing.status === 'deleted') {
        return res.status(404).send('Listing not found');
      }
      await listing.update({ status: 'deleted', deleted_at: new Date() });
      res.json(listing);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error');
    }
  });
  

  app.put('/listings/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, price, address, city, state, zip_code, available_from, available_to } = req.body;
    try {
      const listing = await db.Listing.findByPk(id);
      if (!listing || listing.status === 'deleted') {
        return res.status(404).send('Listing not found');
      }
      await listing.update({
        title,
        description,
        price,
        address,
        city,
        state,
        zip_code,
        available_from,
        available_to,
      });
      res.json(listing);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error');
    }
  });

  
// ------------------------ END OF API ROUTES ------------------------ //

// Define the port for the server to listen on
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
