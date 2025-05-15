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
        body: 'Method Not Allowed'
      };
    }

    const body = JSON.parse(event.body);
    const code = body.token || body.code;
    if (!code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing authorization code/token' })
      };
    }

    // Exchange the code for an access token
    const tokenRes = await axios.post(
      'https://asioso.coyocloud.com/api/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: process.env.HAIILO_CLIENT_ID,
        client_secret: process.env.HAIILO_CLIENT_SECRET
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    // Store the access token somewhere (in-memory for demo; use a DB for production)
    // For demo, just return it
    return {
      statusCode: 201,
      body: JSON.stringify({ access_token: tokenRes.data.access_token })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message, details: err.response?.data })
    };
  }
};
