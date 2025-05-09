const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'https://asioso.coyocloud.com';
const AUTH_URL = `${API_BASE_URL}/api/oauth/token`;
const CLIENT_ID = process.env.CLIENT_ID || 'organization';
const CLIENT_SECRET = process.env.CLIENT_SECRET || '81dd0c6a-6fd9-43ff-878c-21327b07ae1b';
const SCOPE = process.env.SCOPE || 'plugin:notify';
const JKU_WHITELIST = ['https://plugins.coyoapp.com'];

// Token storage
let accessToken = null;
let tokenExpiry = null;

// Helper function to encode credentials
const encodeCredentials = () => {
    return Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
};

// Get OAuth token
async function getAccessToken() {
    try {
        const response = await axios.post(AUTH_URL,
            new URLSearchParams({
                grant_type: 'client_credentials',
                scope: SCOPE
            }), {
                headers: {
                    'Authorization': `Basic ${encodeCredentials()}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

        accessToken = response.data.access_token;
        tokenExpiry = Date.now() + (response.data.expires_in * 1000);
        return accessToken;
    } catch (error) {
        console.error('OAuth Token Error:', error.response?.data || error.message);
        throw new Error('Failed to obtain access token');
    }
}

// Middleware to ensure valid token
async function ensureAuth(req, res, next) {
    try {
        if (!accessToken || Date.now() >= tokenExpiry) {
            await getAccessToken();
        }
        req.accessToken = accessToken;
        next();
    } catch (error) {
        res.status(401).json({
            error: 'Authentication failed',
            message: error.message
        });
    }
}

// Validate JWT token
async function validateJwtToken(token) {
    try {
        const decodedHeader = jwt.decode(token, { complete: true });
        const jku = decodedHeader?.header?.jku;

        // Ensure the jku URL is whitelisted
        if (!jku || !JKU_WHITELIST.includes(jku)) {
            throw new Error('Invalid jku URL');
        }

        // Fetch the public key from the jku URL
        const response = await axios.get(jku);
        const publicKey = response.data.keys[0]; // Assuming the first key is valid

        // Verify the token
        const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
        return decoded;
    } catch (error) {
        console.error('JWT Validation Error:', error.message);
        throw new Error('Invalid token');
    }
}

// Middleware to validate lifecycle event tokens
async function validateLifecycleToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Bearer token missing' });
    }

    try {
        const decoded = await validateJwtToken(token);
        req.tokenPayload = decoded;
        next();
    } catch (error) {
        res.status(403).json({
            error: 'Invalid token',
            details: error.message
        });
    }
}

// API Endpoints
router.get('/users', ensureAuth, async (req, res) => {
    try {
        console.log('Fetching users from API...');
        console.log('Request Headers:', {
            Authorization: `Bearer ${req.accessToken}`,
            'X-Client-ID': process.env.X_COYO_CLIENT_ID,
            'X-Coyo-Current-User': process.env.X_COYO_CURRENT_USER,
            'X-Csrf-Token': process.env.X_CSRF_TOKEN,
            'Accept-Version': '1.5.0',
            Accept: 'application/json',
            'User-Agent': 'HaiiloPlugin/1.0 (Server-Side)' // Add a descriptive User-Agent
        });

        const response = await axios.get(`${API_BASE_URL}/api/users`, {
            headers: {
                'Authorization': `Bearer ${req.accessToken}`,
                'X-Client-ID': process.env.X_COYO_CLIENT_ID,
                'X-Coyo-Current-User': process.env.X_COYO_CURRENT_USER,
                'X-Csrf-Token': process.env.X_CSRF_TOKEN,
                'Accept-Version': '1.5.0',
                'Accept': 'application/json',
                'User-Agent': 'HaiiloPlugin/1.0 (Server-Side)' // Add a descriptive User-Agent
            }
        });

        console.log('API Response Headers:', response.headers);
        console.log('API Response Data:', response.data);

        const contentType = response.headers['content-type'];
        if (contentType && contentType.includes('application/json')) {
            res.json(response.data);
        } else {
            console.error('Upstream API returned unexpected content type:', contentType);
            console.error('Upstream API response data:', response.data);
            res.status(500).json({
                error: 'Unexpected data format from the upstream API',
                details: `Expected JSON but received: ${contentType}`,
                responseBody: response.data // Include the raw response for debugging
            });
        }

    } catch (error) {
        console.error('API Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch users from the upstream API',
            details: error.response?.data || error.message
        });
    }
});

router.post('/lifecycle-event', validateLifecycleToken, (req, res) => {
    try {
        console.log('Lifecycle event received:', req.body);
        res.json({
            status: 'success',
            message: 'Event processed',
            eventData: req.body
        });
    } catch (error) {
        res.status(400).json({
            error: 'Bad request',
            details: error.message
        });
    }
});

// Lifecycle event: Install
router.post('/lifecycle/install', (req, res) => {
    try {
        console.log('Received lifecycle event: install');
        const decodedToken = jwt.decode(req.body.token, { complete: true });
        console.log('Decoded Header:', decodedToken?.header);
        console.log('Decoded Payload:', decodedToken?.payload);

        // Perform installation logic here
        res.status(201).json({ message: 'Plugin installed successfully' });
    } catch (error) {
        console.error('Install Event Error:', error.message);
        res.status(400).json({
            error: 'Failed to process install event',
            details: error.message
        });
    }
});

// Lifecycle event: Uninstall
router.post('/lifecycle/uninstall', (req, res) => {
    try {
        console.log('Received lifecycle event: uninstall');
        const decodedToken = jwt.decode(req.body.token, { complete: true });
        console.log('Decoded Header:', decodedToken?.header);
        console.log('Decoded Payload:', decodedToken?.payload);

        // Perform uninstallation logic here
        res.status(201).json({ message: 'Plugin uninstalled successfully' });
    } catch (error) {
        console.error('Uninstall Event Error:', error.message);
        res.status(400).json({
            error: 'Failed to process uninstall event',
            details: error.message
        });
    }
});

// Lifecycle event: Instance Add
router.post('/lifecycle/instance_add', (req, res) => {
    try {
        console.log('Received lifecycle event: instance_add');
        const decodedToken = jwt.decode(req.body.token, { complete: true });
        console.log('Decoded Header:', decodedToken?.header);
        console.log('Decoded Payload:', decodedToken?.payload);

        // Perform instance addition logic here
        res.status(201).json({ message: 'Instance added successfully' });
    } catch (error) {
        console.error('Instance Add Event Error:', error.message);
        res.status(400).json({
            error: 'Failed to process instance_add event',
            details: error.message
        });
    }
});

// Lifecycle event: Instance Remove
router.post('/lifecycle/instance_remove', (req, res) => {
    try {
        console.log('Received lifecycle event: instance_remove');
        const decodedToken = jwt.decode(req.body.token, { complete: true });
        console.log('Decoded Header:', decodedToken?.header);
        console.log('Decoded Payload:', decodedToken?.payload);

        // Perform instance removal logic here
        res.status(200).json({ message: 'Instance removed successfully' });
    } catch (error) {
        console.error('Instance Remove Event Error:', error.message);
        res.status(400).json({
            error: 'Failed to process instance_remove event',
            details: error.message
        });
    }
});

// API Access Token Event
router.post('/lifecycle/access_token', (req, res) => {
    try {
        console.log('Received lifecycle event: access_token');
        const decodedToken = jwt.decode(req.body.token, { complete: true });
        console.log('Decoded Header:', decodedToken?.header);
        console.log('Decoded Payload:', decodedToken?.payload);

        // Perform access token handling logic here
        res.status(201).json({ message: 'Access token processed successfully' });
    } catch (error) {
        console.error('Access Token Event Error:', error.message);
        res.status(400).json({
            error: 'Failed to process access_token event',
            details: error.message
        });
    }
});

module.exports = router;