const axios = require('axios');

exports.handler = async (event) => {
  try {
    // Optional: Validate lifecycle event type if present
    const allowedEvents = ['install', 'uninstall', 'instance_add', 'instance_remove'];
    let eventType;
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      eventType = body.eventType;
      if (eventType && !allowedEvents.includes(eventType)) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: `Invalid lifecycle event type: ${eventType}` }),
          headers: { 'Content-Type': 'application/json' }
        };
      }
    }

    // 1. Get OAuth token using client credentials
    const clientId = 'organization';
    const clientSecret = '81dd0c6a-6fd9-43ff-878c-21327b07ae1b';
    const tokenUrl = 'https://asioso.coyocloud.com/api/oauth/token';

    const tokenResponse = await axios.post(tokenUrl, new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'plugin:notify'
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const accessToken = tokenResponse.data.access_token;

    // 2. Use the access token to fetch /api/users
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
