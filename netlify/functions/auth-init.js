const axios = require('axios');
const jwt = require('jsonwebtoken');

const JKU_WHITELIST = [
  'https://plugins.coyoapp.com'
];

exports.handler = async (event) => {
  console.log('[auth-init] Entered handler');
  try {
    if (event.httpMethod !== 'POST') {
      console.log('[auth-init] Method not allowed:', event.httpMethod);
      return {
        statusCode: 405,
        body: 'Method Not Allowed'
      };
    }

    const body = JSON.parse(event.body);
    const code = body.token || body.code;
    if (!code) {
      console.log('[auth-init] Missing authorization code/token');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing authorization code/token' })
      };
    }

    // Fetch session token from Haiilo using the user's session cookie
    console.log('[auth-init] Fetching session token from /web/authorization/token...');
    const haiiloRes = await axios.get(
      'https://asioso.coyocloud.com/web/authorization/token',
      {
        headers: {
          // Forward the user's cookies if present (for SSR/serverless only)
          Cookie: event.headers.cookie || ''
        },
        withCredentials: true
      }
    );

    // Always return HTTP 200 and a simple JSON body for Haiilo compatibility
    console.log('[auth-init] Session token fetch successful');
    return {
      statusCode: 200,
      body: JSON.stringify(haiiloRes.data)
    };
  } catch (err) {
    console.log('[auth-init] Error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message, details: err.response?.data })
    };
  }
};
