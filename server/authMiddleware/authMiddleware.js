const jwt = require('jsonwebtoken');
const User = require('../Model/User');

const requireAuth = (req, res, next) => {
  // Support both cookie and Authorization header (for frontend on Netlify)
  let token = req.cookies.jwt;
  
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    // API request → return JSON, browser request → redirect
    if (req.xhr || req.headers.accept?.includes('application/json') || req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.status(401).json({ success: false, message: 'Unauthorized. Please login.' });
    }
    return res.redirect('/login');
  }

  jwt.verify(token, 'piuscandothis', async (err, decodedToken) => {
    if (err) {
      if (req.xhr || req.headers.accept?.includes('application/json') || req.headers['x-requested-with'] === 'XMLHttpRequest') {
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
      }
      return res.redirect('/login');
    }

    try {
      const user = await User.findById(decodedToken.id).select('-password');
      if (!user) {
        if (req.xhr || req.headers.accept?.includes('application/json') || req.headers['x-requested-with'] === 'XMLHttpRequest') {
          return res.status(401).json({ success: false, message: 'User not found.' });
        }
        return res.redirect('/login');
      }

      req.user = user;
      res.locals.user = user;
      next();
    } catch (dbErr) {
      console.error('Database error in requireAuth:', dbErr);
      if (req.xhr || req.headers.accept?.includes('application/json') || req.headers['x-requested-with'] === 'XMLHttpRequest') {
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      return res.redirect('/login');
    }
  });
};

const checkUser = (req, res, next) => {
  let token = req.cookies.jwt;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    jwt.verify(token, 'piuscandothis', async (err, decodedToken) => {
      if (err) {
        res.locals.user = null;
        next();
      } else {
        const user = await User.findById(decodedToken.id).select('-password');
        res.locals.user = user || null;
        next();
      }
    });
  } else {
    res.locals.user = null;
    next();
  }
};

module.exports = { requireAuth, checkUser };