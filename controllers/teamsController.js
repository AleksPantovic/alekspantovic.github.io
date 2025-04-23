const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Configuration - Move these to environment variables
const API_BASE_URL = process.env.API_BASE_URL || 'https://asioso.coyocloud.com';
const AUTH_URL = `${API_BASE_URL}/api/oauth/token`;
const CLIENT_ID = process.env.CLIENT_ID || 'organization';
const CLIENT_SECRET = process.env.CLIENT_SECRET || '81dd0c6a-6fd9-43ff-878c-21327b07ae1b';
const SCOPE = process.env.SCOPE || 'plugin:notify';
const JKU_WHITELIST = ['https://plugins.coyoapp.com'];

// Token storage with concurrency protection
let tokenRefreshPromise = null;

// Helper function to encode credentials
const encodeCredentials = () => Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

// Improved token handling
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

    return {
      token: response.data.access_token,
      expiresIn: Date.now() + (response.data.expires_in * 1000)
    };
  } catch (error) {
    console.error('OAuth Error:', error.response?.data || error.message);
    throw new Error('Failed to obtain access token');
  }
}

// Enhanced auth middleware
async function ensureAuth(req, res, next) {
  try {
    if (!tokenRefreshPromise || (tokenRefreshPromise.expiresIn <= Date.now())) {
      tokenRefreshPromise = getAccessToken()
        .then(tokenData => {
          tokenData.expiresIn = Date.now() + (tokenData.expiresIn * 1000);
          return tokenData;
        });
    }

    const { token } = await tokenRefreshPromise;
    req.accessToken = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed', message: error.message });
  }
}

// API Endpoints
router.get('/api/users', ensureAuth, async (req, res) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/users`, {
      headers: {
        'Authorization': `Bearer ${req.accessToken}`,
        'Accept': 'application/json'
      }
    });
    res.json(response.data);
  } catch (error) {
    handleApiError(res, error, 'Failed to fetch users');
  }
});

// Lifecycle Events
router.post('/lifecycle/install', validateLifecycleToken, async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = await validateJwtToken(token);
    
    if (decoded.payload.iss.includes('coyo')) {
      console.log('Valid installation for:', decoded.payload);
      return res.status(201).json({ code: 100, message: 'ok' });
    }
    
    console.log('Invalid issuer:', decoded.payload.iss);
    res.status(400).json({ code: 101, message: 'Unsupported COYO instance' });
  } catch (error) {
    handleApiError(res, error, 'Installation failed');
  }
});

// Generic error handler
function handleApiError(res, error, defaultMessage) {
  console.error(error);
  const status = error.response?.status || 500;
  const data = error.response?.data || { message: error.message };
  res.status(status).json({ error: defaultMessage, details: data });
}

module.exports = router;