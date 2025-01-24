const jwt = require('jsonwebtoken');

// Verify JWT Token
const checkAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized access' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// Role-based Authorization
const checkRole = (role) => (req, res, next) => {
    if (req.user.role !== role) {
        return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }
    next();
};

module.exports = { checkAuth, checkRole };
