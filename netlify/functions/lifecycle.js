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
    // Add a top-level log to confirm function invocation
    console.log('[lifecycle] HANDLER INVOKED');

    console.log('[lifecycle] >>> FUNCTION TRIGGERED <<<');
    console.log('[lifecycle] Event HTTP Method:', event.httpMethod);
    console.log('[lifecycle] Event Path:', event.path);
    console.log('[lifecycle] Event Body:', event.body);
    console.log('[lifecycle] Event Headers:', event.headers);

    // Parse form-urlencoded body if needed
    let token;
    const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
    if (contentType.includes('application/x-www-form-urlencoded')) {
        // Defensive: handle both string and Buffer
        let bodyString = event.body;
        if (typeof bodyString !== 'string') {
            bodyString = Buffer.from(event.body).toString('utf8');
        }
        // Log the raw body for debugging
        console.log('[lifecycle] Raw body:', bodyString);
        const params = new URLSearchParams(bodyString);
        token = params.get('token');
        console.log('[lifecycle] URLSearchParams token:', token);
    } else if (contentType.includes('application/json')) {
        const body = JSON.parse(event.body);
        token = body.token;
        console.log('[lifecycle] JSON token:', token);
    } else {
        console.log('[lifecycle] Unknown content-type:', contentType);
        console.log('[lifecycle] Raw body:', event.body);
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
        console.error('[lifecycle] No token found in request body');
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing token in request body' }),
        };
    }

    // Respond according to event type
    if (eventType === 'install') {
        // Accept installation
        return {
            statusCode: 201,
            body: JSON.stringify({ message: 'Plugin installed successfully' }),
        };
    } else if (eventType === 'uninstall') {
        return {
            statusCode: 201,
            body: JSON.stringify({ message: 'Plugin uninstalled successfully' }),
        };
    } else if (eventType === 'instance_add') {
        return {
            statusCode: 201,
            body: JSON.stringify({ message: 'Instance added successfully' }),
        };
    } else if (eventType === 'instance_remove') {
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
};
