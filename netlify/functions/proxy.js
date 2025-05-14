const axios = require('axios');

exports.handler = async (event) => {
  try {
    // 1. Get JWT token from lifecycle event (assume POST with JSON body)
    let jwtToken;
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      jwtToken = body.token;
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Lifecycle JWT token required in POST body' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // 2. Exchange JWT for OAuth access token
    const clientId = 'organization';
    const clientSecret = '81dd0c6a-6fd9-43ff-878c-21327b07ae1b';
    const tokenUrl = 'https://asioso.coyocloud.com/api/oauth/token';

    const tokenResponse = await axios.post(tokenUrl, new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwtToken,
      client_id: clientId,
      client_secret: clientSecret,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const accessToken = tokenResponse.data.access_token;

    // 3. Use the access token to fetch /api/users
    const haiiloApiUrl = 'https://asioso.coyocloud.com/api/users';
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Accept-Version': '1.5.0',
      'Accept': 'application/json',
    };

    const response = await axios.get(haiiloApiUrl, { headers });

    return {
      statusCode: response.status,
      body: JSON.stringify(response.data),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({
        error: 'Failed to fetch data from Haiilo API',
        details: error.response?.data || error.message,
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
