const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'KrishIsTheCoolest!2023#Secure'; // Fallback to the same secret from .env

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log('Auth header:', authHeader);
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }

  console.log('Verifying token:', token);
  console.log('Using JWT_SECRET:', JWT_SECRET ? 'Secret is set' : 'Secret is missing');
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Token verification error:', err);
      return res.status(403).json({ error: 'Invalid token' });
    }
    console.log('Decoded user from token:', user);
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };
