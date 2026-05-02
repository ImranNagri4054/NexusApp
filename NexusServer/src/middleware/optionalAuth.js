const jwt = require('jsonwebtoken');
const User = require('../models/User');

/** Sets req.user to a Mongoose doc if JWT is valid; otherwise leaves req.user undefined. */
async function optionalAuth(req, res, next) {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change-this-jwt-secret');
    const user = await User.findById(decoded.id);
    if (user) {
      req.user = user;
    }
  } catch (err) {
    // ignore invalid token — treat as anonymous
  }
  next();
}

module.exports = { optionalAuth };
