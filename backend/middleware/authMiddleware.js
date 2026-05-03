const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    // 1. Check if the user brought a wristband (Token) in their request headers
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Access denied. No VIP wristband provided! 🛑' });
    }

    try {
        // 2. Extract the actual token string (ignoring the word "Bearer ")
        const token = authHeader.split(' ')[1];

        // 3. Verify the token using our secret key from the .env file
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. If it's real, attach the user's ID and Role to the request and let them pass!
        req.user = decoded;
        next(); // This tells the server to move on to the actual route

    } catch (error) {
        if (error?.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Session expired. Please log in again.' });
        }
        return res.status(401).json({ message: 'Invalid authentication token.' });
    }
};

const authorizeRoles = (...allowedRoles) => (req, res, next) => {
    if (!req.user?.role) {
        return res.status(401).json({ message: 'Access denied. Missing role context.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden. You do not have permission to access this resource.' });
    }

    return next();
};

const requireResourceOwnership = (resourceUserIdPath = 'userId') => (req, res, next) => {
    const resourceUserId = req.params?.[resourceUserIdPath] || req.body?.[resourceUserIdPath] || req.query?.[resourceUserIdPath];
    if (!resourceUserId) {
        return res.status(400).json({ message: 'Resource owner reference is required.' });
    }

    if (String(resourceUserId) !== String(req.user.userId)) {
        return res.status(403).json({ message: 'Forbidden. You can only access your own resources.' });
    }

    return next();
};

module.exports = { protect, authorizeRoles, requireResourceOwnership };