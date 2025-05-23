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
    console.log('[get-users] Starting user fetch');
    // Load credentials from environment variables
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const scope = process.env.SCOPE || 'plugin:notify';
    const apiBaseUrl = process.env.API_BASE_URL || 'https://asioso.coyocloud.com';
    const tokenUrl = `${apiBaseUrl}/auth/realms/coyo/protocol/openid-connect/token`;
    const usersApiUrl = `${apiBaseUrl}/api/users?page=0&size=10`;

    console.log('[get-users] Using tokenUrl:', tokenUrl);
    console.log('[get-users] Using usersApiUrl:', usersApiUrl);
    if (!clientId || !clientSecret) {
      console.error('[get-users] Missing CLIENT_ID or CLIENT_SECRET');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing CLIENT_ID or CLIENT_SECRET in environment variables.' }),
      };
    }

    // Option 1: Use OAuth2 client credentials to get access token and fetch users (default)
    console.log('[get-users] Requesting Haiilo access token...');
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
    console.log('[get-users] tokenRes.status:', tokenRes.status);
    console.log('[get-users] tokenRes.headers:', tokenRes.headers);
    console.log('[get-users] tokenRes.data:', tokenRes.data);
    console.log('[get-users] Received Haiilo access token');
    const haiiloAccessToken = tokenRes.data.access_token;
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

    // Option 2: If a valid Authorization token is provided, proxy the request using it
    // (Uncomment below to enable this logic)
    /*
    if (token) {
      console.log('[get-users] Proxying with provided token');
      const haiiloRes = await axios.get(usersApiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      console.log('[get-users] Proxy fetch successful, count:', Array.isArray(haiiloRes.data) ? haiiloRes.data.length : (haiiloRes.data?.content?.length || 0));
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(haiiloRes.data),
      };
    }
    */
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
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: err.message, details: err.response?.data }),
    };
  }
};
