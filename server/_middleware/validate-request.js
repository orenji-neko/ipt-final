module.exports = validateRequest;

function validateRequest(req, next, schema) {
    const options = {
        abortEarly: false, // include all errors
        allowUnknown: true, // ignore unknown props
        stripUnknown: true // remove unknown props
    };
    
    const { error, value } = schema.validate(req.body, options);
    
    if (error) {
        const errorMessage = error.details.map(x => x.message).join(', ');
        console.error('Validation error:', errorMessage);
        next(`Validation error: ${errorMessage}`);
    } else {
        req.body = value;
        next();
    }
}