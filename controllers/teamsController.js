const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config(); // For environment variables

// Configuration
const PUBLIC_KEY_URL = process.env.PUBLIC_KEY_URL || 'https://plugins.coyoapp.com';
const HAILLO_BASE_URL = process.env.HAILLO_BASE_URL || 'https://asioso.coyocloud.com';
const CLIENT_ID = process.env.CLIENT_ID || 'organization';
const CLIENT_SECRET = process.env.CLIENT_SECRET || '81dd0c6a-6fd9-43ff-878c-21327b07ae1b';
const REDIRECT_URI = process.env.REDIRECT_URI || 'https://haiiloplugin.netlify.app/callback';

// Token management
let accessToken = null;
let tokenExpiryTime = null;

// Enhanced CORS Middleware
router.use((req, res, next) => {
    const allowedOrigins = [
        'https://haiiloplugin.netlify.app',
        'http://localhost:3000',
        'http://localhost:8080'
    ];
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Requested-With, X-Coyo-Context');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Vary', 'Origin');
    
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Max-Age', '86400');
        return res.status(204).send();
    }
    
    next();
});

// Global OPTIONS handler
router.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Requested-With');
    res.status(204).send();
});

// Token Management Functions
async function fetchAuthorizationCode() {
    try {
        const authCodeUrl = `${HAILLO_BASE_URL}/api/oauth/authorize`;
        const response = await fetch(authCodeUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_id: CLIENT_ID,
                response_type: 'code',
                redirect_uri: REDIRECT_URI,
                scope: 'plugin:notify'
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to fetch authorization code: ${errorData.message || response.statusText}`);
        }

        const data = await response.json();
        return data.code;
    } catch (error) {
        console.error('Authorization Code Error:', error);
        throw error;
    }
}

async function refreshAccessToken() {
    try {
        const tokenUrl = `${HAILLO_BASE_URL}/api/oauth/token`;
        const authorizationCode = await fetchAuthorizationCode();
        const encodedCredentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

        const response = await fetch(`${tokenUrl}?grant_type=authorization_code&code=${authorizationCode}`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${encodedCredentials}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Token refresh failed: ${errorData.message || response.statusText}`);
        }

        const data = await response.json();
        accessToken = data.access_token;
        tokenExpiryTime = Date.now() + (data.expires_in * 1000);
        return accessToken;
    } catch (error) {
        console.error('Token Refresh Error:', error);
        throw error;
    }
}

// Middleware to ensure valid access token
async function ensureAccessToken(req, res, next) {
    try {
        if (!accessToken || Date.now() >= tokenExpiryTime) {
            await refreshAccessToken();
        }
        req.accessToken = accessToken; // Attach to request object
        next();
    } catch (error) {
        console.error('Access Token Middleware Error:', error);
        res.status(401).json({ 
            error: 'Authentication failed',
            details: error.message
        });
    }
}

// JWT Validation
async function validateJwtToken(token) {
    try {
        const response = await axios.get(`${PUBLIC_KEY_URL}/.well-known/jwks.json`);
        const jwks = response.data;
        
        // Find the correct key based on the token's kid
        const decodedToken = jwt.decode(token, { complete: true });
        const key = jwks.keys.find(k => k.kid === decodedToken.header.kid);
        
        if (!key) {
            throw new Error('Matching key not found in JWKS');
        }

        const publicKey = jwt.verify(token, key, { algorithms: ['RS256'] });
        return publicKey;
    } catch (error) {
        console.error('JWT Validation Error:', error);
        throw new Error('Invalid token: ' + error.message);
    }
}

// Lifecycle Token Validation Middleware
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
router.get('/userdirectories', ensureAccessToken, async (req, res) => {
    try {
        const response = await fetch(`${HAILLO_BASE_URL}/api/userdirectories`, {
            headers: {
                'Authorization': `Bearer ${req.accessToken}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('User Directories Error:', error);
        res.status(502).json({ 
            error: 'Failed to fetch user directories',
            details: error.message
        });
    }
});

router.get('/users', ensureAccessToken, async (req, res) => {
    try {
        const response = await fetch(`${HAILLO_BASE_URL}/api/users`, {
            headers: {
                'Authorization': `Bearer ${req.accessToken}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch users');
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Users Endpoint Error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch users',
            details: error.message
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

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        tokenValid: accessToken && Date.now() < tokenExpiryTime
    });
});

module.exports = router;