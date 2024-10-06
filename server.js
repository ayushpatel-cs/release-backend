const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

// Initialize Express
const app = express();

// Middleware
app.use(bodyParser.json());

// Set up PostgreSQL connection using your DigitalOcean credentials
const pool = new Pool({
  user: 'doadmin',
  host: 'db-postgresql-nyc3-74105-do-user-6209446-0.e.db.ondigitalocean.com',
  database: 'defaultdb',
  password: 'AVNS_lPN3nJVN7T2JxaEgHgU',
  port: 25060,
  ssl: {
    rejectUnauthorized: false, // Required for DigitalOcean
  },
});

// Helper function for querying the database
const db = {
  query: (text, params) => pool.query(text, params),
};
// ------------------------ API ROUTES ------------------------ //

// Create User
app.post('/users', async (req, res) => {
  const { name, email, password_hash, role } = req.body;
  try {
    const query = `
      INSERT INTO Users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const { rows } = await db.query(query, [name, email, password_hash, role || 'user']);
    res.status(201).json(rows[0]);
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
    const query = `
      UPDATE Users 
      SET name = $1, email = $2, password_hash = $3, profile_picture_url = $4, role = $5
      WHERE id = $6
      RETURNING *;
    `;
    const { rows } = await db.query(query, [name, email, password_hash, profile_picture_url, role, id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// Get All Listings (with pagination and sorting/filtering)
app.get('/listings', async (req, res) => {
  const { page = 1, limit = 10, sort_by = 'date_posted', order = 'DESC', price_min, price_max, city, state } = req.query;

  const offset = (page - 1) * limit;
  let query = `SELECT * FROM Listings WHERE status = 'active'`;
  const params = [];

  // Add filters dynamically
  if (price_min) {
    params.push(price_min);
    query += ` AND price >= $${params.length}`;
  }

  if (price_max) {
    params.push(price_max);
    query += ` AND price <= $${params.length}`;
  }

  if (city) {
    params.push(city);
    query += ` AND city = $${params.length}`;
  }

  if (state) {
    params.push(state);
    query += ` AND state = $${params.length}`;
  }

  query += ` ORDER BY ${sort_by} ${order} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  try {
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// Create a New Listing
app.post('/listings', async (req, res) => {
  const { user_id, title, description, price, address, city, state, zip_code, available_from, available_to } = req.body;
  try {
    const query = `
      INSERT INTO Listings (user_id, title, description, price, address, city, state, zip_code, available_from, available_to)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const { rows } = await db.query(query, [user_id, title, description, price, address, city, state, zip_code, available_from, available_to]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// Get Listing Details by ID
app.get('/listings/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query('SELECT * FROM Listings WHERE id = $1 AND status = $2', [id, 'active']);
    if (rows.length === 0) {
      return res.status(404).send('Listing not found');
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// Delete a Listing
app.delete('/listings/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      UPDATE Listings 
      SET status = 'deleted', deleted_at = CURRENT_TIMESTAMP 
      WHERE id = $1
      RETURNING *;
    `;
    const { rows } = await db.query(query, [id]);
    if (rows.length === 0) {
      return res.status(404).send('Listing not found');
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// Update a Listing
app.put('/listings/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, price, address, city, state, zip_code, available_from, available_to } = req.body;
  try {
    const query = `
      UPDATE Listings 
      SET title = $1, description = $2, price = $3, address = $4, city = $5, state = $6, zip_code = $7, available_from = $8, available_to = $9
      WHERE id = $10 AND status = 'active'
      RETURNING *;
    `;
    const { rows } = await db.query(query, [title, description, price, address, city, state, zip_code, available_from, available_to, id]);
    if (rows.length === 0) {
      return res.status(404).send('Listing not found');
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// ------------------------ END OF API ROUTES ------------------------ //

// Define the port for the server to listen on
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
