const axios = require('axios');

// This function must be called from your frontend as: /.netlify/functions/get-users
// with the Authorization header set to the Haiilo JWT token.

exports.handler = async function (event) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Allow-Credentials': 'true',
      },
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: 'Method Not Allowed',
    };
  }

  // Read token from Authorization header
  const authHeader = event.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    return {
      statusCode: 401,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: 'Missing Authorization token',
    };
  }

  try {
    // Load credentials from environment variables
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const scope = process.env.SCOPE || 'plugin:notify';
    const apiBaseUrl = process.env.API_BASE_URL || 'https://asioso.coyocloud.com';
    const tokenUrl = `${apiBaseUrl}/auth/realms/coyo/protocol/openid-connect/token`;
    const usersApiUrl = `${apiBaseUrl}/api/users?page=0&size=10`;

    if (!clientId || !clientSecret) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing CLIENT_ID or CLIENT_SECRET in environment variables.' }),
      };
    }

    // Get access token from Haiilo
    const tokenRes = await axios.post(
      tokenUrl,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const haiiloAccessToken = tokenRes.data.access_token;

    // Fetch users from Haiilo API
    const usersRes = await axios.get(usersApiUrl, {
      headers: { Authorization: `Bearer ${haiiloAccessToken}` },
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(usersRes.data),
    };
  } catch (err) {
    console.error('Backend error:', err.response?.data || err.message);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: err.message, details: err.response?.data }),
    };
  }
};
