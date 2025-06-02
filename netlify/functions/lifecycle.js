const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
    jwksUri: 'https://certificates.plugins.coyoapp.com/.well-known/jwks.json'
});

function getKey(header, callback) {
    client.getSigningKey(header.jku, function(err, key) {
        if (err) return callback(err);
        const signingKey = key.getPublicKey();
        callback(null, signingKey);
    });
}

exports.handler = async (event) => {
    try {
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                body: JSON.stringify({ error: 'Method Not Allowed' }),
            };
        }

        const body = event.headers['content-type']?.includes('application/json')
            ? JSON.parse(event.body)
            : Object.fromEntries(new URLSearchParams(event.body));

        // The JWT is in body.token
        const token = body.token;
        if (!token) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing token in request body' }),
            };
        }

        // Decode JWT without verifying to get the event type
        const decoded = jwt.decode(token, { complete: true });
        if (!decoded || !decoded.payload || !decoded.payload.sub) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid JWT or missing event type' }),
            };
        }

        const eventType = decoded.payload.sub;
        console.log(`Received lifecycle event: ${eventType}`);
        console.log('JWT payload:', decoded.payload);

        // Optionally: verify JWT signature here using getKey and jwt.verify

        // Respond according to event type
        if (eventType === 'install') {
            // Handle install event
            return {
                statusCode: 201,
                body: JSON.stringify({ message: 'Plugin installed successfully' }),
            };
        } else if (eventType === 'uninstall') {
            // Handle uninstall event
            return {
                statusCode: 201,
                body: JSON.stringify({ message: 'Plugin uninstalled successfully' }),
            };
        } else if (eventType === 'instance_add') {
            // Handle instance add event
            return {
                statusCode: 201,
                body: JSON.stringify({ message: 'Instance added successfully' }),
            };
        } else if (eventType === 'instance_remove') {
            // Handle instance remove event
            return {
                statusCode: 201,
                body: JSON.stringify({ message: 'Instance removed successfully' }),
            };
        } else {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Unknown lifecycle event' }),
            };
        }
    } catch (error) {
        console.error('Error processing lifecycle event:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error', details: error.message }),
        };
    }
};
