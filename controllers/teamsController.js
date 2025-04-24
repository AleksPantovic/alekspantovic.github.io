const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'https://asioso.coyocloud.com';
const AUTH_URL = `${API_BASE_URL}/api/oauth/token`;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const SCOPE = process.env.SCOPE || 'plugin:notify';
const JKU_WHITELIST = ['https://plugins.coyoapp.com'];

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
router.post('/lifecycle/install', async (req, res) => {
    try {
        const decoded = jwt.decode(req.body.token, { complete: true });
        if (!decoded || !decoded.payload.iss.includes('coyo')) {
            throw new Error('Unsupported COYO instance');
        }
        console.log('Valid installation:', decoded.payload);
        res.status(201).json({ code: 100, message: 'ok' });
    } catch (error) {
        res.status(403).json({ error: 'Invalid token', details: error.message });
    }
});

module.exports = router;