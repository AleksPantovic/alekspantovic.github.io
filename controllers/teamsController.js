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
let tokenRefreshPromise = null;

const encodeCredentials = () => Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

async function getAccessToken() {
  try {
    const response = await axios.post(AUTH_URL,
      new URLSearchParams({
        grant_type: 'client_credentials',
        scope: SCOPE
      }), {
        headers: {
          Authorization: `Basic ${encodeCredentials()}`,
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

async function validateJwtToken(token) {
  try {
    const decodedHeader = jwt.decode(token, { complete: true });
    if (!JKU_WHITELIST.includes(decodedHeader?.header?.jku)) {
      throw new Error('Invalid jku URL');
    }

    const response = await axios.get(decodedHeader.header.jku);
    const publicKey = response.data.keys[0];
    return jwt.verify(token, publicKey, { algorithms: ['RS256'] });
  } catch (error) {
    console.error('JWT Validation Error:', error.message);
    throw new Error('Invalid token');
  }
}

router.get('/api/users', ensureAuth, async (req, res) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/users`, {
      headers: {
        Authorization: `Bearer ${req.accessToken}`,
        Accept: 'application/json'
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

router.post('/lifecycle/install', async (req, res) => {
  try {
    const decoded = await validateJwtToken(req.body.token);
    if (decoded.payload.iss.includes('coyo')) {
      console.log('Valid installation:', decoded.payload);
      return res.status(201).json({ code: 100, message: 'ok' });
    }
    res.status(400).json({ code: 101, message: 'Unsupported COYO instance' });
  } catch (error) {
    res.status(403).json({ error: 'Invalid token', details: error.message });
  }
});

module.exports = router;