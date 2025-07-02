const jwt = require('jsonwebtoken');

const middleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error(" Invalid token error:", err.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = middleware; 

                            
exports.isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.'});
  }
  next();
};

 
 