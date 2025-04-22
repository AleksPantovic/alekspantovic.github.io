const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'https://asioso.coyocloud.com';
const AUTH_URL = `${API_BASE_URL}/api/oauth/token`;
const CLIENT_ID = process.env.CLIENT_ID || 'organization';
const CLIENT_SECRET = process.env.CLIENT_SECRET || '81dd0c6a-6fd9-43ff-878c-21327b07ae1b';
const SCOPE = process.env.SCOPE || 'plugin:notify';

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

// API Endpoints
router.get('/users', ensureAuth, async (req, res) => {
  console.log('Access Token:', req.accessToken); // Debugging
  try {
    const response = await axios.get(`${API_BASE_URL}/api/users`, {
      headers: {
        'Authorization': `Bearer ${req.accessToken}`,
        'Accept': 'application/json'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Users API Error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch users',
      details: error.response?.data || error.message
    });
  }
});

module.exports = router;