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

    // Mimic the express example: decode and check issuer
    let decodedToken;
    try {
        decodedToken = jwt.decode(token, { complete: true });
        console.log('[lifecycle] Decoded header:', decodedToken.header);
        console.log('[lifecycle] Decoded payload:', decodedToken.payload);
    } catch (e) {
        console.error('[lifecycle] Failed to decode JWT:', e.message);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid JWT token' }),
        };
    }

    if (decodedToken && decodedToken.payload && decodedToken.payload.iss && decodedToken.payload.iss.indexOf('coyo') >= 0) {
        console.log('Successful installation');
        return {
            statusCode: 201,
            body: JSON.stringify({ code: 100, message: 'ok' }),
        };
    } else {
        console.log('Unsupported COYO instance');
        return {
            statusCode: 400,
            body: JSON.stringify({ code: 101, message: 'Unsupported COYO instance' }),
        };
    }
};
