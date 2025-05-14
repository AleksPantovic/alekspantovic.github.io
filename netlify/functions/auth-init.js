const axios = require('axios');
const jwt = require('jsonwebtoken');

const JKU_WHITELIST = [
  'https://plugins.coyoapp.com'
];

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method Not Allowed' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    const { token } = JSON.parse(event.body || '{}');
    if (!token) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing JWT token' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // OPTIONAL: Validate JWT signature using jku header
    const decoded = jwt.decode(token, { complete: true });
    const jku = decoded?.header?.jku;
    if (!jku || !JKU_WHITELIST.some(url => jku.startsWith(url))) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid or untrusted jku URL' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }
    // You can fetch the public key from jku and verify the signature here if needed

    // Exchange JWT for OAuth access token
    const clientId = 'organization';
    const clientSecret = '81dd0c6a-6fd9-43ff-878c-21327b07ae1b';
    const tokenUrl = 'https://asioso.coyocloud.com/api/oauth/token';

    const tokenResponse = await axios.post(tokenUrl, new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: token,
      client_id: clientId,
      client_secret: clientSecret,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const accessToken = tokenResponse.data.access_token;

    return {
      statusCode: 200,
      body: JSON.stringify({ accessToken }),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({
        error: 'Failed to exchange JWT for access token',
        details: error.response?.data || error.message,
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
