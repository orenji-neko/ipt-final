module.exports = errorHandler;

function errorHandler(err, req, res, next) {
    console.error('Error details:', err);
    
    switch (true) {
        case typeof err === 'string':
            // custom application error
            const is404 = err.toLowerCase().endsWith('not found');
            const statusCode = is404 ? 404 : 400;
            return res.status(statusCode).json({ message: err });

        case err.name === 'UnauthorizedError':
            // jwt authentication error
            return res.status(401).json({ message: 'Unauthorized' });

        case err.name === 'SequelizeValidationError':
            // database validation error
            return res.status(400).json({ message: err.message });

        case err.name === 'SequelizeUniqueConstraintError':
            // database unique constraint error
            return res.status(400).json({ message: 'A record with this value already exists' });

        default:
            console.error('Unhandled error:', err);
            return res.status(500).json({ 
                message: err.message || 'Internal Server Error',
                stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
            });
    }
}