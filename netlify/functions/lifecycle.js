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

    console.log('[lifecycle] Parsed token:', token);

    // Optionally decode JWT for debugging
    if (token) {
        try {
            const decoded = jwt.decode(token, { complete: true });
            console.log('[lifecycle] Decoded JWT:', decoded);
        } catch (e) {
            console.error('[lifecycle] Failed to decode JWT:', e);
        }
    }

    return {
        statusCode: 201, // 201 for install event
        body: JSON.stringify({ message: 'Lifecycle function received the request' }),
    };
};
