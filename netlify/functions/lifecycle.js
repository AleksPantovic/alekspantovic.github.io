const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
    jwksUri: 'https://certificates.plugins.coyoapp.com/.well-known/jwks.json'
});

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body);
        const token = body.token;

        const decoded = jwt.decode(token, { complete: true });

        // Validate JKU
        if (!decoded || decoded.header.jku !== 'https://certificates.plugins.coyoapp.com/.well-known/jwks.json') {
            throw new Error('Invalid JKU');
        }

        // Get public key
        const key = await client.getSigningKey(decoded.header.kid);
        const publicKey = key.getPublicKey();

        // Verify token
        jwt.verify(token, publicKey, {
            algorithms: ['RS256'],
            issuer: 'https://asioso.coyocloud.com'
        });

        const tenantId = decoded.payload.tenantId;
        console.log('Valid installation for tenant:', tenantId);

        return {
            statusCode: 200,
            body: JSON.stringify({
                code: 100,
                message: 'Installation successful',
                tenantId: tenantId
            })
        };
    } catch (error) {
        console.error('Lifecycle Event Error:', error.message);
        return {
            statusCode: 403,
            body: JSON.stringify({ error: 'Invalid installation token', details: error.message })
        };
    }
};
