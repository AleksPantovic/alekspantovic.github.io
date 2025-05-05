const axios = require('axios');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
require('dotenv').config();

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'https://asioso.coyocloud.com';
const AUTH_URL = `${API_BASE_URL}/api/oauth/token`;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const SCOPE = process.env.SCOPE || 'plugin:notify';
const JKU_WHITELIST = ['https://certificates.plugins.coyoapp.com/.well-known/jwks.json'];

// Token management
let accessToken = null;
let tokenExpiry = null;

// Helper function to encode credentials
const encodeCredentials = () => Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

// Function to fetch OAuth token
async function getAccessToken(authCode) {
    try {
        const response = await axios.post(AUTH_URL,
            new URLSearchParams({
                grant_type: 'authorization_code',
                code: authCode,
                scope: SCOPE,
                redirect_uri: process.env.REDIRECT_URI
            }), {
                headers: {
                    'Authorization': `Basic ${encodeCredentials()}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

        accessToken = response.data.access_token;
        tokenExpiry = Date.now() + (response.data.expires_in * 1000);
        console.log('New Access Token:', accessToken); // Debugging
        return accessToken;
    } catch (error) {
        console.error('OAuth Error:', error.response?.data || error.message);
        throw new Error('Token acquisition failed');
    }
}

// JWT validation middleware for lifecycle events
const client = jwksClient({
    jwksUri: 'https://certificates.plugins.coyoapp.com/.well-known/jwks.json'
});

async function validateInstallationToken(token) {
    try {
        const decoded = jwt.decode(token, { complete: true });

        // Validate JKU
        if (!decoded || !JKU_WHITELIST.includes(decoded.header.jku)) {
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

        return decoded;
    } catch (error) {
        console.error('JWT Validation Error:', error.message);
        throw new Error('Invalid installation token');
    }
}

// API Endpoint to fetch users
async function fetchUsers(req, res) {
    try {
        console.log('Using Access Token:', accessToken); // Debugging
        const response = await axios.get(`${API_BASE_URL}/api/users`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Client-ID': CLIENT_ID,
                'Accept-Version': '1.5.0',
                'Accept': 'application/json'
            }
        });

        // Check if the response is valid JSON
        if (response.headers['content-type'] !== 'application/json') {
            console.error('Unexpected response content type:', response.headers['content-type']);
            return res.status(500).json({
                error: 'Unexpected response from API',
                details: 'Expected JSON but received non-JSON response'
            });
        }

        res.json(response.data);
    } catch (error) {
        console.error('API Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch users',
            details: error.response?.data || error.message
        });
    }
}

module.exports = {
    getAccessToken,
    validateInstallationToken,
    fetchUsers
};