const { expressjwt: jwt } = require('express-jwt'); // Updated import
const { secret } = require('../config.json');
const db = require('../_helpers/db');

module.exports = authorize;

function authorize(roles = []) {
    // roles param can be a single role string (e.g. Role.User or 'User')
    // or an array of roles (e.g. [Role.Admin, Role.User] or ['Admin', 'User'])
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return [
        // Authenticate JWT token and attach user to request object (req.user)
        jwt({
            secret: secret, 
            algorithms: ['HS256'],
            requestProperty: 'user' // explicitly set request property
        }),

        // Authorize based on user role
        async (req, res, next) => {
            try {
                // Find the account by user ID
                const account = await db.Account.findByPk(req.user.id);

                if (!account || (roles.length && !roles.includes(account.role))) {
                    // Account no longer exists or role not authorized
                    return res.status(401).json({ message: 'Unauthorized' });
                }

                // Authentication and authorization successful
                req.user.role = account.role;
                const refreshTokens = await account.getRefreshTokens();
                req.user.ownsToken = token => !!refreshTokens.find(x => x.token === token);
                next();
            } catch (error) {
                console.error('Authorization error:', error);
                return res.status(500).json({ message: 'Internal Server Error' });
            }
        }
    ];
}