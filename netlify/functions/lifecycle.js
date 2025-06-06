const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
    jwksUri: 'https://certificates.plugins.coyoapp.com/.well-known/jwks.json'
});

function getSigningKey(header, callback) {
    client.getSigningKey(header.jku, function(err, key) {
        if (err) {
            console.error('[lifecycle] Error getting signing key:', err.message);
            return callback(err);
        }
        const signingKey = key.getPublicKey();
        callback(null, signingKey);
    });
}

exports.handler = async (event) => {
    console.log('[lifecycle] >>> FUNCTION TRIGGERED <<<');
    console.log('[lifecycle] Event HTTP Method:', event.httpMethod);
    console.log('[lifecycle] Event Path:', event.path);
    console.log('[lifecycle] Event Headers:', event.headers);

    if (event.httpMethod !== 'POST') {
        console.log('[lifecycle] Received non-POST request. Expected POST for lifecycle events. Method:', event.httpMethod);
        return {
            statusCode: 405,
            body: JSON.stringify({ error: `Method Not Allowed. Expected POST, received ${event.httpMethod}` }),
        };
    }

    let token;
    const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
    if (contentType.includes('application/x-www-form-urlencoded')) {
        try {
            const params = new URLSearchParams(event.body);
            token = params.get('token');
        } catch (e) {
            console.error('[lifecycle] Error parsing form-urlencoded body:', e.message);
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid form-urlencoded body' }) };
        }
    } else if (contentType.includes('application/json')) {
        try {
            const body = JSON.parse(event.body);
            token = body.token;
        } catch (e) {
            console.error('[lifecycle] Error parsing JSON body:', e.message);
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
        }
    } else {
        console.error('[lifecycle] Unsupported Content-Type:', contentType);
        return {
            statusCode: 415,
            body: JSON.stringify({ error: 'Unsupported Content-Type. Expected application/x-www-form-urlencoded or application/json.' }),
        };
    }

    if (!token) {
        console.error('[lifecycle] Missing JWT token in request body.');
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing token in request body' }),
        };
    }

    console.log('[lifecycle] Raw JWT token received (first 50 chars):', token.substring(0, 50) + '...');

    let eventType = null;
    let decodedPayload = null;

    try {
        const decoded = jwt.decode(token, { complete: true });
        if (!decoded || !decoded.header || !decoded.payload) {
            console.error('[lifecycle] JWT decoding resulted in incomplete token.');
            return { statusCode: 400, body: JSON.stringify({ error: 'Incomplete JWT token decoded' }) };
        }

        eventType = decoded.payload.sub;
        decodedPayload = decoded.payload;

        console.log('[lifecycle] Decoded JWT Header:', decoded.header);
        console.log('[lifecycle] Decoded JWT Payload (claims):', decoded.payload);
        console.log('[lifecycle] Event type (sub claim):', eventType);

        // JWT verification (recommended)
        await new Promise((resolve, reject) => {
            jwt.verify(token, getSigningKey, { algorithms: ['RS512'] }, function(err, verifiedPayload) {
                if (err) {
                    console.error('[lifecycle] JWT verification failed:', err.message);
                    return reject(new Error('JWT verification failed'));
                }
                console.log('[lifecycle] JWT successfully verified.');
                resolve();
            });
        });

    } catch (e) {
        console.error('[lifecycle] Error processing JWT:', e.message);
        return {
            statusCode: 401,
            body: JSON.stringify({ error: `JWT processing failed: ${e.message}` }),
        };
    }

    let responseBody = { message: 'Lifecycle event processed successfully' };
    let statusCode = 200;

    switch (eventType) {
        case 'install':
            console.log('[lifecycle] Handling install event.');
            statusCode = 201;
            responseBody.message = 'Plugin installed successfully';
            break;
        case 'uninstall':
            console.log('[lifecycle] Handling uninstall event.');
            statusCode = 201;
            responseBody.message = 'Plugin uninstalled successfully';
            break;
        case 'instance_add':
            console.log('[lifecycle] Handling instance_add event.');
            statusCode = 201;
            responseBody.message = 'Instance added successfully';
            break;
        case 'instance_remove':
            console.log('[lifecycle] Handling instance_remove event.');
            statusCode = 201;
            responseBody.message = 'Instance removed successfully';
            break;
        default:
            console.warn(`[lifecycle] Unknown lifecycle event type: ${eventType}`);
            statusCode = 400;
            responseBody = { error: `Unknown lifecycle event: ${eventType}` };
            break;
    }

    const response = {
        statusCode: statusCode,
        body: JSON.stringify(responseBody),
    };

    console.log('[lifecycle] Final Response:', response);
    return response;
};
