const express = require('express');
const router = express.Router();
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

// Middleware to ensure valid token
async function ensureAuth(req, res, next) {
    try {
        if (!accessToken || Date.now() >= tokenExpiry) {
            console.log('Fetching new access token...');
            const authCode = req.query.code; // Pass the authCode from the request
            if (!authCode) {
                throw new Error('Authorization code is required');
            }
            await getAccessToken(authCode);
        }
        req.accessToken = accessToken;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Authentication failed', message: error.message });
    }
}

// JWT validation middleware for lifecycle events
const client = jwksClient({
    jwksUri: 'https://certificates.plugins.coyoapp.com/.well-known/jwks.json'
});

async function validateInstallationToken(req, res, next) {
    const token = req.body.token;

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

        req.decodedToken = decoded;
        next();
    } catch (error) {
        console.error('JWT Validation Error:', error.message);
        res.status(403).json({ error: 'Invalid installation token', details: error.message });
    }
}

// API Endpoint to fetch users
router.get('/api/users', ensureAuth, async (req, res) => {
    try {
        console.log('Using Access Token:', req.accessToken); // Debugging
        const response = await axios.get(`${API_BASE_URL}/api/users`, {
            headers: {
                'Authorization': `Bearer ${req.accessToken}`,
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
});

// Lifecycle event: Install
router.post('/lifecycle/install', validateInstallationToken, (req, res) => {
    try {
        const tenantId = req.decodedToken.payload.tenantId;
        console.log('Valid installation for tenant:', tenantId);

        // Respond to Haiilo
        res.status(200).json({
            code: 100,
            message: 'Installation successful',
            tenantId: tenantId
        });
    } catch (error) {
        res.status(500).json({ error: 'Installation failed', details: error.message });
    }
});

module.exports = router;