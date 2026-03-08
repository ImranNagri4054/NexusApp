const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function authRequired(req, res, next) {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change-this-jwt-secret');

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = { authRequired };

