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
    console.log('[lifecycle] >>> FUNCTION TRIGGERED <<<');
    console.log('[lifecycle] Event HTTP Method:', event.httpMethod);
    console.log('[lifecycle] Event Path:', event.path);
    console.log('[lifecycle] Event Body:', event.body);
    console.log('[lifecycle] Event Headers:', event.headers);

    // Parse form-urlencoded body if needed
    let token;
    if (event.headers['content-type'] && event.headers['content-type'].includes('application/x-www-form-urlencoded')) {
        const params = new URLSearchParams(event.body);
        token = params.get('token');
    } else if (event.headers['content-type'] && event.headers['content-type'].includes('application/json')) {
        const body = JSON.parse(event.body);
        token = body.token;
    }

    console.log('[lifecycle] Raw JWT token:', token);

    let eventType = null;
    let decoded = null;
    if (token) {
        try {
            decoded = jwt.decode(token, { complete: true });
            eventType = decoded?.payload?.sub;
            console.log('[lifecycle] Decoded JWT:', decoded);
            console.log('[lifecycle] Event type (sub):', eventType);
        } catch (e) {
            console.error('[lifecycle] Failed to decode JWT:', e);
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid JWT token' }),
            };
        }
    } else {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing token in request body' }),
        };
    }

    // Respond according to event type
    let response;
    if (eventType === 'install') {
        // Accept installation
        response = {
            statusCode: 201,
            body: JSON.stringify({ message: 'Plugin installed successfully' }),
        };
    } else if (eventType === 'uninstall') {
        response = {
            statusCode: 201,
            body: JSON.stringify({ message: 'Plugin uninstalled successfully' }),
        };
    } else if (eventType === 'instance_add') {
        response = {
            statusCode: 201,
            body: JSON.stringify({ message: 'Instance added successfully' }),
        };
    } else if (eventType === 'instance_remove') {
        response = {
            statusCode: 201,
            body: JSON.stringify({ message: 'Instance removed successfully' }),
        };
    } else {
        response = {
            statusCode: 400,
            body: JSON.stringify({ error: 'Unknown lifecycle event' }),
        };
    }

    console.log('[lifecycle] Response:', response);
    return response;
};
