/**
 * Role-based Access Control Middleware
 * Restricts routes based on user roles
 */

/**
 * Check if user has required role(s)
 * @param {...string} allowedRoles - Roles that can access the route
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
            });
        }

        next();
    };
}

/**
 * Admin only access
 */
function adminOnly(req, res, next) {
    return requireRole('admin')(req, res, next);
}

/**
 * Admin or Faculty access
 */
function staffOnly(req, res, next) {
    return requireRole('admin', 'faculty')(req, res, next);
}

module.exports = {
    requireRole,
    adminOnly,
    staffOnly
};
