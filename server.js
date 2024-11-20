require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const { Sequelize } = require('sequelize');
const db = require('./models');
const routes = require('./routes');
const path = require('path');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');

// Initialize Express
const app = express();

// Middleware
app.use(morgan('dev'));
app.use(cookieParser());

// Increase payload size limits for file uploads
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Configure file upload middleware
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something broke!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Sync Sequelize Models with Database
db.sequelize.sync().then(async () => {
  console.log('Database & tables created!');
  
  try {
    await db.sequelize.authenticate();
    console.log('Database connection established successfully.');
    console.log('Available models:', Object.keys(db));
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
});

// Mount all routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
