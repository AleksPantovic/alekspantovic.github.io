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
        const response = await axios.get(`${API_BASE_URL}/api/users`, {
            headers: {
                'Authorization': `Bearer ${req.accessToken}`,
                'X-Client-ID': process.env.X_COYO_CLIENT_ID,
                'X-Coyo-Current-User': process.env.X_COYO_CURRENT_USER,
                'X-Csrf-Token': process.env.X_CSRF_TOKEN,
                'Accept-Version': '1.5.0',
                'Accept': 'application/json'
            }
        });

        // Render the response as a complete HTML page
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Users List</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                    }
                    h1 {
                        color: #333;
                    }
                    ul {
                        list-style-type: none;
                        padding: 0;
                    }
                    li {
                        background: #f9f9f9;
                        margin: 5px 0;
                        padding: 10px;
                        border: 1px solid #ddd;
                        border-radius: 5px;
                    }
                </style>
                <script>
                    document.addEventListener('DOMContentLoaded', () => {
                        console.log('JavaScript is enabled and running.');
                    });
                </script>
            </head>
            <body>
                <h1>Users List</h1>
                <ul>
                    ${response.data.map(user => `<li>${user.name} (${user.email})</li>`).join('')}
                </ul>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('API Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Error</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                    }
                    h1 {
                        color: red;
                    }
                </style>
            </head>
            <body>
                <h1>Error: Failed to fetch users</h1>
                <p>${error.response?.data || error.message}</p>
            </body>
            </html>
        `);
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
    console.log('Received lifecycle event: install %s', req.body.token);
    let decodedToken = jwt.decode(req.body.token);
    console.log('Decoded header: %j', decodedToken.header);
    console.log('Decoded payload: %j', decodedToken.payload);

    if (decodedToken.payload.iss.indexOf('coyo') >= 0) {
        console.log('Successful installation');
        res.status(201).json({ code: 100, message: 'ok' });
    } else {
        console.log('Unsupported COYO instance');
        res.status(400).json({ code: 101, message: 'Unsupported COYO instance' });
    }
});

async function fetchUsers(req, res) {
    try {
        console.log('Using Access Token:', accessToken); // Debugging

        const response = await axios.get(`${API_BASE_URL}/api/users`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Client-ID': process.env.X_COYO_CLIENT_ID,
                'X-Coyo-Current-User': process.env.X_COYO_CURRENT_USER,
                'X-Csrf-Token': process.env.X_CSRF_TOKEN,
                'Accept-Version': '1.5.0',
                'Accept': 'application/json'
            }
        });

        // Check if the response is valid JSON
        if (response.headers['content-type'] !== 'application/json') {
            console.error('Unexpected response content type:', response.headers['content-type']);
            console.error('Response body:', response.data); // Debugging
            return res.status(500).send(`
                <html>
                    <body>
                        <h1>Error: Unexpected response from API</h1>
                        <p>Expected JSON but received non-JSON response.</p>
                        <pre>${response.data}</pre>
                    </body>
                </html>
            `);
        }

        // Handle empty user list
        if (!response.data || response.data.length === 0) {
            return res.send(`
                <html>
                    <head>
                        <title>Users</title>
                    </head>
                    <body>
                        <h1>Users List</h1>
                        <p>No users found.</p>
                    </body>
                </html>
            `);
        }

        // Render the response as an HTML page
        const usersHtml = response.data.map(user => `<li>${user.name} (${user.email})</li>`).join('');
        res.send(`
            <html>
                <head>
                    <title>Users</title>
                </head>
                <body>
                    <h1>Users List</h1>
                    <ul>${usersHtml}</ul>
                </body>
            </html>
        `);
    } catch (error) {
        console.error('API Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).send(`
            <html>
                <body>
                    <h1>Error: Failed to fetch users</h1>
                    <p>${error.response?.data || error.message}</p>
                </body>
            </html>
        `);
    }
}

module.exports = router;