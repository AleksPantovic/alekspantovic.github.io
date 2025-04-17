const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const PUBLIC_KEY_URL = 'https://plugins.coyoapp.com'; // Whitelisted URL for public keys

let accessToken = null; // Store the access token in memory
let tokenExpiryTime = null; // Store token expiry time

// Function to fetch a new authorization code
async function fetchAuthorizationCode() {
    try {
        const authCodeUrl = 'https://asioso.coyocloud.com/api/oauth/authorize'; // Replace with the correct endpoint
        const response = await fetch(authCodeUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: 'organization',
                response_type: 'code',
                redirect_uri: 'https://haiiloplugin.netlify.app/callback', // Replace with your redirect URI
                scope: 'plugin:notify'
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch authorization code: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Authorization Code:', data.code); // Debugging
        return data.code; // Assuming the response contains the authorization code
    } catch (error) {
        console.error('Error fetching authorization code:', error);
        throw error;
    }
}

// Function to refresh the access token
async function refreshAccessToken() {
    try {
        const haiiloTokenUrl = 'https://asioso.coyocloud.com/api/oauth/token';
        const clientId = 'organization';
        const clientSecret = '81dd0c6a-6fd9-43ff-878c-21327b07ae1b'; // Replace with the actual client secret
        const encodedCredentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        // Fetch a new authorization code
        const authorizationCode = await fetchAuthorizationCode();

        const response = await fetch(`${haiiloTokenUrl}?grant_type=authorization_code&code=${authorizationCode}`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${encodedCredentials}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to refresh access token:', errorText); // Debugging
            throw new Error(`Failed to refresh access token: ${response.statusText}`);
        }

        const data = await response.json();
        accessToken = data.access_token;
        tokenExpiryTime = Date.now() + data.expires_in * 1000; // Calculate token expiry time
        console.log('Access Token:', accessToken); // Debugging
    } catch (error) {
        console.error('Error refreshing access token:', error);
    }
}

// Middleware to ensure access token is available and valid
async function ensureAccessToken(req, res, next) {
    if (!accessToken || Date.now() >= tokenExpiryTime) {
        console.log('Refreshing access token...'); // Debugging
        await refreshAccessToken();
    }
    console.log('Access Token:', accessToken); // Debugging
    next();
}

// Function to validate JWT token
async function validateJwtToken(token) {
    try {
        // Fetch the public key
        const response = await axios.get(`${PUBLIC_KEY_URL}/.well-known/jwks.json`);
        const publicKey = response.data.keys[0]; // Assuming the first key is valid

        // Verify the token
        const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
        console.log('Token is valid:', decoded);
        return decoded;
    } catch (error) {
        console.error('JWT validation failed:', error);
        throw new Error('Invalid token');
    }
}

// Middleware to validate lifecycle event tokens
async function validateLifecycleToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1]; // Extract token from Authorization header
    if (!token) {
        return res.status(401).json({ error: 'Authorization token is missing' });
    }

    try {
        await validateJwtToken(token);
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
}

// Middleware to handle CORS
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://haiiloplugin.netlify.app'); // Allow requests from your frontend
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200); // Handle preflight requests
    }
    next();
});

// Endpoint to fetch all user directories
router.get('/userdirectories', ensureAccessToken, async (req, res) => {
    try {
        const haiiloApiUrl = `https://asioso.coyocloud.com/api/userdirectories`;
        const response = await fetch(haiiloApiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch user directories: ${response.statusText}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching user directories:', error);
        res.status(500).json({ error: 'Failed to fetch user directories' });
    }
});

// Endpoint to fetch all users
router.get('/users', ensureAccessToken, async (req, res) => {
    try {
        const haiiloApiUrl = `https://asioso.coyocloud.com/api/users`;
        const response = await fetch(haiiloApiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to fetch users:', errorText); // Debugging
            return res.status(response.status).json({ error: 'Failed to fetch users', details: errorText });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Example endpoint with token validation
router.post('/lifecycle-event', validateLifecycleToken, (req, res) => {
    res.header('Access-Control-Allow-Origin', 'https://haiiloplugin.netlify.app'); // Ensure CORS for POST
    res.status(200).json({ message: 'Lifecycle event processed successfully' });
});

module.exports = router;