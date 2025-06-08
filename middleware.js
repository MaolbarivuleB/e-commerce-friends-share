// middleware.js
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.header('Authorization') || req.headers['authorization'];
  if (!authHeader) return res.status(401).send('Access Denied: No token provided');

  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

  try {
    const verified = jwt.verify(token, 'secretKey'); 
    
    
    // Use your secret key here or from env
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).send('Invalid Token');
  }
};

module.exports = authenticateToken;
