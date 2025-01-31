// auth.js

const jwt = require('jsonwebtoken');

/**
 * 1) Verify JWT
 */
const checkAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized access: No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

/**
 * 2) Role-based Authorization
 *    Instead of a single `role` param, accept multiple roles (spread syntax).
 */
const checkRole = (...allowedRoles) => (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }
    next();
};

module.exports = { checkAuth, checkRole };
