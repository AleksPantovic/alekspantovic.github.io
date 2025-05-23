const fs = require('fs');
const path = require('path');
const axios = require('axios');

// This function must be called from your frontend as: /.netlify/functions/get-users
// Backend-to-backend: Uses a stored Haiilo access token (from the webhook flow)

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
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: 'Method Not Allowed',
    };
  }

  try {
    console.log('[get-users] Starting user fetch');
    // TEMP: Read token from file
    const tokenPath = path.join('/tmp', 'haiilo-token.txt');
    if (!fs.existsSync(tokenPath)) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Access token not available yet.' }),
      };
    }

    const haiiloAccessToken = fs.readFileSync(tokenPath, 'utf-8');
    const apiBaseUrl = process.env.API_BASE_URL || 'https://asioso.coyocloud.com';
    const usersApiUrl = `${apiBaseUrl}/api/users?page=0&size=10`;

    console.log('[get-users] Fetching users from Haiilo API...');
    const usersRes = await axios.get(usersApiUrl, {
      headers: { Authorization: `Bearer ${haiiloAccessToken}` },
    });
    console.log('[get-users] Users fetch successful, count:', Array.isArray(usersRes.data) ? usersRes.data.length : (usersRes.data?.content?.length || 0));
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(usersRes.data),
    };
  } catch (err) {
    console.error('[get-users] Backend error:', err.response?.data || err.message);
    if (err.response) {
      console.error('[get-users] Error response headers:', err.response.headers);
      console.error('[get-users] Error response data:', err.response.data);
      console.error('[get-users] Error response status:', err.response.status);
      console.error('[get-users] Error response config:', err.response.config);
    }
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message, details: err.response?.data }),
    };
  }
};
