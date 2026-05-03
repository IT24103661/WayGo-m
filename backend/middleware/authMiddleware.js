const jwt = require('jsonwebtoken');

const normalizeUserIdFromToken = (decoded) => {
    const direct = decoded?.userId ?? decoded?.id ?? decoded?._id ?? decoded?.user?.userId ?? decoded?.user?.id ?? decoded?.user?._id;
    if (direct === null || direct === undefined) return null;

    if (typeof direct === 'string') {
        const trimmed = direct.trim();
        return trimmed || null;
    }

    if (typeof direct === 'object') {
        if (typeof direct.$oid === 'string' && direct.$oid.trim()) return direct.$oid.trim();
        if (typeof direct.id === 'string' && direct.id.trim()) return direct.id.trim();
        if (typeof direct._id === 'string' && direct._id.trim()) return direct._id.trim();
        if (typeof direct.toString === 'function') {
            const stringified = direct.toString().trim();
            if (stringified && stringified !== '[object Object]') return stringified;
        }
    }

    const fallback = String(direct).trim();
    return fallback && fallback !== '[object Object]' ? fallback : null;
};

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
        const normalizedUserId = normalizeUserIdFromToken(decoded);
        if (!normalizedUserId) {
            return res.status(401).json({ message: 'Invalid authentication token payload.' });
        }

        // 4. If it's real, attach the normalized user's ID and role context.
        req.user = {
            ...decoded,
            userId: String(normalizedUserId)
        };
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
